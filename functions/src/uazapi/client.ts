/**
 * Cliente HTTP para a API UAZAPI
 * 
 * Centraliza todas as chamadas para a UAZAPI com:
 * - Autenticação via header token
 * - Tratamento de erros padronizado
 * - Tipagem dos responses
 */

import axios, { AxiosError } from 'axios';

// Tipos da UAZAPI baseados na especificação OpenAPI
export interface UazapiInstanceInfo {
    id: string;
    token: string;
    status: 'disconnected' | 'connecting' | 'connected';
    qrcode?: string;
    paircode?: string;
    name?: string;
    profileName?: string;
    profilePicUrl?: string;
    isBusiness?: boolean;
    owner?: string;
    lastDisconnect?: string;
    lastDisconnectReason?: string;
}

export interface UazapiConnectResponse {
    connected: boolean;
    loggedIn: boolean;
    jid: object | null;
    instance: UazapiInstanceInfo;
}

export interface UazapiStatusResponse {
    instance: UazapiInstanceInfo;
}

export interface UazapiWebhookConfig {
    id?: string;
    enabled: boolean;
    url: string;
    events: ('connection' | 'messages' | 'messages_update' | 'call' | 'contacts' | 'presence' | 'groups' | 'labels' | 'chats')[];
    excludeMessages?: ('wasSentByApi' | 'wasNotSentByApi' | 'fromMeYes' | 'fromMeNo' | 'isGroupYes' | 'isGroupNo')[];
    addUrlEvents?: boolean;
    addUrlTypesMessages?: boolean;
}

export interface UazapiSendTextPayload {
    number: string;
    text: string;
    linkPreview?: boolean;
    delay?: number;
    replyid?: string;
}

export interface UazapiSendResponse {
    messageId?: string;
    status?: string;
    error?: string;
}

export class UazapiClient {
    private baseUrl: string;
    private token: string;

    constructor(apiUrl: string, token: string) {
        this.baseUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash
        this.token = token;
    }

    /**
     * Headers padrão para todas as requisições
     */
    private get headers() {
        return {
            'Content-Type': 'application/json',
            'token': this.token,
        };
    }

    /**
     * Inicia processo de conexão e gera QR Code
     * POST /instance/connect
     */
    async connect(phone?: string): Promise<UazapiConnectResponse> {
        try {
            const response = await axios.post<UazapiConnectResponse>(
                `${this.baseUrl}/instance/connect`,
                phone ? { phone } : {},
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error, 'Falha ao conectar instância');
        }
    }

    /**
     * Busca status atual da instância (inclui QR atualizado)
     * GET /instance/status
     */
    async getStatus(): Promise<UazapiStatusResponse> {
        try {
            const response = await axios.get<UazapiStatusResponse>(
                `${this.baseUrl}/instance/status`,
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error, 'Falha ao buscar status');
        }
    }

    /**
     * Desconecta a instância do WhatsApp
     * POST /instance/disconnect
     */
    async disconnect(): Promise<{ response: string }> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/instance/disconnect`,
                {},
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error, 'Falha ao desconectar');
        }
    }

    /**
     * Configura webhook para receber eventos
     * POST /webhook
     */
    async configureWebhook(config: UazapiWebhookConfig): Promise<UazapiWebhookConfig[]> {
        try {
            const response = await axios.post<UazapiWebhookConfig[]>(
                `${this.baseUrl}/webhook`,
                config,
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error, 'Falha ao configurar webhook');
        }
    }

    /**
     * Envia mensagem de texto
     * POST /send/text
     */
    async sendText(payload: UazapiSendTextPayload): Promise<UazapiSendResponse> {
        try {
            const response = await axios.post<UazapiSendResponse>(
                `${this.baseUrl}/send/text`,
                payload,
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error, 'Falha ao enviar mensagem');
        }
    }

    /**
     * Tratamento padronizado de erros
     */
    private handleError(error: unknown, defaultMessage: string): Error {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<{ error?: string; message?: string }>;
            const statusCode = axiosError.response?.status;
            const errorMessage = axiosError.response?.data?.error ||
                axiosError.response?.data?.message ||
                axiosError.message;

            switch (statusCode) {
                case 401:
                    return new Error('Token inválido ou expirado');
                case 404:
                    return new Error('Instância não encontrada');
                case 429:
                    return new Error('Limite de conexões atingido');
                case 500:
                    return new Error(`Erro interno UAZAPI: ${errorMessage}`);
                default:
                    return new Error(`${defaultMessage}: ${errorMessage}`);
            }
        }
        return new Error(defaultMessage);
    }
}

/**
 * Factory function para criar cliente a partir de credenciais do Firestore
 */
export function createUazapiClient(apiUrl: string, token: string): UazapiClient {
    return new UazapiClient(apiUrl, token);
}
