import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { scheduleCampaignStart } from './scheduler';

if (!admin.apps.length) {
    admin.initializeApp();
}

interface CreateCampaignData {
    name: string;
    content: string;
    targetCategoryIds?: string[];
    targetContactList?: { name: string; phone: string }[];
    targetContactIds?: string[];
    status?: string;
    scheduledAt?: string;
    mediaUrl?: string;
    mediaType?: string;
}

/**
 * Cria uma nova campanha.
 * Se houver scheduledAt, agenda a Cloud Task.
 */
export const createCampaign = onCall<CreateCampaignData>(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in');
    }

    const {
        name,
        content,
        targetCategoryIds,
        targetContactList, // Story 5.5 - Array of {name, phone}
        targetContactIds, // Story 5.1/RF18b - IDs de contatos selecionados manualmente
        status = 'draft',
        scheduledAt, // Timestamp or ISO string
        mediaUrl,
        mediaType
    } = request.data;

    const ownerId = request.auth.uid; // Assuming direct owner or logic to get tenant ID

    // Basic validation
    if (!name || !content || (!targetCategoryIds && !targetContactList && !targetContactIds)) {
        throw new HttpsError('invalid-argument', 'Missing required fields (Category, Contact List or Manual Selection)');
    }

    let scheduleDate: Date | null = null;
    let initialStatus = status;

    if (scheduledAt) {
        scheduleDate = new Date(scheduledAt);
        // Verify if future
        if (scheduleDate.getTime() <= Date.now()) {
            throw new HttpsError('invalid-argument', 'Scheduled time must be in the future');
        }
        initialStatus = 'scheduled';
    }

    try {
        const firestore = admin.firestore();
        const campaignRef = firestore.collection('campaigns').doc();
        let taskId = null;

        // Story 5.5 - Process Quick List (Upsert)
        const finalContactIds: string[] = [];

        // 1. Add Manual Selected IDs (if any) - Story 5.1
        if (targetContactIds && Array.isArray(targetContactIds)) {
            finalContactIds.push(...targetContactIds);
        }

        if (targetContactList && Array.isArray(targetContactList)) {
            const batch = firestore.batch();
            const contactsRef = firestore.collection('clients').doc(ownerId).collection('contacts'); // Assuming structure

            // Note: In a real high-volume scenario, we should process this in chunks or separate function.
            // For now (Story 5.5), we iterate linearly or use Promise.all.
            // But to avoid too many reads, let's assume we standardise phones first.

            for (const contact of targetContactList) {
                if (!contact.phone) continue;

                // Simple normalization (ensure +55 or similar if needed, assuming frontend sent clean-ish data)
                // For a robust system, we would query by phone.
                const snapshot = await contactsRef.where('phone', '==', contact.phone).limit(1).get();

                if (!snapshot.empty) {
                    // Contact exists
                    finalContactIds.push(snapshot.docs[0].id);
                } else {
                    // Create new contact
                    const newDocRef = contactsRef.doc();
                    const newContactData = {
                        id: newDocRef.id,
                        name: contact.name || 'Sem Nome',
                        phone: contact.phone,
                        email: '',
                        tags: ['Importado via Campanha'], // Tag implicita
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    };
                    batch.set(newDocRef, newContactData);
                    finalContactIds.push(newDocRef.id);
                }
            }
            // Commit batch for new contacts
            await batch.commit();
        }

        const campaignData: Record<string, unknown> = {
            id: campaignRef.id,
            ownerId,
            name,
            content,
            targetCategoryIds: targetCategoryIds || [],
            targetContactIds: finalContactIds, // Hybrid model: specific IDs + Categories
            status: initialStatus,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            stats: {
                total: 0, // Will be calculated by worker or pre-calc
                sent: 0,
                failed: 0,
                pending: 0
            },
            mediaUrl: mediaUrl || null,
            mediaType: mediaType || null,
            scheduledAt: scheduleDate ? admin.firestore.Timestamp.fromDate(scheduleDate) : null
        };

        if (scheduleDate) {
            taskId = await scheduleCampaignStart(campaignRef.id, scheduleDate, ownerId);
            if (taskId) {
                campaignData.taskId = taskId;
            }
        }

        await campaignRef.set(campaignData);

        return { id: campaignRef.id, status: initialStatus };
    } catch (error) {
        console.error('Error creating campaign:', error);
        throw new HttpsError('internal', 'Unable to create campaign');
    }
});
