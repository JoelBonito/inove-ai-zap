import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

const BUCKET_NAME = 'inove-ai-zap-2026.firebasestorage.app';

/**
 * Função HTTP temporária para configurar lifecycle do Storage
 * Chame uma vez: https://us-central1-inove-ai-zap-2026.cloudfunctions.net/configureStorageLifecycle
 * Depois pode remover esta função
 */
export const configureStorageLifecycle = onRequest(async (req, res) => {
    try {
        const bucket = admin.storage().bucket(BUCKET_NAME);

        logger.info('Configurando lifecycle policy para:', bucket.name);

        const lifecycleRules = [
            {
                action: { type: 'Delete' as const },
                condition: {
                    age: 2, // 2 dias = 48 horas
                    matchesPrefix: ['campaign-media/']
                }
            }
        ];

        await bucket.setMetadata({
            lifecycle: {
                rule: lifecycleRules
            }
        });

        logger.info('✅ Lifecycle policy configurada com sucesso!');

        // Verifica a configuração
        const [metadata] = await bucket.getMetadata();

        res.json({
            success: true,
            message: 'Lifecycle configurado! Arquivos em campaign-media/ serão deletados após 2 dias.',
            lifecycle: metadata.lifecycle
        });

    } catch (error: any) {
        logger.error('❌ Erro ao configurar lifecycle:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
