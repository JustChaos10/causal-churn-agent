import { GeneratedUI } from './components';

export interface StreamChunk {
  type: 'component' | 'metadata' | 'error' | 'done';
  data: any;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateUIRequest {
  prompt: string;
  messages?: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface GenerateUIResponse {
  ui: GeneratedUI;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamCallbacks {
  onComponent?: (component: any) => void;
  onMetadata?: (metadata: any) => void;
  onError?: (error: Error) => void;
  onDone?: () => void;
}

export interface ReClientConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
