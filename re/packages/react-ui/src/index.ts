// Export all components
export * from './components';

// Export renderer
export * from './renderer';
export { ReRenderer } from './renderer/ReRenderer';

// Export chat interface
export * from './chat';

// Export theme
export * from './theme';

// Re-export specific items from core to avoid naming conflicts
// Import @re/core directly in your app for types
export { useGenerateUI, useChat, useAgent, AgentClient, GroqClient } from '@re/core';
