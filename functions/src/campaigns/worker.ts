import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

if (!admin.apps.length) {
    admin.initializeApp();
}

// ==================== CONSTANTES ANTI-BAN ====================

const CONFIG = {
    // Delays entre mensagens (segundos)
    MIN_DELAY: 45,
    MAX_DELAY: 120,

    // Batch size (quantos contatos processar por execução)
    BATCH_SIZE: 20,

    // Pause longa após PAUSE_AFTER_COUNT mensagens
    PAUSE_AFTER_COUNT_MIN: 15,
    PAUSE_AFTER_COUNT_MAX: 25,

    // Duração da pausa longa (minutos)
    LONG_PAUSE_MIN: 8,
    LONG_PAUSE_MAX: 18,

    // Horários de pico (adiciona 20% ao delay)
    PEAK_HOURS: [
        { start: 12, end: 14 }, // Almoço
        { start: 18, end: 20 }, // Fim do expediente
    ],

    // Presença simulada (segundos de "digitando")
    TYPING_DURATION_MIN: 2,
    TYPING_DURATION_MAX: 5,
};

// ==================== HELPERS ANTI-BAN ====================

/**
 * Gera delay aleatório com distribuição Gaussiana (mais natural)
 */
function gaussianDelay(min: number, max: number): number {
    // Box-Muller transform para distribuição normal
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    // Mapear para o range desejado (média no centro)
    const mean = (min + max) / 2;
    const stdDev = (max - min) / 4; // 95% dos valores dentro do range
    let delay = mean + z0 * stdDev;

    // Clamp para garantir limites
    delay = Math.max(min, Math.min(max, delay));

    return Math.round(delay);
}

/**
 * Verifica se está em horário de pico e ajusta delay
 */
function adjustForPeakHours(delaySeconds: number): number {
    const now = new Date();
    const hour = now.getHours();

    for (const peak of CONFIG.PEAK_HOURS) {
        if (hour >= peak.start && hour < peak.end) {
            // Adiciona 20% ao delay em horário de pico
            return Math.round(delaySeconds * 1.2);
        }
    }
    return delaySeconds;
}

/**
 * Calcula delay humanizado para próxima mensagem
 */
function getHumanizedDelay(): number {
    const baseDelay = gaussianDelay(CONFIG.MIN_DELAY, CONFIG.MAX_DELAY);
    return adjustForPeakHours(baseDelay);
}

/**
 * Gera duração aleatória para simular digitação
 */
function getTypingDuration(): number {
    return gaussianDelay(CONFIG.TYPING_DURATION_MIN, CONFIG.TYPING_DURATION_MAX);
}

// ==================== UAZAPI HELPERS ====================

interface UazapiInstance {
    apiUrl: string;
    apiKey: string;
}

async function getInstanceConfig(ownerId: string): Promise<UazapiInstance | null> {
    const doc = await admin.firestore().collection('instances').doc(ownerId).get();
    if (!doc.exists) return null;

    const data = doc.data();
    return {
        apiUrl: data?.apiUrl || '',
        apiKey: data?.apikey || '',
    };
}

/**
 * Sincroniza contato na agenda da instância (Anti-Ban)
 * POST /contact/add
 */
