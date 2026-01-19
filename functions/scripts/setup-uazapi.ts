/**
 * Script para configurar credenciais UAZAPI no Firestore.
 * 
 * EXECUÇÃO:
 * npx ts-node scripts/setup-uazapi.ts
 * 
 * AMBIENTE:
 * Requer variáveis de ambiente ou parâmetros:
 * - OWNER_ID: ID do cliente (ou UID do Firebase Auth)
 * - UAZAPI_URL: URL da instância UAZAPI
 * - UAZAPI_KEY: Chave de API da UAZAPI
 */

import * as admin from 'firebase-admin';
import * as path from 'path';

// Inicializa o Firebase Admin com as credenciais do service account
const serviceAccountPath = path.resolve(__dirname, '../service-account.json');

try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
} catch (error) {
    console.error('❌ Erro ao carregar service-account.json');
    console.error('   Baixe o arquivo em: Console Firebase > Configurações > Contas de Serviço');
    process.exit(1);
}

const db = admin.firestore();

interface UazapiConfig {
    apiUrl: string;
    apikey: string;
    instanceName?: string;
    createdAt: admin.firestore.FieldValue;
    updatedAt: admin.firestore.FieldValue;
}

async function setupUazapiInstance(
    ownerId: string,
    apiUrl: string,
    apiKey: string,
    instanceName?: string
): Promise<void> {
    const config: UazapiConfig = {
        apiUrl,
        apikey: apiKey,
        instanceName: instanceName || 'default',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('instances').doc(ownerId).set(config, { merge: true });
    console.log(`✅ Instância UAZAPI configurada para owner: ${ownerId}`);
    console.log(`   URL: ${apiUrl}`);
    console.log(`   Key: ${apiKey.substring(0, 8)}...`);
}

// CLI Helper
async function main() {
    const args = process.argv.slice(2);

    if (args.length < 3) {
        console.log('');
        console.log('🔧 UAZAPI Setup Script');
        console.log('');
        console.log('Uso:');
        console.log('  npx ts-node scripts/setup-uazapi.ts <owner_id> <api_url> <api_key> [instance_name]');
        console.log('');
        console.log('Exemplo:');
        console.log('  npx ts-node scripts/setup-uazapi.ts user123 https://api.uazapi.com/instance/xyz abc123key "Minha Clínica"');
        console.log('');
        process.exit(1);
    }

    const [ownerId, apiUrl, apiKey, instanceName] = args;

    try {
        await setupUazapiInstance(ownerId, apiUrl, apiKey, instanceName);
        console.log('');
        console.log('🎉 Configuração concluída!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao configurar:', error);
        process.exit(1);
    }
}

main();
