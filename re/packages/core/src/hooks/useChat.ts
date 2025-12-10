import { useState, useCallback, useRef } from 'react';
import { GroqClient } from '../client';
import { ChatMessage, Component } from '../types';

export interface UseChatOptions {
  apiKey: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  onError?: (error: Error) => void;
}

export interface ChatMessageWithUI extends ChatMessage {
  components?: Component[];
  metadata?: any;
  timestamp: number;
}

export interface UseChatReturn {
  messages: ChatMessageWithUI[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  reset: () => void;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessageWithUI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const clientRef = useRef<GroqClient>(
    new GroqClient({
      apiKey: options.apiKey,
      baseURL: options.baseURL,
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    })
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessageWithUI = {
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      // Create assistant message placeholder
      const assistantMessageId = Date.now() + 1;
      const assistantMessage: ChatMessageWithUI = {
        role: 'assistant',
        content: '',
        components: [],
        timestamp: assistantMessageId,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Get conversation history
        const history: ChatMessage[] = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        await clientRef.current.generateUIWithCallbacks(
          {
            prompt: content,
            messages: history,
            model: options.model,
            temperature: options.temperature,
            maxTokens: options.maxTokens,
          },
          {
            onComponent: (comps) => {
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg.role === 'assistant') {
                  lastMsg.components = comps;
                }
                return updated;
              });
            },
            onMetadata: (meta) => {
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg.role === 'assistant') {
                  lastMsg.metadata = meta;
                }
                return updated;
              });
            },
            onError: (err) => {
              setError(err);
              options.onError?.(err);
            },
            onDone: () => {
              setIsLoading(false);
            },
          }
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
        setIsLoading(false);
      }
    },
    [messages, options]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    reset,
  };
}