async function syncContactToPhonebook(
    instance: UazapiInstance,
    phone: string,
    name: string
): Promise<boolean> {
    try {
        const response = await fetch(`${instance.apiUrl}/contact/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': instance.apiKey,
            },
            body: JSON.stringify({
                phone: phone.replace('+', ''),
                name: name,
            }),
        });

        if (!response.ok) {
            console.warn(`[SyncContact] Failed for ${phone}: ${response.status}`);
            return false;
        }
        return true;
    } catch (err) {
        console.error('[SyncContact] Error:', err);
        return false;
    }
}

/**
 * Simula presença "digitando..." antes de enviar
 * POST /presence
 */
async function simulateTyping(
    instance: UazapiInstance,
    phone: string,
    durationSeconds: number
): Promise<void> {
    try {
        await fetch(`${instance.apiUrl}/presence`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': instance.apiKey,
            },
            body: JSON.stringify({
                phone: phone.replace('+', ''),
                presence: 'composing',
            }),
        });

        // Aguardar duração da "digitação"
        await new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));

    } catch (err) {
        // Não é crítico, apenas logar
        console.warn('[SimulateTyping] Error:', err);
    }
}

/**
 * Envia mensagem de texto via UAZAPI
 * POST /message/sendText
 */
async function sendTextMessage(
    instance: UazapiInstance,
    phone: string,
    message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        const response = await fetch(`${instance.apiUrl}/message/sendText`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': instance.apiKey,
            },
            body: JSON.stringify({
                phone: phone.replace('+', ''),
                message: message,
            }),
        });

        const result = await response.json();

        if (!response.ok || result.error) {
            return { success: false, error: result.error || 'Unknown error' };
        }

        return { success: true, messageId: result.key?.id };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ==================== AUDIENCE RESOLUTION ====================

interface ContactToSend {
    id: string;
    name: string;
    phone: string;
}

/**
 * Resolve a lista de contatos a enviar baseado nos targets da campanha
 */
async function resolveAudience(
    ownerId: string,
    targetCategoryIds: string[],
    targetContactIds: string[]
): Promise<ContactToSend[]> {
    const firestore = admin.firestore();
    const contactsRef = firestore.collection('clients').doc(ownerId).collection('contacts');
    const contacts: ContactToSend[] = [];
    const seenIds = new Set<string>();

    // 1. Contatos explícitos (IDs diretos - Story 5.1 / 5.5)
    if (targetContactIds && targetContactIds.length > 0) {
        for (const id of targetContactIds) {
            if (seenIds.has(id)) continue;

            const doc = await contactsRef.doc(id).get();
            if (doc.exists) {
                const data = doc.data();
                contacts.push({
                    id: doc.id,
                    name: data?.name || 'Sem Nome',
                    phone: data?.phone || '',
                });
                seenIds.add(id);
            }
        }
    }

    // 2. Contatos por categoria
    if (targetCategoryIds && targetCategoryIds.length > 0) {
        const snapshot = await contactsRef
            .where('categoryIds', 'array-contains-any', targetCategoryIds)
            .get();

        for (const doc of snapshot.docs) {
            if (seenIds.has(doc.id)) continue;

            const data = doc.data();
            contacts.push({
                id: doc.id,
                name: data?.name || 'Sem Nome',
                phone: data?.phone || '',
            });
            seenIds.add(doc.id);
        }
    }

    return contacts;
}

/**
 * Cloud Function Triggered by Cloud Tasks to start/continue a campaign.
 * HTTP function (not onCall) because Cloud Tasks invokes via HTTP.
 */
export const startCampaignWorker = onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    const { campaignId, ownerId, action, batchIndex = 0 } = req.body as {
        campaignId: string;
        ownerId: string;
        action: string;
        batchIndex?: number;
    };

    if (!campaignId || !['START', 'CONTINUE'].includes(action)) {
        res.status(400).send('Invalid payload');
        return;
    }

    console.log(`[Worker] Action: ${action}, Campaign: ${campaignId}, Batch: ${batchIndex}`);

    const firestore = admin.firestore();

    try {
        // 1. Buscar campanha
        const campaignRef = firestore.collection('campaigns').doc(campaignId);
        const campaignDoc = await campaignRef.get();

        if (!campaignDoc.exists) {
            console.error(`Campaign ${campaignId} not found`);
            res.status(404).send('Campaign not found');
            return;
        }

        const campaign = campaignDoc.data()!;

        // 2. Verificar status
        if (!['scheduled', 'sending'].includes(campaign.status)) {
            console.warn(`Campaign ${campaignId} is in state: ${campaign.status}. Skipping.`);
            res.status(200).send('Campaign not in sendable state');
            return;
        }

        // 3. Buscar instância UAZAPI
        const instance = await getInstanceConfig(ownerId);
        if (!instance || !instance.apiUrl) {
            console.error(`No UAZAPI instance configured for owner ${ownerId}`);
            await campaignRef.update({
                status: 'paused',
                pauseReason: 'error',
                errorMessage: 'Instância UAZAPI não configurada',
            });
            res.status(400).send('No instance configured');
            return;
        }

        // 4. Resolver audiência (apenas na primeira execução ou se não tiver cache)
        let allContacts: ContactToSend[];

        if (campaign._resolvedContacts && campaign._resolvedContacts.length > 0) {
            // Usar cache
            allContacts = campaign._resolvedContacts;
        } else {
            // Resolver pela primeira vez
            allContacts = await resolveAudience(
                ownerId,
                campaign.targetCategoryIds || [],
                campaign.targetContactIds || []
            );

            // Salvar cache e total
            await campaignRef.update({
                _resolvedContacts: allContacts,
                'stats.total': allContacts.length,
                status: 'sending',
                startedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        console.log(`[Worker] Total contacts: ${allContacts.length}, Starting from: ${campaign.lastContactIndex || 0}`);

        // 5. Determinar slice do batch
        const startIndex = campaign.lastContactIndex || 0;
        const endIndex = Math.min(startIndex + CONFIG.BATCH_SIZE, allContacts.length);
        const batchContacts = allContacts.slice(startIndex, endIndex);

        if (batchContacts.length === 0) {
            // Campanha concluída!
            await campaignRef.update({
                status: 'completed',
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`[Worker] Campaign ${campaignId} completed!`);
            res.status(200).send('Campaign completed');
            return;
        }

        // 6. Processar batch
        let sentInBatch = 0;
        let failedInBatch = 0;

        for (let i = 0; i < batchContacts.length; i++) {
            const contact = batchContacts[i];

            // Verificar se ainda está "sending" (pode ter sido pausado manualmente)
            if (i > 0 && i % 5 === 0) {
                const freshDoc = await campaignRef.get();
                if (freshDoc.data()?.status !== 'sending') {
                    console.log(`[Worker] Campaign paused externally. Stopping batch.`);
                    break;
                }
            }

            // Anti-Ban: Sincronizar contato na agenda
            await syncContactToPhonebook(instance, contact.phone, contact.name);

            // Anti-Ban: Simular digitação
            const typingDuration = getTypingDuration();
            await simulateTyping(instance, contact.phone, typingDuration);

            // Enviar mensagem
            const messageToSend = campaign.content
                .replace(/{nome}/g, contact.name.split(' ')[0])
                .replace(/{saudacao}/g, getGreeting());

            const result = await sendTextMessage(instance, contact.phone, messageToSend);

            // Registrar log individual
            await firestore.collection('campaigns').doc(campaignId).collection('send_logs').add({
                contactId: contact.id,
                contactName: contact.name,
                contactPhone: contact.phone,
                status: result.success ? 'sent' : 'failed',
                messageId: result.messageId || null,
                errorMessage: result.error || null,
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            if (result.success) {
                sentInBatch++;
            } else {
                failedInBatch++;
            }

            // Atualizar progresso
            await campaignRef.update({
                lastContactIndex: startIndex + i + 1,
                'stats.sent': admin.firestore.FieldValue.increment(result.success ? 1 : 0),
                'stats.failed': admin.firestore.FieldValue.increment(result.success ? 0 : 1),
            });

            // Anti-Ban: Delay humanizado antes da próxima (se não for o último)
            if (i < batchContacts.length - 1) {
                const delay = getHumanizedDelay();
                console.log(`[Worker] Waiting ${delay}s before next message...`);
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }
        }

        console.log(`[Worker] Batch completed. Sent: ${sentInBatch}, Failed: ${failedInBatch}`);

        // 7. Verificar se precisa continuar
        const newLastIndex = startIndex + batchContacts.length;

        if (newLastIndex < allContacts.length) {
            // Ainda tem mais contatos - agendar próximo batch
            // Por simplicidade, vamos apenas retornar que precisa continuar
            // Em produção, aqui usaríamos Cloud Tasks para agendar o próximo batch

            console.log(`[Worker] More contacts remaining. Next batch starts at ${newLastIndex}`);

            // Auto-continue (simplificado - em produção seria Cloud Task)
            // Pausa curta entre batches (simula "Coffee Break" light)
            res.status(200).json({
                status: 'batch_complete',
                nextBatchIndex: newLastIndex,
                totalContacts: allContacts.length,
                message: 'Ready for next batch. Schedule CONTINUE action.',
            });
        } else {
            // Concluído!
            await campaignRef.update({
                status: 'completed',
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            res.status(200).json({
                status: 'campaign_complete',
                totalSent: campaign.stats?.sent || 0,
            });
        }

    } catch (error) {
        console.error('[Worker] Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// ==================== HELPER FUNCTIONS ====================

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
}

/**
 * Pub/Sub Trigger para processar campanhas agendadas
 * Roda a cada 5 minutos via Cloud Scheduler
 */
export const checkScheduledCampaigns = onSchedule('every 5 minutes', async () => {
    const now = admin.firestore.Timestamp.now();
    const firestore = admin.firestore();

    const scheduledCampaigns = await firestore
        .collection('campaigns')
        .where('status', '==', 'scheduled')
        .where('scheduledAt', '<=', now)
        .get();

    console.log(`[Scheduler] Found ${scheduledCampaigns.size} campaigns to start`);

    for (const doc of scheduledCampaigns.docs) {
        // Trigger worker via HTTP (internal call)
        // Em produção, usaríamos Cloud Tasks para maior confiabilidade
        try {
            // For now, just flip to sending and let next check handle it
            await doc.ref.update({ status: 'sending' });
            console.log(`[Scheduler] Started campaign ${doc.id}`);
        } catch (err) {
            console.error(`[Scheduler] Error starting campaign ${doc.id}:`, err);
        }
    }
});
