/**
 * Cloud Function: uazapiWebhook
 * 
 * HTTP Trigger (público) que recebe eventos da UAZAPI.
 * Processa eventos de conexão e atualiza o Firestore.
 */

import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Tipos dos eventos de webhook da UAZAPI
interface UazapiWebhookPayload {
    event: 'connection' | 'messages' | 'messages_update' | 'call' | 'presence';
    instance?: {
        id: string;
        token: string;
        status: 'disconnected' | 'connecting' | 'connected';
        profileName?: string;
        owner?: string;
        lastDisconnectReason?: string;
    };
    data?: unknown;
}

/**
 * Webhook HTTP público para receber eventos da UAZAPI
 */
export const uazapiWebhook = onRequest(async (req, res) => {
    // Apenas POST é aceito
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const payload = req.body as UazapiWebhookPayload;

        logger.info('Webhook UAZAPI recebido:', {
            event: payload.event,
            status: payload.instance?.status,
        });

        // Processar apenas eventos de conexão por enquanto
        if (payload.event === 'connection' && payload.instance) {
            await handleConnectionEvent(payload);
        }

        res.status(200).json({ success: true });

    } catch (error) {
        logger.error('Erro no webhook UAZAPI:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao processar webhook'
        });
    }
});

/**
 * Processa eventos de conexão/desconexão
 */
async function handleConnectionEvent(payload: UazapiWebhookPayload): Promise<void> {
    const instance = payload.instance!;
    const db = admin.firestore();

    // Buscar qual usuário possui esta instância pelo token
    const instancesSnapshot = await db.collection('instances')
        .where('apikey', '==', instance.token)
        .limit(1)
        .get();

    if (instancesSnapshot.empty) {
        logger.warn('Instância não encontrada para token:', instance.token?.substring(0, 8));
        return;
    }

    const instanceDoc = instancesSnapshot.docs[0];
    const uid = instanceDoc.id;
    const previousStatus = instanceDoc.data().status;

    // Atualizar status no Firestore
    const updateData: Record<string, unknown> = {
        status: instance.status,
        lastSync: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (instance.profileName) {
        updateData.name = instance.profileName;
    }

    if (instance.lastDisconnectReason) {
        updateData.lastDisconnectReason = instance.lastDisconnectReason;
        updateData.lastDisconnect = admin.firestore.FieldValue.serverTimestamp();
    }

    await db.collection('instances').doc(uid).update(updateData);

    logger.info(`Status atualizado para ${uid}: ${previousStatus} → ${instance.status}`);

    // Se desconectou, pausar campanhas ativas
    if (instance.status === 'disconnected' && previousStatus === 'connected') {
        await pauseActiveCampaigns(uid);
    }

    // Se reconectou, retomar campanhas pausadas por desconexão
    if (instance.status === 'connected' && previousStatus === 'disconnected') {
        await resumePausedCampaigns(uid);
    }
}

/**
 * Pausa todas as campanhas ativas do usuário
 */
async function pauseActiveCampaigns(uid: string): Promise<void> {
    const db = admin.firestore();

    const activeCampaigns = await db.collection('campaigns')
        .where('ownerId', '==', uid)
        .where('status', '==', 'Enviando')
        .get();

    if (activeCampaigns.empty) {
        return;
    }

    const batch = db.batch();

    activeCampaigns.docs.forEach((doc) => {
        batch.update(doc.ref, {
            status: 'Pausada',
            pauseReason: 'disconnected',
            pausedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });

    await batch.commit();

    logger.info(`Pausadas ${activeCampaigns.size} campanhas para ${uid} (desconexão)`);
}

/**
 * Retoma campanhas pausadas por desconexão
 */
async function resumePausedCampaigns(uid: string): Promise<void> {
    const db = admin.firestore();

    const pausedCampaigns = await db.collection('campaigns')
        .where('ownerId', '==', uid)
        .where('status', '==', 'Pausada')
        .where('pauseReason', '==', 'disconnected')
        .get();

    if (pausedCampaigns.empty) {
        return;
    }

    const batch = db.batch();

    pausedCampaigns.docs.forEach((doc) => {
        batch.update(doc.ref, {
            status: 'Enviando',
            pauseReason: admin.firestore.FieldValue.delete(),
            resumedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });

    await batch.commit();

    logger.info(`Retomadas ${pausedCampaigns.size} campanhas para ${uid} (reconexão)`);
}
