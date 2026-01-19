import { CloudTasksClient } from '@google-cloud/tasks';
import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
    admin.initializeApp();
}

const tasksClient = new CloudTasksClient();

// Configuration
const PROJECT_ID = process.env.GCLOUD_PROJECT;
const LOCATION = 'us-central1';

/**
 * Agenda o início de uma campanha usando Cloud Tasks.
 * @param campaignId ID da campanha
 * @param scheduledAt Date object para o início
 * @param ownerId ID do dono (tenant)
 */
export const scheduleCampaignStart = async (campaignId: string, scheduledAt: Date) => {
    if (!PROJECT_ID) {
        logger.warn('GCLOUD_PROJECT nao definido, pulando criacao de task (Emulator/Dev)');
        return null;
    }

    const taskToken = process.env.CLOUD_TASKS_TOKEN;
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.FIREBASE_EMULATOR_HUB;
    if (!taskToken && !isEmulator) {
        throw new HttpsError('failed-precondition', 'CLOUD_TASKS_TOKEN nao configurado');
    }

    // Usando a fila padrão criada pelo script de setup
    const queuePath = tasksClient.queuePath(PROJECT_ID, LOCATION, 'whatsapp-standard-queue');

    // Construct the URL for the startCampaignWorker function
    // Assuming region us-central1
    const url = `https://${LOCATION}-${PROJECT_ID}.cloudfunctions.net/startCampaignWorker`;

    const payload = {
        campaignId,
        action: 'START'
    };

    const task = {
        httpRequest: {
            httpMethod: 'POST' as const,
            url,
            body: Buffer.from(JSON.stringify(payload)).toString('base64'),
            headers: {
                'Content-Type': 'application/json',
                ...(taskToken ? { 'X-Inove-Task-Token': taskToken } : {}),
            },
            // Secure connection using OIDC
            oidcToken: {
                serviceAccountEmail: `${PROJECT_ID}@appspot.gserviceaccount.com`,
            },
        },
        scheduleTime: {
            seconds: Math.floor(scheduledAt.getTime() / 1000),
        },
    };

    try {
        const [response] = await tasksClient.createTask({ parent: queuePath, task });
        logger.info(`Task criada ${response.name} para campanha ${campaignId} em ${scheduledAt.toISOString()}`);
        return response.name;
    } catch (error) {
        logger.error('Erro ao criar Cloud Task', error);
        throw new HttpsError('internal', 'Failed to schedule campaign');
    }
};
