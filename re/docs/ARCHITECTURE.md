# Re Architecture

This document explains the architecture and design decisions of Re Generative UI.

## Overview

Re is a modular, production-ready framework for building generative UI applications powered by Groq's fast LLM inference.

```
┌─────────────┐
│   User      │
│   Prompt    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│      @re/core                   │
│  ┌──────────────────────────┐  │
│  │   GroqClient             │  │
│  │   - API Integration      │  │
│  │   - Streaming Support    │  │
│  │   - System Prompts       │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │   React Hooks            │  │
│  │   - useGenerateUI        │  │
│  │   - useChat              │  │
│  └──────────────────────────┘  │
└─────────────┬───────────────────┘
              │
              ▼
     ┌────────────────┐
     │  Component     │
     │  Specification │
     │  (JSON)        │
     └────────┬───────┘
              │
              ▼
┌─────────────────────────────────┐
│      @re/react-ui               │
│  ┌──────────────────────────┐  │
│  │   ComponentRenderer      │  │
│  │   - Type Routing         │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │   16+ Components         │  │
│  │   - Text, Button, etc    │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │   Theme System           │  │
│  │   - Light/Dark Modes     │  │
│  └──────────────────────────┘  │
└─────────────┬───────────────────┘
              │
              ▼
     ┌────────────────┐
     │  Rendered UI   │
     └────────────────┘
```

## Core Packages

### @re/core

**Purpose:** Framework core with Groq integration and state management

**Key Components:**
- `GroqClient` - Handles API communication with Groq
- `useGenerateUI` - React hook for single UI generation
- `useChat` - React hook for conversational UI
- Type definitions for all components

**Design Decisions:**
- Backend-agnostic architecture
- Streaming-first approach for real-time feedback
- TypeScript for type safety
- Hooks-based API for React integration

### @re/react-ui

**Purpose:** Component library and rendering engine

**Key Components:**
- `ComponentRenderer` - Routes component specs to React components
- 16+ UI components (Text, Button, Card, Chart, etc.)
- `ThemeProvider` - Theme management
- `ReChat` - Complete chat interface

**Design Decisions:**
- CSS variables for theming
- Recharts for data visualization
- Modular component design
- Accessible components

### @re/api

**Purpose:** Backend API server (optional)

**Features:**
- RESTful endpoints
- Server-Sent Events for streaming
- OpenAI-compatible API
- CORS enabled for browser usage

## Data Flow

### 1. Prompt → LLM

```typescript
User Prompt
  → GroqClient.generateUI()
  → Groq API (with system prompt)
  → LLM generates JSON
```

### 2. LLM → Components

```typescript
JSON Response
  → Parse & Validate
  → Component Specifications
  → State Management (React hooks)
```

### 3. Components → UI

```typescript
Component Specs
  → ComponentRenderer
  → React Components
  → Rendered DOM
```

## System Prompt

The system prompt in `GroqClient` instructs the LLM to:
1. Generate valid JSON
2. Use defined component types
3. Follow component schemas
4. Create semantic, accessible UIs

## Component Schema

Each component follows this structure:

```typescript
{
  id: string,           // Unique identifier
  type: ComponentType,  // Component type
  props: object,        // Component-specific props
  children?: []         // Nested components (optional)
}
```

## Streaming Architecture

Streaming uses async generators and callbacks:

```typescript
async *streamUI(request) {
  for await (chunk of groqStream) {
    // Parse incremental JSON
    // Yield complete components
  }
}
```

Benefits:
- Progressive rendering
- Better UX for slow connections
- Real-time feedback

## Theme System

CSS variables enable runtime theming:

```css
:root {
  --re-bg-primary: #ffffff;
  --re-text-primary: #212529;
  /* ... */
}

.dark {
  --re-bg-primary: #1a1a1a;
  --re-text-primary: #f5f5f5;
  /* ... */
}
```

React context manages theme state:
```typescript
ThemeProvider → localStorage → CSS classes
```

## Error Handling

Multiple layers of error handling:
1. API errors (network, auth)
2. JSON parsing errors
3. Component validation errors
4. Rendering errors (React error boundaries)

## Performance Considerations

- **Lazy loading:** Components loaded on-demand
- **Memoization:** React hooks use proper dependencies
- **Streaming:** Progressive rendering reduces perceived latency
- **TypeScript:** Compile-time type checking

## Security

- API keys stored client-side (localStorage) or server-side (env vars)
- CORS configured for API server
- Input sanitization in components
- No eval() or dangerous innerHTML

## Extensibility

### Adding Custom Components

1. Define type in `@re/core/types/components.ts`
2. Create component in `@re/react-ui/components/`
3. Register in `ComponentRenderer`
4. Update system prompt
5. Add styles

### Custom Themes

Override CSS variables:
```css
:root {
  --re-primary: #your-color;
  /* ... */
}
```

## Trade-offs

**Pros:**
- Fast development with Groq
- Type-safe with TypeScript
- Modular, extensible design
- Production-ready components

**Cons:**
- Depends on external LLM service
- Component set is finite (though extensible)
- Requires React (for now)

## Future Considerations

- Vue/Svelte adapters
- More component types
- Component marketplace
- Visual editor
- Analytics integration

## Comparison to Alternatives

**vs. Traditional UI:**
- Re: AI-generated, flexible
- Traditional: Hand-coded, fixed

**vs. Text-only AI:**
- Re: Rich, interactive components
- Text-only: Limited to markdown/text

**vs. Thesys C1:**
- Re: Open-source, Groq-powered
- C1: Proprietary, multi-provider

**vs. Crayon:**
- Re: Complete framework with backend
- Crayon: Frontend SDK only

## References

- [Groq Documentation](https://console.groq.com/docs)
- [React Hooks](https://react.dev/reference/react)
- [Recharts](https://recharts.org/)
