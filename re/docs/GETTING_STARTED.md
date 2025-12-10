# Getting Started with Re

This guide will help you get started with Re Generative UI.

## Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- A Groq API key ([Get one here](https://console.groq.com/keys))
- Basic knowledge of React

## Installation

### Option 1: Use the Packages

Install Re in your existing React project:

```bash
npm install @re/core @re/react-ui
```

### Option 2: Clone the Repository

Clone and run the full demo:

```bash
git clone https://github.com/yourusername/re.git
cd re
npm install
npm run build
npm run dev
```

## Your First Re App

### 1. Basic Setup

Create a new React app or use an existing one:

```bash
npm create vite@latest my-re-app -- --template react-ts
cd my-re-app
npm install @re/core @re/react-ui
```

### 2. Import Styles

In your `main.tsx` or `App.tsx`:

```tsx
import '@re/react-ui/styles.css';
```

### 3. Create a Simple UI Generator

```tsx
import { useState } from 'react';
import { useGenerateUI, ReRenderer, ThemeProvider } from '@re/react-ui';
import '@re/react-ui/styles.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const { components, generate, isLoading, error } = useGenerateUI({
    apiKey: 'your-groq-api-key-here',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      generate(prompt);
    }
  };

  return (
    <ThemeProvider>
      <div style={{ padding: '2rem' }}>
        <h1>My Re App</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a UI to generate..."
            style={{ width: '400px', padding: '0.5rem' }}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </form>

        {error && <p style={{ color: 'red' }}>{error.message}</p>}

        <div style={{ marginTop: '2rem' }}>
          <ReRenderer components={components} />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
```

### 4. Try It Out

Start your app and try these prompts:

- "Show me a contact form"
- "Create a pricing table with 3 tiers"
- "Display monthly sales as a bar chart"
- "Show a user profile card"

## Using the Chat Interface

For a complete chat experience:

```tsx
import { ReChat, ThemeProvider } from '@re/react-ui';
import '@re/react-ui/styles.css';

function App() {
  return (
    <ThemeProvider>
      <div style={{ height: '100vh' }}>
        <ReChat
          apiKey="your-groq-api-key"
          placeholder="Ask me to create a UI..."
          onError={(error) => console.error(error)}
          onAction={(actionId, data) => {
            console.log('Button clicked:', actionId, data);
          }}
        />
      </div>
    </ThemeProvider>
  );
}
```

## Using with Backend API

If you want to use the backend API server:

### 1. Start the API Server

```bash
cd packages/api
cp .env.example .env
# Add your GROQ_API_KEY to .env
npm run dev
```

### 2. Call from Frontend

```tsx
const response = await fetch('http://localhost:3001/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Show me a dashboard',
    apiKey: 'your-groq-api-key'
  })
});

const { ui } = await response.json();
console.log(ui.components);
```

## Adding Dark Mode

```tsx
import { ThemeProvider, useTheme } from '@re/react-ui';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <ThemeToggle />
      {/* Your app */}
    </ThemeProvider>
  );
}
```

## Handling Actions

Components can have interactive actions:

```tsx
<ReRenderer
  components={components}
  onAction={(actionId, data) => {
    // Handle button clicks, form submissions, etc.
    console.log('Action:', actionId, data);

    if (actionId === 'submit-form') {
      // Handle form submission
    }
  }}
/>
```

## Best Practices

1. **Keep API keys secure** - Never commit them to version control
2. **Use environment variables** - Store keys in `.env` files
3. **Handle errors gracefully** - Show user-friendly error messages
4. **Test prompts** - Experiment with different prompt styles
5. **Customize themes** - Modify CSS variables to match your brand

## Example Prompts

Try these to explore Re's capabilities:

**Data Visualization:**
- "Show quarterly revenue as a bar chart"
- "Display user growth over time as a line chart"
- "Create a pie chart of market share"

**Forms:**
- "Create a signup form with email and password"
- "Build a contact form with validation"
- "Design a multi-step checkout form"

**Dashboards:**
- "Show me a sales dashboard"
- "Create an analytics overview"
- "Display KPIs with progress bars"

**Content:**
- "Create a pricing comparison table"
- "Show a feature list with checkmarks"
- "Display a product catalog"

## Next Steps

- Explore the [API Reference](../README.md#-api-reference)
- Check out [example prompts](../README.md#-example-prompts)
- Read about [available components](../README.md#-available-components)
- Join our community (coming soon)

## Troubleshooting

**Components not rendering?**
- Make sure you imported the CSS: `import '@re/react-ui/styles.css'`
- Check browser console for errors

**API errors?**
- Verify your Groq API key is correct
- Check your API key has sufficient credits
- Ensure you're using a supported model

**Styling issues?**
- Make sure ThemeProvider wraps your app
- Check CSS variables are defined
- Verify no conflicting styles

## Getting Help

- Check [Issues](https://github.com/yourusername/re/issues)
- Read the [Documentation](../README.md)
- Join discussions (coming soon)

Happy building with Re! 🚀
