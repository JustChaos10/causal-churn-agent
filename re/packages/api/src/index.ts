import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GroqClient } from '@re/core';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security Fix #2: Configure CORS with proper origin restrictions
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173']; // Default dev origins

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Security Fix #3: Add request size limits to prevent DOS attacks
app.use(express.json({ limit: '1mb' }));

// Helper function to get API key from environment or header
// Security Fix #1: Remove API key from request body
function getApiKey(req: Request): string | null {
  // Try to get from X-API-Key header first
  const headerKey = req.headers['x-api-key'] as string;
  if (headerKey) return headerKey;

  // Fall back to environment variable
  return process.env.GROQ_API_KEY || null;
}

// Helper function to sanitize error messages
// Security Fix #4: Don't expose internal error details to clients
function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // Log full error server-side
    console.error('Full error details:', error);

    // Only send generic message to client
    // In production, don't expose error.message which might contain sensitive info
    if (process.env.NODE_ENV === 'production') {
      return 'An error occurred while processing your request';
    } else {
      // In development, can show more details for debugging
      return error.message;
    }
  }
  return 'An unexpected error occurred';
}

// Validation helper for input parameters
function validateGenerateParams(params: {
  temperature?: number;
  maxTokens?: number;
}): { valid: boolean; error?: string } {
  if (params.temperature !== undefined) {
    if (typeof params.temperature !== 'number' || params.temperature < 0 || params.temperature > 2) {
      return { valid: false, error: 'Temperature must be a number between 0 and 2' };
    }
  }

  if (params.maxTokens !== undefined) {
    if (typeof params.maxTokens !== 'number' || params.maxTokens < 1 || params.maxTokens > 8192) {
      return { valid: false, error: 'maxTokens must be a number between 1 and 8192' };
    }
  }

  return { valid: true };
}

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generate UI endpoint (non-streaming)
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, model, temperature, maxTokens } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Valid prompt is required' });
    }

    if (prompt.length > 10000) {
      return res.status(400).json({ error: 'Prompt too long (max 10000 characters)' });
    }

    // Validate parameters
    const validation = validateGenerateParams({ temperature, maxTokens });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const groqApiKey = getApiKey(req);
    if (!groqApiKey) {
      return res.status(401).json({
        error: 'API key required. Set GROQ_API_KEY environment variable or provide X-API-Key header'
      });
    }

    const client = new GroqClient({ apiKey: groqApiKey });
    const response = await client.generateUI({
      prompt,
      model,
      temperature,
      maxTokens,
    });

    res.json(response);
  } catch (error) {
    const errorMessage = sanitizeError(error);
    res.status(500).json({
      error: 'Failed to generate UI',
      message: errorMessage,
    });
  }
});

// Generate UI endpoint (streaming)
app.post('/api/generate/stream', async (req: Request, res: Response) => {
  try {
    const { prompt, model, temperature, maxTokens } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Valid prompt is required' });
    }

    if (prompt.length > 10000) {
      return res.status(400).json({ error: 'Prompt too long (max 10000 characters)' });
    }

    // Validate parameters
    const validation = validateGenerateParams({ temperature, maxTokens });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const groqApiKey = getApiKey(req);
    if (!groqApiKey) {
      return res.status(401).json({
        error: 'API key required. Set GROQ_API_KEY environment variable or provide X-API-Key header'
      });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const client = new GroqClient({ apiKey: groqApiKey });

    await client.generateUIWithCallbacks(
      {
        prompt,
        model,
        temperature,
        maxTokens,
      },
      {
        onComponent: (components) => {
          res.write(`data: ${JSON.stringify({ type: 'components', data: components })}\n\n`);
        },
        onMetadata: (metadata) => {
          res.write(`data: ${JSON.stringify({ type: 'metadata', data: metadata })}\n\n`);
        },
        onError: (error) => {
          const errorMessage = sanitizeError(error);
          res.write(
            `data: ${JSON.stringify({ type: 'error', data: { message: errorMessage } })}\n\n`
          );
          res.end();
        },
        onDone: () => {
          res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
          res.end();
        },
      }
    );
  } catch (error) {
    const errorMessage = sanitizeError(error);
    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        data: { message: errorMessage },
      })}\n\n`
    );
    res.end();
  }
});

// OpenAI-compatible chat completions endpoint
app.post('/v1/chat/completions', async (req: Request, res: Response) => {
  try {
    const { messages, model, temperature, max_tokens, stream } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (messages.length === 0) {
      return res.status(400).json({ error: 'Messages array cannot be empty' });
    }

    // Validate parameters
    const validation = validateGenerateParams({
      temperature,
      maxTokens: max_tokens
    });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const groqApiKey = getApiKey(req);
    if (!groqApiKey) {
      return res.status(401).json({
        error: 'API key required. Set GROQ_API_KEY environment variable or provide X-API-Key header'
      });
    }

    // Extract the last user message as prompt
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
    if (!lastUserMessage) {
      return res.status(400).json({ error: 'No user message found' });
    }

    const client = new GroqClient({ apiKey: groqApiKey });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      await client.generateUIWithCallbacks(
        {
          prompt: lastUserMessage.content,
          messages: messages.slice(0, -1),
          model,
          temperature,
          maxTokens: max_tokens,
        },
        {
          onComponent: (components) => {
            res.write(`data: ${JSON.stringify({ type: 'components', data: components })}\n\n`);
          },
          onMetadata: (metadata) => {
            res.write(`data: ${JSON.stringify({ type: 'metadata', data: metadata })}\n\n`);
          },
          onError: (error) => {
            const errorMessage = sanitizeError(error);
            res.write(
              `data: ${JSON.stringify({ type: 'error', data: { message: errorMessage } })}\n\n`
            );
            res.end();
          },
          onDone: () => {
            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
            res.end();
          },
        }
      );
    } else {
      const response = await client.generateUI({
        prompt: lastUserMessage.content,
        messages: messages.slice(0, -1),
        model,
        temperature,
        maxTokens: max_tokens,
      });

      res.json({
        id: `re-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: response.model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify(response.ui),
            },
            finish_reason: 'stop',
          },
        ],
        usage: response.usage,
      });
    }
  } catch (error) {
    const errorMessage = sanitizeError(error);
    res.status(500).json({
      error: 'Failed to complete chat',
      message: errorMessage,
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Re Generative UI API Server`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`✨ Powered by Groq\n`);
  console.log(`Endpoints:`);
  console.log(`  GET  /health - Health check`);
  console.log(`  POST /api/generate - Generate UI (non-streaming)`);
  console.log(`  POST /api/generate/stream - Generate UI (streaming)`);
  console.log(`  POST /v1/chat/completions - OpenAI-compatible endpoint\n`);
  console.log(`Security:`);
  console.log(`  ✅ CORS configured for: ${allowedOrigins.join(', ')}`);
  console.log(`  ✅ Request size limit: 1mb`);
  console.log(`  ✅ Input validation enabled`);
  console.log(`  ✅ Error sanitization active\n`);
});

export default app;
