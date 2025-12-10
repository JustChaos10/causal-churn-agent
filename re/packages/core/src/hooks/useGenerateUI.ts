import { useState, useCallback, useRef } from 'react';
import { GroqClient } from '../client';
import { GenerateUIRequest, Component } from '../types';

export interface UseGenerateUIOptions {
  apiKey: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  onError?: (error: Error) => void;
}

export interface UseGenerateUIReturn {
  components: Component[];
  metadata: any;
  isLoading: boolean;
  error: Error | null;
  generate: (prompt: string, options?: Partial<GenerateUIRequest>) => Promise<void>;
  stream: (prompt: string, options?: Partial<GenerateUIRequest>) => Promise<void>;
  reset: () => void;
}

export function useGenerateUI(options: UseGenerateUIOptions): UseGenerateUIReturn {
  const [components, setComponents] = useState<Component[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
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
    setComponents([]);
    setMetadata(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const generate = useCallback(
    async (prompt: string, requestOptions?: Partial<GenerateUIRequest>) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await clientRef.current.generateUI({
          prompt,
          ...requestOptions,
        });

        setComponents(response.ui.components || []);
        setMetadata(response.ui.metadata || null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const stream = useCallback(
    async (prompt: string, requestOptions?: Partial<GenerateUIRequest>) => {
      setIsLoading(true);
      setError(null);
      setComponents([]);
      setMetadata(null);

      try {
        await clientRef.current.generateUIWithCallbacks(
          { prompt, ...requestOptions },
          {
            onComponent: (comps) => {
              setComponents(comps);
            },
            onMetadata: (meta) => {
              setMetadata(meta);
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
    [options]
  );

  return {
    components,
    metadata,
    isLoading,
    error,
    generate,
    stream,
    reset,
  };
}
