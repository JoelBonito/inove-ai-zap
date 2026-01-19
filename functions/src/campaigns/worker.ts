import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { z } from 'zod';

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

const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || Boolean(process.env.FIREBASE_EMULATOR_HUB);
const workerPayloadSchema = z.object({
    campaignId: z.string().min(1),
    action: z.enum(['START', 'CONTINUE']),
    batchIndex: z.number().int().nonnegative().optional(),
}).passthrough();

function validateTaskToken(reqToken?: string | string[]) {
    const expectedToken = process.env.CLOUD_TASKS_TOKEN;
    if (!expectedToken) {
        return isEmulator;
    }

    if (Array.isArray(reqToken)) {
        return reqToken.some((token) => token === expectedToken);
    }

    return reqToken === expectedToken;
}

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
        apiKey: data?.apiKey || data?.apikey || '',
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
            logger.warn(`[SyncContact] Falha para ${phone}: ${response.status}`);
            return false;
        }
        return true;
    } catch (err) {
        logger.error('[SyncContact] Erro', err);
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
        logger.warn('[SimulateTyping] Erro', err);
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
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: message };
    }
}

// ==================== AUDIENCE RESOLUTION ====================

interface ContactToSend {
    id: string;
    name: string;
    phone: string;
}

/**
 * Resolve a lista de IDs de contatos a enviar baseado nos targets da campanha
 */
async function resolveAudienceIds(
    ownerId: string,
    targetCategoryIds: string[],
    targetContactIds: string[]
): Promise<string[]> {
    const firestore = admin.firestore();
    const contactsRef = firestore.collection('clients').doc(ownerId).collection('contacts');
    const contactIds: string[] = [];
    const seenIds = new Set<string>();

    // 1. Contatos explícitos (IDs diretos - Story 5.1 / 5.5)
    if (targetContactIds && targetContactIds.length > 0) {
        for (const id of targetContactIds) {
            if (seenIds.has(id)) continue;
            contactIds.push(id);
            seenIds.add(id);
        }
    }

    // 2. Contatos por categoria
    if (targetCategoryIds && targetCategoryIds.length > 0) {
        const snapshot = await contactsRef
            .where('categoryIds', 'array-contains-any', targetCategoryIds)
            .get();

        for (const doc of snapshot.docs) {
            if (seenIds.has(doc.id)) continue;
            contactIds.push(doc.id);
            seenIds.add(doc.id);
        }
    }

    return contactIds;
}

