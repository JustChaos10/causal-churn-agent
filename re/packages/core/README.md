# @re/core

Core framework for Re Generative UI with Groq integration and React hooks.

## Installation

```bash
npm install @re/core groq-sdk
```

## Features

- 🔌 Groq API client with streaming support
- ⚛️ React hooks for UI generation
- 📝 Full TypeScript definitions
- 🔄 Streaming and non-streaming modes
- 💬 Chat conversation support

## Usage

### Direct API Usage

```typescript
import { GroqClient } from '@re/core';

const client = new GroqClient({
  apiKey: 'your-groq-api-key',
  model: 'llama-3.1-70b-versatile',
});

// Generate UI
const response = await client.generateUI({
  prompt: 'Show me a sales dashboard',
});

console.log(response.ui.components);
```

### React Hooks

```tsx
import { useGenerateUI } from '@re/core';

function MyComponent() {
  const { components, generate, isLoading } = useGenerateUI({
    apiKey: 'your-groq-api-key',
  });

  return (
    <button onClick={() => generate('Create a form')}>
      Generate
    </button>
  );
}
```

### Streaming

```typescript
// With async generator
for await (const chunk of client.streamUI({ prompt: 'Show data' })) {
  console.log(chunk);
}

// With callbacks
await client.generateUIWithCallbacks(
  { prompt: 'Show data' },
  {
    onComponent: (components) => console.log(components),
    onMetadata: (metadata) => console.log(metadata),
    onDone: () => console.log('Done!'),
  }
);
```

## API Reference

See the [main documentation](../../README.md) for full API reference.

## License

MIT
