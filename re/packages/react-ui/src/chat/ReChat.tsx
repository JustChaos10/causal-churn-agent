import React, { useRef, useEffect, useState } from 'react';
import { useChat, UseChatOptions } from '@re/core';
import { ComponentRenderer } from '../renderer';

export interface ReChatProps extends UseChatOptions {
  placeholder?: string;
  className?: string;
  onAction?: (actionId: string, data?: any) => void;
}

export function ReChat({
  apiKey,
  baseURL,
  model,
  temperature,
  maxTokens,
  placeholder = 'Type a message...',
  className,
  onAction,
  onError,
}: ReChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, error, sendMessage } = useChat({
    apiKey,
    baseURL,
    model,
    temperature,
    maxTokens,
    onError,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput('');
    await sendMessage(message);
  };

  return (
    <div className={`re-chat-container ${className || ''}`}>
      <div className="re-chat-messages">
        {messages.map((message) => (
          <div
            key={message.timestamp}
            className={`re-chat-message re-chat-message-${message.role}`}
          >
            {message.role === 'user' ? (
              <div className="re-chat-message-content">{message.content}</div>
            ) : (
              <div className="re-chat-message-content">
                {message.components && message.components.length > 0 ? (
                  message.components.map((component) => (
                    <ComponentRenderer
                      key={component.id}
                      component={component}
                      onAction={onAction}
                    />
                  ))
                ) : (
                  <div style={{ color: 'var(--re-text-secondary)' }}>Generating...</div>
                )}
              </div>
            )}
          </div>
        ))}
        {error && (
          <div className="re-alert re-alert-error">
            <div className="re-alert-title">Error</div>
            <div className="re-alert-message">{error.message}</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="re-chat-input-container">
        <form className="re-chat-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="re-chat-input"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="re-button re-button-primary re-button-md"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
