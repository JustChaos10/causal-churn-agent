import { useState, useCallback, useRef, useEffect } from 'react';
import { AgentClient, type AgentClientOptions, type AnalyzeRequest } from '../client/AgentClient';
import type {
    ReasoningSession,
    Hypothesis,
    Lever,
    Opportunity,
} from '../types/reasoning';

export interface UseAgentOptions {
    /** Base URL for the agent API (e.g., 'http://localhost:8000') */
    agentEndpoint: string;
    /** Optional auth token */
    authToken?: string;
    /** Enable streaming mode (default: true) */
    streaming?: boolean;
    /** Callback when analysis completes */
    onComplete?: (session: ReasoningSession) => void;
    /** Callback on error */
    onError?: (error: Error) => void;
}

export interface UseAgentReturn {
    /** Current reasoning session */
    session: ReasoningSession | null;
    /** List of hypotheses (updates as they stream in) */
    hypotheses: Hypothesis[];
    /** List of recommended levers */
    levers: Lever[];
    /** Current explanation text */
    explanation: string;
    /** Whether analysis is in progress */
    isLoading: boolean;
    /** Any error that occurred */
    error: Error | null;
    /** Start analyzing an opportunity */
    analyze: (opportunity: Opportunity, businessContext?: string) => Promise<void>;
    /** Cancel the current analysis */
    cancel: () => void;
    /** Reset state */
    reset: () => void;
}

/**
 * React hook for interacting with the Niti AI Retention Reasoning Agent.
 * Compatible with Crayon's useAgent API pattern.
 */
export function useAgent(options: UseAgentOptions): UseAgentReturn {
    const [session, setSession] = useState<ReasoningSession | null>(null);
    const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
    const [levers, setLevers] = useState<Lever[]>([]);
    const [explanation, setExplanation] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const clientRef = useRef<AgentClient | null>(null);
    const cancelRef = useRef<(() => void) | null>(null);

    // Initialize client
    useEffect(() => {
        clientRef.current = new AgentClient({
            baseURL: options.agentEndpoint,
            authToken: options.authToken,
        });
    }, [options.agentEndpoint, options.authToken]);

    const reset = useCallback(() => {
        setSession(null);
        setHypotheses([]);
        setLevers([]);
        setExplanation('');
        setIsLoading(false);
        setError(null);
    }, []);

    const cancel = useCallback(() => {
        if (cancelRef.current) {
            cancelRef.current();
            cancelRef.current = null;
        }
        setIsLoading(false);
    }, []);

    const analyze = useCallback(
        async (opportunity: Opportunity, businessContext?: string) => {
            if (!clientRef.current) {
                throw new Error('Agent client not initialized');
            }

            // Reset state
            reset();
            setIsLoading(true);
            setError(null);

            // Create initial session placeholder
            const initialSession: ReasoningSession = {
                session_id: '',
                opportunity_id: opportunity.opportunity_id || '',
                status: 'in_progress',
                hypotheses: [],
                hypotheses_count: 0,
                validated_hypotheses_count: 0,
                validated_causes: [],
                recommended_levers: [],
                confidence_score: 0,
                completeness_score: 0,
            };
            setSession(initialSession);

            const request: AnalyzeRequest = {
                opportunity,
                business_context: businessContext,
                stream: options.streaming !== false,
            };

            try {
                if (options.streaming !== false) {
                    // Streaming mode
                    cancelRef.current = clientRef.current.analyzeStream(request, {
                        onHypothesis: (hypothesis) => {
                            setHypotheses((prev) => [...prev, hypothesis]);
                            setSession((prev) =>
                                prev
                                    ? {
                                        ...prev,
                                        hypotheses: [...prev.hypotheses, hypothesis],
                                        hypotheses_count: prev.hypotheses_count + 1,
                                    }
                                    : prev
                            );
                        },
                        onLever: (lever) => {
                            setLevers((prev) => [...prev, lever]);
                            setSession((prev) =>
                                prev
                                    ? {
                                        ...prev,
                                        recommended_levers: [...prev.recommended_levers, lever],
                                    }
                                    : prev
                            );
                        },
                        onExplanation: (text) => {
                            setExplanation(text);
                        },
                        onComplete: (completedSession) => {
                            setSession(completedSession);
                            setHypotheses(completedSession.hypotheses);
                            setLevers(completedSession.recommended_levers);
                            setIsLoading(false);
                            options.onComplete?.(completedSession);
                        },
                        onError: (err) => {
                            setError(err);
                            setIsLoading(false);
                            setSession((prev) =>
                                prev ? { ...prev, status: 'failed', error_message: err.message } : prev
                            );
                            options.onError?.(err);
                        },
                    });
                } else {
                    // Non-streaming mode
                    const response = await clientRef.current.analyze(request);
                    setSession(response.session);
                    setHypotheses(response.session.hypotheses);
                    setLevers(response.session.recommended_levers);
                    setExplanation(response.explanation);
                    setIsLoading(false);
                    options.onComplete?.(response.session);
                }
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                setError(error);
                setIsLoading(false);
                setSession((prev) =>
                    prev ? { ...prev, status: 'failed', error_message: error.message } : prev
                );
                options.onError?.(error);
            }
        },
        [options, reset]
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (cancelRef.current) {
                cancelRef.current();
            }
        };
    }, []);

    return {
        session,
        hypotheses,
        levers,
        explanation,
        isLoading,
        error,
        analyze,
        cancel,
        reset,
    };
}
