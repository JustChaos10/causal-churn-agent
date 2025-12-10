/**
 * AgentClient - HTTP client for communicating with Niti AI Python backend.
 * Supports both regular requests and Server-Sent Events for streaming.
 */

import type {
    Opportunity,
    ReasoningSession,
    Hypothesis,
    Lever,
    AgentStreamEvent,
} from '../types/reasoning';

export interface AgentClientOptions {
    /** Base URL for the agent API endpoint */
    baseURL: string;
    /** Optional authentication token */
    authToken?: string;
    /** Request timeout in ms (default: 60000) */
    timeout?: number;
}

export interface AnalyzeRequest {
    opportunity: Opportunity;
    business_context?: string;
    /** If true, stream results via SSE */
    stream?: boolean;
}

export interface AnalyzeResponse {
    session: ReasoningSession;
    explanation: string;
}

export class AgentClient {
    private baseURL: string;
    private authToken?: string;
    private timeout: number;

    constructor(options: AgentClientOptions) {
        this.baseURL = options.baseURL.replace(/\/$/, ''); // Remove trailing slash
        this.authToken = options.authToken;
        this.timeout = options.timeout ?? 60000;
    }

    /**
     * Get default headers for requests
     */
    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        return headers;
    }

    /**
     * Start a reasoning analysis (non-streaming)
     */
    async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseURL}/api/analyze`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(request),
                signal: controller.signal,
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Analysis failed: ${response.status} - ${error}`);
            }

            return await response.json();
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Start a reasoning analysis with streaming via Server-Sent Events
     */
    analyzeStream(
        request: AnalyzeRequest,
        callbacks: {
            onHypothesis?: (hypothesis: Hypothesis) => void;
            onLever?: (lever: Lever) => void;
            onExplanation?: (explanation: string) => void;
            onComplete?: (session: ReasoningSession) => void;
            onError?: (error: Error) => void;
        }
    ): () => void {
        const eventSource = new EventSource(
            `${this.baseURL}/api/analyze/stream?data=${encodeURIComponent(
                JSON.stringify(request)
            )}`
        );

        eventSource.onmessage = (event) => {
            try {
                const data: AgentStreamEvent = JSON.parse(event.data);

                switch (data.type) {
                    case 'hypothesis':
                        callbacks.onHypothesis?.(data.data as Hypothesis);
                        break;
                    case 'lever':
                        callbacks.onLever?.(data.data as Lever);
                        break;
                    case 'explanation':
                        callbacks.onExplanation?.(data.data as string);
                        break;
                    case 'complete':
                        callbacks.onComplete?.(data.data as ReasoningSession);
                        eventSource.close();
                        break;
                    case 'error':
                        callbacks.onError?.(new Error(data.data as string));
                        eventSource.close();
                        break;
                }
            } catch (err) {
                callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
            }
        };

        eventSource.onerror = () => {
            callbacks.onError?.(new Error('Connection to agent lost'));
            eventSource.close();
        };

        // Return cleanup function
        return () => eventSource.close();
    }

    /**
     * Get session status by ID
     */
    async getSession(sessionId: string): Promise<ReasoningSession> {
        const response = await fetch(`${this.baseURL}/api/sessions/${sessionId}`, {
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to get session: ${response.status}`);
        }

        return await response.json();
    }
}
