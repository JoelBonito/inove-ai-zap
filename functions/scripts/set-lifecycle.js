/**
 * Script para configurar lifecycle do Firebase Storage
 * Deleta arquivos em campaign-media/ após 2 dias (48h)
 */
const admin = require('firebase-admin');

const BUCKET_NAME = 'inove-ai-zap-2026.firebasestorage.app';

// Inicializa o Firebase Admin
admin.initializeApp({
    storageBucket: BUCKET_NAME
});

async function setLifecyclePolicy() {
    const bucket = admin.storage().bucket();

    console.log('Configurando lifecycle policy para:', bucket.name);

    const lifecycleRules = [
        {
            action: { type: 'Delete' },
            condition: {
                age: 2, // 2 dias = 48 horas
                matchesPrefix: ['campaign-media/']
            }
        }
    ];

    try {
        await bucket.setMetadata({
            lifecycle: {
                rule: lifecycleRules
            }
        });

        console.log('✅ Lifecycle policy configurada com sucesso!');
        console.log('- Arquivos em campaign-media/ serão deletados após 2 dias');

        // Verifica a configuração
        const [metadata] = await bucket.getMetadata();
        console.log('\nConfiguração atual:', JSON.stringify(metadata.lifecycle, null, 2));

    } catch (error) {
        console.error('❌ Erro ao configurar lifecycle:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

setLifecyclePolicy();
