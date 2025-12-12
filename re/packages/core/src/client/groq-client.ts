import Groq from 'groq-sdk';
import { GenerateUIRequest, GenerateUIResponse, StreamCallbacks, ReClientConfig } from '../types';

const SYSTEM_PROMPT = `You are a UI generation assistant. Your task is to generate interactive user interface components based on user requests.

You must respond ONLY with valid JSON in the following format:
{
  "components": [
    {
      "id": "unique-id",
      "type": "component-type",
      "props": { /* component props */ },
      "children": [ /* nested components if applicable */ ]
    }
  ],
  "metadata": {
    "title": "Optional title",
    "description": "Optional description"
  }
}

Available component types:
- text: Display text content
- heading: Display headings (h1-h6)
- button: Interactive buttons
- card: Container with title and description
- list: Bullet or numbered lists
- table: Data tables with headers and rows
- chart: Data visualizations (line, bar, pie, area)
- form: Forms with inputs
- input: Text inputs
- select: Dropdown selects
- image: Images
- alert: Alert messages (info, success, warning, error)
- progress: Progress bars
- badge: Small labels/badges
- divider: Horizontal dividers
- container: Layout containers (row/column)

Guidelines:
1. Use semantic component types
2. Provide clear, descriptive content
3. Use appropriate variants and sizes
4. Create nested components when needed
5. Make interactive elements with onClick actions
6. Use charts for data visualization
7. Use forms for user input collection
8. Respond ONLY with the JSON object, no additional text

Example for "Show me sales data":
{
  "components": [
    {
      "id": "1",
      "type": "heading",
      "props": { "content": "Sales Dashboard", "level": 1 }
    },
    {
      "id": "2",
      "type": "chart",
      "props": {
        "chartType": "bar",
        "title": "Monthly Sales",
        "data": [
          { "month": "Jan", "sales": 4000 },
          { "month": "Feb", "sales": 3000 },
          { "month": "Mar", "sales": 5000 }
        ],
        "xKey": "month",
        "yKey": "sales"
      }
    }
  ],
  "metadata": {
    "title": "Sales Dashboard"
  }
}`;

export class GroqClient {
  private client: Groq;
  private config: ReClientConfig;

  constructor(config: ReClientConfig) {
    this.config = {
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      maxTokens: 4096,
      ...config,
    };
    this.client = new Groq({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  async generateUI(request: GenerateUIRequest): Promise<GenerateUIResponse> {
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...(request.messages || []),
      { role: 'user' as const, content: request.prompt },
    ];

    const response = await this.client.chat.completions.create({
      model: request.model || this.config.model!,
      messages,
      temperature: request.temperature ?? this.config.temperature,
      max_tokens: request.maxTokens ?? this.config.maxTokens,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response');
    }

    try {
      const ui = JSON.parse(content);
      return {
        ui,
        model: response.model,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error}`);
    }
  }

  async *streamUI(request: GenerateUIRequest): AsyncGenerator<any, void, unknown> {
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...(request.messages || []),
      { role: 'user' as const, content: request.prompt },
    ];

    const stream = await this.client.chat.completions.create({
      model: request.model || this.config.model!,
      messages,
      temperature: request.temperature ?? this.config.temperature,
      max_tokens: request.maxTokens ?? this.config.maxTokens,
      response_format: { type: 'json_object' },
      stream: true,
    });

    let buffer = '';
    let lastComponentsJson: string | null = null;
    let lastMetadataJson: string | null = null;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        buffer += content;

        // Try to parse incrementally
        try {
          const partial = JSON.parse(buffer);
          if (partial.components) {
            const json = JSON.stringify(partial.components);
            if (json !== lastComponentsJson) {
              lastComponentsJson = json;
              yield { type: 'components', data: partial.components };
            }
          }
          if (partial.metadata) {
            const json = JSON.stringify(partial.metadata);
            if (json !== lastMetadataJson) {
              lastMetadataJson = json;
              yield { type: 'metadata', data: partial.metadata };
            }
          }
        } catch {
          // Not yet complete JSON, continue buffering
        }
      }
    }

    // Final parse
    try {
      const ui = JSON.parse(buffer);
      yield { type: 'done', data: ui };
    } catch (error) {
      yield { type: 'error', data: { message: 'Failed to parse final response' } };
    }
  }

  async generateUIWithCallbacks(
    request: GenerateUIRequest,
    callbacks: StreamCallbacks
  ): Promise<void> {
    try {
      for await (const chunk of this.streamUI(request)) {
        switch (chunk.type) {
          case 'components':
            callbacks.onComponent?.(chunk.data);
            break;
          case 'metadata':
            callbacks.onMetadata?.(chunk.data);
            break;
          case 'error':
            callbacks.onError?.(new Error(chunk.data.message));
            break;
          case 'done':
            callbacks.onDone?.();
            break;
        }
      }
    } catch (error) {
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
