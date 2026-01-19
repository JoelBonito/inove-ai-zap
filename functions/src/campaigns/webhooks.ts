import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { z } from 'zod';

if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Webhook para receber eventos da UAZAPI.
 * Registra o status da conexão (conected/disconnected) no Firestore.
 * 
 * Configurar na UAZAPI: https://us-central1-inove-ai-zap-2026.cloudfunctions.net/uazapiWebhook
 */
export const uazapiWebhook = onRequest(async (req, res) => {
    // A UAZAPI envia eventos via POST
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    const expectedToken = process.env.UAZAPI_WEBHOOK_TOKEN;
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || Boolean(process.env.FIREBASE_EMULATOR_HUB);
    const providedToken = req.header('x-uazapi-token');
    if (!isEmulator) {
        if (!expectedToken) {
            res.status(500).send('Webhook token not configured');
            return;
        }
        if (providedToken !== expectedToken) {
            res.status(401).send('Unauthorized');
            return;
        }
    }

    const eventSchema = z.object({
        instance: z.string().min(1),
        event: z.string().min(1),
        data: z.record(z.string(), z.unknown()).optional(),
    }).passthrough();

    const parsed = eventSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).send('Invalid payload');
        return;
    }

    const event = parsed.data;

    // Log do evento para debug inicial
    logger.info('[UAZAPI Webhook]', event);

    /**
     * Exemplo de payload de status da UAZAPI:
     * {
     *   "instance": "NI7a2O",
     *   "event": "connection.update",
     *   "data": {
     *     "state": "open", // ou "connecting", "close", "refused"
     *     "statusReason": 200
     *   }
     * }
     */

    try {
        const { instance, event: eventType, data } = event;

        if (eventType === 'connection.update') {
            const state = data?.state;
            const status = (state === 'open' || state === 'connected') ? 'connected' : 'disconnected';

            // Encontrar qual ownerId (clientId) pertence esta instância
            // No MVP, assumimos que 1 owner = 1 instância. 
            // Buscamos na coleção 'instances' pelo campo instanceId ou pelo ID do documento

            const db = admin.firestore();
            const instancesSnapshot = await db.collection('instances')
                .where('apiUrl', '>=', `https://free.uazapi.com/instance/${instance}`)
                .where('apiUrl', '<=', `https://free.uazapi.com/instance/${instance}\uf8ff`)
                .limit(1)
                .get();

            if (!instancesSnapshot.empty) {
                const ownerId = instancesSnapshot.docs[0].id;

                // Atualiza o status em tempo real
                await db.collection('instance_status').doc(ownerId).set({
                    status,
                    lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
                    rawState: state,
                    instanceId: instance
                }, { merge: true });

                logger.info(`[Webhook] Status da instancia ${instance} atualizado para ${status} (Owner: ${ownerId})`);
            } else {
                logger.warn(`[Webhook] Instancia ${instance} nao encontrada em nenhuma configuracao de cliente.`);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        logger.error('[Webhook] Erro ao processar', error);
        res.status(500).send('Internal Error');
    }
});
