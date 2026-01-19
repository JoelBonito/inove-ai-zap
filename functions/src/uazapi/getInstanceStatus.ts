/**
 * Cloud Function: getInstanceStatus
 * 
 * HTTPS Callable que retorna o status atual da instância WhatsApp
 * incluindo QR Code atualizado se ainda estiver conectando.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { createUazapiClient } from './client';

interface GetInstanceStatusResponse {
    success: boolean;
    status: 'disconnected' | 'connecting' | 'connected';
    qrcode?: string;
    paircode?: string;
    profileName?: string;
    profilePicUrl?: string;
    phone?: string;
    isBusiness?: boolean;
    error?: string;
}

export const getInstanceStatus = onCall(
    async (request): Promise<GetInstanceStatusResponse> => {
        // Verificar autenticação
        if (!request.auth) {
            throw new HttpsError(
                'unauthenticated',
                'Usuário não autenticado'
            );
        }

        const uid = request.auth.uid;

        try {
            // Buscar credenciais da instância no Firestore
            const db = admin.firestore();
            const instanceDoc = await db.collection('instances').doc(uid).get();

            if (!instanceDoc.exists) {
                return {
                    success: true,
                    status: 'disconnected',
                    error: 'Instância não configurada',
                };
            }

            const instanceData = instanceDoc.data()!;
            const apiUrl = instanceData.apiUrl as string;
            const apiKey = instanceData.apikey as string;

            if (!apiUrl || !apiKey) {
                return {
                    success: false,
                    status: 'disconnected',
                    error: 'Credenciais UAZAPI incompletas',
                };
            }

            // Criar cliente UAZAPI e buscar status
            const client = createUazapiClient(apiUrl, apiKey);
            const response = await client.getStatus();
            const instance = response.instance;

            // Atualizar status no Firestore
            const updateData: Record<string, unknown> = {
                status: instance.status,
                lastSync: admin.firestore.FieldValue.serverTimestamp(),
            };

            // Atualizar dados do perfil se conectado
            if (instance.status === 'connected') {
                if (instance.profileName) updateData.name = instance.profileName;
                if (instance.profilePicUrl) updateData.profilePicUrl = instance.profilePicUrl;
            }

            await db.collection('instances').doc(uid).update(updateData);

            return {
                success: true,
                status: instance.status,
                qrcode: instance.qrcode,
                paircode: instance.paircode,
                profileName: instance.profileName,
                profilePicUrl: instance.profilePicUrl,
                isBusiness: instance.isBusiness,
            };

        } catch (error) {
            logger.error('Erro ao buscar status:', error);

            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

            return {
                success: false,
                status: 'disconnected',
                error: errorMessage,
            };
        }
    }
);
