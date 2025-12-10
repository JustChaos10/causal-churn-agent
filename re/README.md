# Re - Generative UI Framework

> **Build agentic interfaces beyond text** • Powered by Groq

Re is a production-ready generative UI framework that enables AI to create interactive, beautiful user interfaces on the fly. Inspired by Thesys C1 and Crayon, Re leverages Groq's lightning-fast LLM inference to generate dynamic UI components from natural language.

## ✨ Features

- **🚀 Blazing Fast** - Powered by Groq's industry-leading inference speed
- **🎨 16+ UI Components** - Charts, forms, tables, cards, and more
- **🌓 Dark Mode** - Built-in theme system with seamless switching
- **📊 Data Visualization** - Interactive charts with Recharts
- **🔄 Streaming Support** - Real-time progressive rendering
- **⚡ React Hooks** - Clean, modern API with TypeScript support
- **🎯 Type-Safe** - Full TypeScript definitions
- **🔌 Extensible** - Easy to add custom components
- **🎭 Backend Agnostic** - Use with any Groq-compatible API

## 📦 Packages

This monorepo contains:

- **[@re/core](./packages/core)** - Core framework with Groq integration and React hooks
- **[@re/react-ui](./packages/react-ui)** - React component library with 16+ components
- **[@re/api](./packages/api)** - Backend API server with streaming endpoints
- **[demo](./examples/demo)** - Full-featured demo application

## 🚀 Quick Start

### Installation

```bash
# Install the packages
npm install @re/core @re/react-ui

# Or with your package manager
pnpm add @re/core @re/react-ui
yarn add @re/core @re/react-ui
```

### Basic Usage

```tsx
import { useGenerateUI, ThemeProvider } from '@re/react-ui';
import '@re/react-ui/styles.css';

function App() {
  const { components, generate, isLoading } = useGenerateUI({
    apiKey: 'your-groq-api-key',
  });

  return (
    <ThemeProvider>
      <button onClick={() => generate('Show me a sales dashboard')}>
        Generate UI
      </button>
      {isLoading && <p>Generating...</p>}
      <ReRenderer components={components} />
    </ThemeProvider>
  );
}
```

### Chat Interface

```tsx
import { ReChat, ThemeProvider } from '@re/react-ui';
import '@re/react-ui/styles.css';

function App() {
  return (
    <ThemeProvider>
      <ReChat
        apiKey="your-groq-api-key"
        placeholder="Ask me to create a UI..."
      />
    </ThemeProvider>
  );
}
```

## 🎯 Available Components

Re can generate these components:

| Component | Description | Example Use |
|-----------|-------------|-------------|
| **Text** | Styled text with size and weight options | Body copy, descriptions |
| **Heading** | H1-H6 headings | Page titles, section headers |
| **Button** | Interactive buttons with variants | Actions, CTAs |
| **Card** | Container with title and description | Content grouping |
| **List** | Bullet, numbered, or plain lists | Feature lists, steps |
| **Table** | Data tables with sorting | Data display |
| **Chart** | Line, bar, pie, area charts | Data visualization |
| **Form** | Forms with validation | User input |
| **Input** | Text inputs | Form fields |
| **Select** | Dropdown selects | Options selection |
| **Alert** | Info, success, warning, error alerts | Notifications |
| **Progress** | Progress bars | Loading states |
| **Badge** | Small labels | Status indicators |
| **Image** | Images with styling | Media display |
| **Divider** | Horizontal dividers | Section separation |
| **Container** | Layout containers | Flexbox layouts |

## 🎨 Theming

Re includes a complete theming system with light and dark modes:

```tsx
import { ThemeProvider, useTheme } from '@re/react-ui';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <ThemeToggle />
      {/* Your app */}
    </ThemeProvider>
  );
}
```

## 🔧 Backend API

Run the backend API server:

```bash
cd packages/api
cp .env.example .env
# Add your GROQ_API_KEY to .env
npm run dev
```

The API provides these endpoints:

- `POST /api/generate` - Generate UI (non-streaming)
- `POST /api/generate/stream` - Generate UI (streaming)
- `POST /v1/chat/completions` - OpenAI-compatible endpoint

## 💡 Example Prompts

Try these prompts to see Re in action:

- "Show me a sales dashboard with charts"
- "Create a contact form with name, email, and message"
- "Display a pricing table with three tiers"
- "Build a user profile card with stats"
- "Show quarterly revenue as a bar chart"
- "Create a login form"
- "Display a list of features with icons"
- "Show me a product comparison table"

## 🏗️ Development

### Setup

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run demo app
npm run dev
```

### Project Structure

```
re/
├── packages/
│   ├── core/          # Core framework + Groq client
│   ├── react-ui/      # React components
│   └── api/           # Backend API server
├── examples/
│   └── demo/          # Demo application
└── README.md
```

## 📚 API Reference

### useGenerateUI Hook

```tsx
const {
  components,    // Generated components
  metadata,      // Optional metadata
  isLoading,     // Loading state
  error,         // Error object
  generate,      // Generate UI function
  stream,        // Stream UI function
  reset,         // Reset state
} = useGenerateUI({
  apiKey: string,
  model?: string,
  temperature?: number,
  maxTokens?: number,
  onError?: (error: Error) => void,
});
```

### useChat Hook

```tsx
const {
  messages,      // Chat messages with UI
  isLoading,     // Loading state
  error,         // Error object
  sendMessage,   // Send message function
  reset,         // Reset conversation
} = useChat({
  apiKey: string,
  model?: string,
  temperature?: number,
  maxTokens?: number,
  onError?: (error: Error) => void,
});
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- **Groq** - For blazing-fast LLM inference
- **Thesys C1** - Inspiration for the generative UI concept
- **Crayon** - Inspiration for the component architecture

## 🔗 Links

- [Groq Console](https://console.groq.com/) - Get your API key
- [Documentation](./docs) - Full documentation
- [Examples](./examples) - More examples

---

Built with ❤️ using Groq • [Get Started](#-quick-start)
