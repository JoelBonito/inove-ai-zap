import * as admin from 'firebase-admin';

// Inicializar Firebase Admin (apenas uma vez)
if (!admin.apps.length) {
    admin.initializeApp();
}

// Campanhas
import { createCampaign } from './campaigns/create';
import { startCampaignWorker, checkScheduledCampaigns } from './campaigns/worker';

// UAZAPI (WhatsApp)
import { generateQRCode, getInstanceStatus, uazapiWebhook } from './uazapi';

export {
    // Campanhas
    createCampaign,
    startCampaignWorker,
    checkScheduledCampaigns,
    // UAZAPI
    generateQRCode,
    getInstanceStatus,
    uazapiWebhook,
};
