# @re/api

Backend API server for Re Generative UI with streaming support and production-grade security.

## Installation

```bash
cd packages/api
npm install
```

## Configuration

```bash
cp .env.example .env
# Edit .env and configure:
# - GROQ_API_KEY (required)
# - ALLOWED_ORIGINS (for CORS)
# - NODE_ENV (development/production)
```

### Environment Variables

- **`GROQ_API_KEY`** (required) - Your Groq API key
- **`PORT`** (optional) - Server port (default: 3001)
- **`NODE_ENV`** (optional) - Environment mode (default: development)
- **`ALLOWED_ORIGINS`** (optional) - Comma-separated list of allowed CORS origins (default: `http://localhost:3000,http://localhost:5173`)

## Running

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

The server runs on `http://localhost:3001` by default.

---

## Security Features ✅

This API server includes production-grade security:

1. **🔒 Secure API Key Handling**
   - API keys only accepted via environment variables or `X-API-Key` header
   - Never in request body (prevents logging/exposure)

2. **🛡️ CORS Protection**
   - Configurable origin whitelist
   - Prevents unauthorized cross-origin access

3. **⚠️ Request Size Limits**
   - 1MB limit to prevent DOS attacks
   - Protects against memory exhaustion

4. **🔐 Error Sanitization**
   - Generic error messages in production
   - Full details only logged server-side
   - Prevents information disclosure

5. **✅ Input Validation**
   - Temperature: 0-2
   - maxTokens: 1-8192
   - Prompt length: max 10000 chars

---

## Endpoints

### GET /health

Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-30T12:00:00.000Z"
}
```

---

### POST /api/generate

Generate UI (non-streaming)

**Headers:**
```
Content-Type: application/json
X-API-Key: your-groq-api-key (optional, if not using env var)
```

**Request:**
```json
{
  "prompt": "Show me a dashboard",
  "model": "llama-3.1-70b-versatile",
  "temperature": 0.7,
  "maxTokens": 4096
}
```

**Response:**
```json
{
  "ui": {
    "components": [...],
    "metadata": {...}
  },
  "model": "llama-3.1-70b-versatile",
  "usage": {
    "promptTokens": 100,
    "completionTokens": 200,
    "totalTokens": 300
  }
}
```

**Error Response:**
```json
{
  "error": "Failed to generate UI",
  "message": "Error description"
}
```

---

### POST /api/generate/stream

Generate UI (streaming with Server-Sent Events)

**Headers:**
```
Content-Type: application/json
X-API-Key: your-groq-api-key (optional)
```

**Request:** Same as `/api/generate`

**Response:** SSE stream with events:
```
data: {"type":"components","data":[...]}
data: {"type":"metadata","data":{...}}
data: {"type":"done"}
```

**Error events:**
```
data: {"type":"error","data":{"message":"Error description"}}
```

---

### POST /v1/chat/completions

OpenAI-compatible endpoint

**Headers:**
```
Content-Type: application/json
X-API-Key: your-groq-api-key (optional)
```

**Request:**
```json
{
  "messages": [
    {"role": "user", "content": "Show me a dashboard"}
  ],
  "model": "llama-3.1-70b-versatile",
  "temperature": 0.7,
  "max_tokens": 4096,
  "stream": false
}
```

**Response:**
```json
{
  "id": "re-1234567890",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "llama-3.1-70b-versatile",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "{\"components\":[...],\"metadata\":{...}}"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "promptTokens": 100,
    "completionTokens": 200,
    "totalTokens": 300
  }
}
```

---

## Usage Examples

### Option 1: Using Environment Variable (Recommended)

Set `GROQ_API_KEY` in your `.env` file, then make requests:

```typescript
const response = await fetch('http://localhost:3001/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'Show me a dashboard',
    temperature: 0.7,
  })
});

const data = await response.json();
```

### Option 2: Using X-API-Key Header (Secure Alternative)

Pass API key in header instead of environment:

```typescript
const response = await fetch('http://localhost:3001/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-groq-api-key',
  },
  body: JSON.stringify({
    prompt: 'Show me a dashboard',
  })
});
```

### Streaming Example

```typescript
const response = await fetch('http://localhost:3001/api/generate/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'Show me a dashboard',
  })
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log('Received:', data);
    }
  }
}
```

---

## Production Deployment

### 1. Set Environment Variables

```bash
export GROQ_API_KEY="your-production-api-key"
export NODE_ENV="production"
export PORT="3001"
export ALLOWED_ORIGINS="https://yourdomain.com,https://app.yourdomain.com"
```

### 2. Build and Run

```bash
npm run build
npm start
```

### 3. Security Checklist

- ✅ Set `NODE_ENV=production` (enables error sanitization)
- ✅ Configure `ALLOWED_ORIGINS` for your production domains
- ✅ Use HTTPS in production (configure reverse proxy)
- ✅ Keep `GROQ_API_KEY` secure (use secrets management)
- ✅ Monitor API usage and errors
- ✅ Consider adding rate limiting for additional protection

---

## Security Notes

### API Key Security

**✅ DO:**
- Use environment variables
- Use `X-API-Key` header
- Keep keys in secrets management (AWS Secrets Manager, etc.)
- Rotate keys periodically

**❌ DON'T:**
- ~~Pass API keys in request body~~ (removed for security)
- ~~Commit keys to git~~
- ~~Expose keys in client-side code~~
- ~~Share keys publicly~~

### CORS Configuration

In production, always configure `ALLOWED_ORIGINS`:

```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

This prevents unauthorized websites from calling your API.

### Error Handling

In production (`NODE_ENV=production`):
- Generic error messages sent to clients
- Full error details only logged server-side
- Prevents information disclosure attacks

---

## Migration from Old Version

If upgrading from a previous version that accepted API keys in request body:

**Before (insecure):**
```typescript
fetch('/api/generate', {
  body: JSON.stringify({
    prompt: '...',
    apiKey: 'gsk_...' // ❌ Insecure!
  })
})
```

**After (secure):**
```typescript
// Option 1: Use environment variable
fetch('/api/generate', {
  body: JSON.stringify({
    prompt: '...'
    // apiKey removed from body
  })
})

// Option 2: Use header
fetch('/api/generate', {
  headers: {
    'X-API-Key': 'gsk_...' // ✅ Secure!
  },
  body: JSON.stringify({
    prompt: '...'
  })
})
```

---

## License

MIT
