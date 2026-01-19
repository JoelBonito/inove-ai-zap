/**
 * Módulo UAZAPI - Exportações
 * 
 * Cloud Functions para integração com a API UAZAPI (WhatsApp)
 */

export { generateQRCode } from './generateQRCode';
export { getInstanceStatus } from './getInstanceStatus';
export { uazapiWebhook } from './webhook';

// Re-exportar tipos e cliente para uso interno
export { UazapiClient, createUazapiClient } from './client';
export type {
    UazapiInstanceInfo,
    UazapiConnectResponse,
    UazapiStatusResponse,
    UazapiWebhookConfig,
    UazapiSendTextPayload,
    UazapiSendResponse,
} from './client';
