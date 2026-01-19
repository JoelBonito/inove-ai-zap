import { CloudTasksClient } from '@google-cloud/tasks';
import * as functions from 'firebase-functions';
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
export const scheduleCampaignStart = async (campaignId: string, scheduledAt: Date, ownerId: string) => {
    if (!PROJECT_ID) {
        console.warn('GCLOUD_PROJECT not set, skipping task creation (Emulator/Dev)');
        return null;
    }

    const queuePath = tasksClient.queuePath(PROJECT_ID, LOCATION, 'default');

    // Construct the URL for the startCampaignWorker function
    // Assuming region us-central1
    const url = `https://${LOCATION}-${PROJECT_ID}.cloudfunctions.net/startCampaignWorker`;

    const payload = {
        campaignId,
        ownerId,
        action: 'START'
    };

    const task = {
        httpRequest: {
            httpMethod: 'POST' as const,
            url,
            body: Buffer.from(JSON.stringify(payload)).toString('base64'),
            headers: {
                'Content-Type': 'application/json',
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
        console.log(`Created task ${response.name} for campaign ${campaignId} at ${scheduledAt.toISOString()}`);
        return response.name;
    } catch (error) {
        console.error('Error creating Cloud Task:', error);
        throw new functions.https.HttpsError('internal', 'Failed to schedule campaign', error);
    }
};
