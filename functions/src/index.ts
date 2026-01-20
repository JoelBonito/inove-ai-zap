import * as admin from 'firebase-admin';

// Inicializar Firebase Admin (apenas uma vez)
if (!admin.apps.length) {
    admin.initializeApp();
}

// Campanhas
import { createCampaign } from './campaigns/create';
import { startCampaignWorker, checkScheduledCampaigns, onCampaignWrite } from './campaigns/worker';

// UAZAPI (WhatsApp)
import { generateQRCode, getInstanceStatus, uazapiWebhook } from './uazapi';

// Storage (utilitários)
import { configureStorageLifecycle } from './storage/lifecycle';

export {
    // Campanhas
    createCampaign,
    startCampaignWorker,
    checkScheduledCampaigns,
    onCampaignWrite,
    // UAZAPI
    generateQRCode,
    getInstanceStatus,
    uazapiWebhook,
    // Storage
    configureStorageLifecycle,
};