async function fetchContactsByIds(ownerId: string, contactIds: string[]): Promise<ContactToSend[]> {
    const firestore = admin.firestore();
    const contactsRef = firestore.collection('clients').doc(ownerId).collection('contacts');
    const chunks: string[][] = [];
    const chunkSize = 10;

    for (let i = 0; i < contactIds.length; i += chunkSize) {
        chunks.push(contactIds.slice(i, i + chunkSize));
    }

    const contactMap = new Map<string, ContactToSend>();
    for (const chunk of chunks) {
        const snapshot = await contactsRef
            .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
            .get();

        for (const doc of snapshot.docs) {
            const data = doc.data();
            contactMap.set(doc.id, {
                id: doc.id,
                name: data?.name || 'Sem Nome',
                phone: data?.phone || '',
            });
        }
    }

    return contactIds
        .map((id) => contactMap.get(id))
        .filter((contact): contact is ContactToSend => Boolean(contact));
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

    if (!validateTaskToken(req.header('x-inove-task-token'))) {
        res.status(401).send('Unauthorized');
        return;
    }

    const parsed = workerPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).send('Invalid payload');
        return;
    }

    const { campaignId, action, batchIndex = 0 } = parsed.data;

    logger.info(`[Worker] Action: ${action}, Campaign: ${campaignId}, Batch: ${batchIndex}`);

    const firestore = admin.firestore();

    try {
        // 1. Buscar campanha
        const campaignRef = firestore.collection('campaigns').doc(campaignId);
        const campaignDoc = await campaignRef.get();

        if (!campaignDoc.exists) {
            logger.error(`Campaign ${campaignId} not found`);
            res.status(404).send('Campaign not found');
            return;
        }

        const campaign = campaignDoc.data();
        if (!campaign) {
            res.status(404).send('Campaign not found');
            return;
        }

        const ownerId = campaign.ownerId as string | undefined;
        if (!ownerId) {
            logger.error(`Campaign ${campaignId} sem ownerId`);
            res.status(400).send('Campaign missing ownerId');
            return;
        }

        // 2. Verificar status
        if (!['scheduled', 'sending'].includes(campaign.status)) {
            logger.warn(`Campaign ${campaignId} is in state: ${campaign.status}. Skipping.`);
            res.status(200).send('Campaign not in sendable state');
            return;
        }

        // 3. Buscar instância UAZAPI
        const instance = await getInstanceConfig(ownerId);
        if (!instance || !instance.apiUrl) {
            logger.error(`No UAZAPI instance configured for owner ${ownerId}`);
            await campaignRef.update({
                status: 'paused',
                pauseReason: 'error',
                errorMessage: 'Instância UAZAPI não configurada',
            });
            res.status(400).send('No instance configured');
            return;
        }

        // 4. Resolver audiência (apenas na primeira execução ou se não tiver cache)
        let resolvedContactIds: string[] = Array.isArray(campaign._resolvedContactIds)
            ? campaign._resolvedContactIds
            : [];

        if (resolvedContactIds.length === 0 && Array.isArray(campaign._resolvedContacts)) {
            resolvedContactIds = campaign._resolvedContacts
                .map((contact: ContactToSend) => contact.id)
                .filter(Boolean);
            await campaignRef.update({
                _resolvedContactIds: resolvedContactIds,
                _resolvedContacts: admin.firestore.FieldValue.delete(),
            });
        }

        if (resolvedContactIds.length === 0) {
            resolvedContactIds = await resolveAudienceIds(
                ownerId,
                campaign.targetCategoryIds || [],
                campaign.targetContactIds || []
            );

            // Salvar cache (somente IDs) e total
            await campaignRef.update({
                _resolvedContactIds: resolvedContactIds,
                'stats.total': resolvedContactIds.length,
                status: 'sending',
                startedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        logger.info(`[Worker] Total contacts: ${resolvedContactIds.length}, Starting from: ${campaign.lastContactIndex || 0}`);

        // 5. Determinar slice do batch
        const startIndex = campaign.lastContactIndex || 0;
        const endIndex = Math.min(startIndex + CONFIG.BATCH_SIZE, resolvedContactIds.length);
        const batchIds = resolvedContactIds.slice(startIndex, endIndex);
        const batchContacts = await fetchContactsByIds(ownerId, batchIds);

        if (batchContacts.length === 0) {
            // Campanha concluída!
            await campaignRef.update({
                status: 'completed',
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            logger.info(`[Worker] Campaign ${campaignId} completed!`);
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
                    logger.info(`[Worker] Campaign paused externally. Stopping batch.`);
                    break;
                }
            }

            if (!contact.phone) {
                failedInBatch++;
                await campaignRef.update({
                    lastContactIndex: startIndex + i + 1,
                    'stats.failed': admin.firestore.FieldValue.increment(1),
                });
                continue;
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
                logger.info(`[Worker] Waiting ${delay}s before next message...`);
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }
        }

        logger.info(`[Worker] Batch completed. Sent: ${sentInBatch}, Failed: ${failedInBatch}`);

        // 7. Verificar se precisa continuar
        const newLastIndex = startIndex + batchContacts.length;

        if (newLastIndex < resolvedContactIds.length) {
            // Ainda tem mais contatos - agendar próximo batch
            // Por simplicidade, vamos apenas retornar que precisa continuar
            // Em produção, aqui usaríamos Cloud Tasks para agendar o próximo batch

            logger.info(`[Worker] More contacts remaining. Next batch starts at ${newLastIndex}`);

            // Auto-continue (simplificado - em produção seria Cloud Task)
            // Pausa curta entre batches (simula "Coffee Break" light)
            res.status(200).json({
                status: 'batch_complete',
                nextBatchIndex: newLastIndex,
                totalContacts: resolvedContactIds.length,
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
        logger.error('[Worker] Error', error);
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

    logger.info(`[Scheduler] Found ${scheduledCampaigns.size} campaigns to start`);

    for (const doc of scheduledCampaigns.docs) {
        // Trigger worker via HTTP (internal call)
        // Em produção, usaríamos Cloud Tasks para maior confiabilidade
        try {
            // For now, just flip to sending and let next check handle it
            await doc.ref.update({ status: 'sending' });
            logger.info(`[Scheduler] Started campaign ${doc.id}`);
        } catch (err) {
            logger.error(`[Scheduler] Error starting campaign ${doc.id}`, err);
        }
    }
});
