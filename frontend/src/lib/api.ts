const API_BASE_URL = 'http://localhost:5000/api';

export interface ChatResponse {
    response: string;
    domain: string;
}

export interface ChatRequest {
    query: string;
    domain: 'hr' | 'finance';
}

export const chatService = {
    async sendMessage(request: ChatRequest): Promise<ChatResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    },

    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            return response.ok;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }
}; 