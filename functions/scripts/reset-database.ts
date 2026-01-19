/**
 * Script para limpar coleções do Firestore (Reset de Banco de Dados)
 * 
 * EXECUÇÃO:
 * cd functions
 * npx ts-node scripts/reset-database.ts
 */

import * as admin from 'firebase-admin';
import * as path from 'path';

// Inicializa o Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../service-account.json');

try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
} catch (error) {
    console.error('❌ Erro ao carregar service-account.json');
    process.exit(1);
}

const db = admin.firestore();

async function deleteCollection(collectionPath: string, batchSize: number = 100) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(db: admin.firestore.Firestore, query: admin.firestore.Query, resolve: any) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        resolve();
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}

async function resetAll() {
    console.log('🚀 Iniciando reset do banco de dados...');

    const collections = [
        'campaigns',
        'instance_status',
        // 'instances', // Descomente se quiser apagar as credenciais de API também
        'users'
    ];

    for (const collection of collections) {
        console.log(`🗑️ Apagando coleção: ${collection}...`);
        await deleteCollection(collection);
    }

    // Coleções aninhadas em 'clients'
    console.log('📂 Limpando dados de clientes (contatos e categorias)...');
    const clientsSnapshot = await db.collection('clients').get();

    for (const clientDoc of clientsSnapshot.docs) {
        // Apagar subcoleções de cada cliente
        console.log(`  👤 Limpando subcoleções do cliente: ${clientDoc.id}`);
        await deleteCollection(`clients/${clientDoc.id}/contacts`);
        await deleteCollection(`clients/${clientDoc.id}/categories`);
        // Apagar o documento do cliente em si
        await clientDoc.ref.delete();
    }

    console.log('\n✅ Banco de dados resetado com sucesso!');
    console.log('Agora você pode iniciar o teste de ponta a ponta com dados limpos.');
}

resetAll().then(() => process.exit(0)).catch((err) => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
