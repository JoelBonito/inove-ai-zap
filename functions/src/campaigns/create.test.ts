import * as admin from 'firebase-admin';
import { createCampaign } from './create';
import * as scheduler from './scheduler';

// Mock Firebase Admin
jest.mock('firebase-admin', () => {
    const setMock = jest.fn();
    const docMock = jest.fn(() => ({
        set: setMock,
        id: 'MOCK_CAMPAIGN_ID', // Add ID here
        exists: true,
        data: () => ({ status: 'scheduled' })
    }));
    const collectionMock = jest.fn(() => ({ doc: docMock }));
    return {
        firestore: Object.assign(
            () => ({ collection: collectionMock }),
            {
                FieldValue: {
                    serverTimestamp: jest.fn(() => 'MOCK_TIMESTAMP'),
                },
                Timestamp: {
                    fromDate: jest.fn((date) => date),
                },
                collection: collectionMock, // Add this for direct calls if any
            }
        ),
        initializeApp: jest.fn(),
        apps: [],
    };
});

// Mock Scheduler
jest.mock('./scheduler', () => ({
    scheduleCampaignStart: jest.fn(),
}));

// Mock Firebase Functions Test
// We can use the actual function if we mock the input context
// But firebase-functions-test SDK is better.
const test = require('firebase-functions-test')();

describe('createCampaign', () => {
    let oldConsoleLog: any;

    beforeAll(() => {
        oldConsoleLog = console.log;
        console.log = jest.fn();
    });

    afterAll(() => {
        console.log = oldConsoleLog;
        test.cleanup();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw error if user is not authenticated', async () => {
        const wrapped = test.wrap(createCampaign);
        const data = {};
        const context = { auth: null }; // No auth

        await expect(wrapped(data, context)).rejects.toThrow('User must be logged in');
    });

    it('should create a campaign without scheduling', async () => {
        const wrapped = test.wrap(createCampaign);
        const data = {
            name: 'Test Campaign',
            content: 'Hello',
            targetCategoryIds: ['cat1'],
            total: 100,
        };
        const context = { auth: { uid: 'user123' } };

        await wrapped(data, context);

        const firestore = admin.firestore();
        expect(firestore.collection).toHaveBeenCalledWith('campaigns');
        // @ts-ignore
        expect(firestore.collection('campaigns').doc).toHaveBeenCalled();

        // In my code: const campaignRef = admin.firestore().collection('campaigns').doc();
        // So doc() is called without args (auto-id)

        // Verify scheduler was NOT called
        expect(scheduler.scheduleCampaignStart).not.toHaveBeenCalled();
    });

    it('should create a campaign AND schedule task if scheduledAt is provided', async () => {
        const futureDate = new Date(Date.now() + 1000000).toISOString();
        const wrapped = test.wrap(createCampaign);
        const data = {
            name: 'Scheduled Campaign',
            content: 'Hello Future',
            targetCategoryIds: ['cat1'],
            total: 100,
            scheduledAt: futureDate,
        };
        const context = { auth: { uid: 'user123' } };

        (scheduler.scheduleCampaignStart as jest.Mock).mockResolvedValue('TASK-ID-123');

        await wrapped(data, context);

        expect(scheduler.scheduleCampaignStart).toHaveBeenCalledWith(
            expect.any(String), // campaignId
            expect.any(Date), // date
            'user123' // ownerId
        );
    });

    it('should throw error if scheduledAt is in the past', async () => {
        const pastDate = new Date(Date.now() - 1000000).toISOString();
        const wrapped = test.wrap(createCampaign);
        const data = {
            name: 'Past Campaign',
            content: 'Content',
            targetCategoryIds: ['123'],
            scheduledAt: pastDate,
        };
        const context = { auth: { uid: 'user123' } };

        await expect(wrapped(data, context)).rejects.toThrow('Scheduled time must be in the future');
    });
});
