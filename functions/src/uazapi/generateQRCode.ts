/**
 * Cloud Function: generateQRCode
 * 
 * HTTPS Callable que inicia o processo de conexão com WhatsApp
 * e retorna o QR Code para o frontend exibir.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { createUazapiClient } from './client';

interface GenerateQRCodeRequest {
    phone?: string; // Opcional: se informado, gera código de pareamento
}

interface GenerateQRCodeResponse {
    success: boolean;
    qrcode?: string;
    paircode?: string;
    status: 'disconnected' | 'connecting' | 'connected';
    error?: string;
}

export const generateQRCode = onCall<GenerateQRCodeRequest>(
    async (request): Promise<GenerateQRCodeResponse> => {
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
                throw new HttpsError(
                    'not-found',
                    'Instância UAZAPI não configurada para este usuário'
                );
            }

            const instanceData = instanceDoc.data()!;
            const apiUrl = instanceData.apiUrl as string;
            const apiKey = instanceData.apikey as string;

            if (!apiUrl || !apiKey) {
                throw new HttpsError(
                    'failed-precondition',
                    'Credenciais UAZAPI incompletas'
                );
            }

            // Criar cliente UAZAPI e conectar
            const client = createUazapiClient(apiUrl, apiKey);
            const response = await client.connect(request.data.phone);

            // Atualizar status no Firestore
            await db.collection('instances').doc(uid).update({
                status: response.instance.status,
                lastSync: admin.firestore.FieldValue.serverTimestamp(),
            });

            return {
                success: true,
                qrcode: response.instance.qrcode,
                paircode: response.instance.paircode,
                status: response.instance.status,
            };

        } catch (error) {
            logger.error('Erro ao gerar QR Code:', error);

            if (error instanceof HttpsError) {
                throw error;
            }

            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

            return {
                success: false,
                status: 'disconnected',
                error: errorMessage,
            };
        }
    }
);
