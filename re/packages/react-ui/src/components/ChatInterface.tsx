/**
 * ChatInterface - C1-style chat interface with sidebar and dynamic UI rendering.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';

// Inline types to avoid import issues
interface UIComponent {
    type: string;
    props: Record<string, unknown>;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    components?: UIComponent[];
    timestamp: Date;
}

interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: Date;
}

export interface ChatInterfaceProps {
    apiEndpoint?: string;
    title?: string;
    subtitle?: string;
    placeholder?: string;
}

// Simple stat card renderer
function StatCard({ title, value, icon }: { title: string; value: string; icon?: string }) {
    return (
        <div className="re-stat-card">
            <div className="re-stat-card-header">
                {icon && <span className="re-stat-card-icon">{icon}</span>}
                <span className="re-stat-card-title">{title}</span>
            </div>
            <div className="re-stat-card-value">{value}</div>
        </div>
    );
}

// Simple component renderer
function renderComponent(component: UIComponent): React.ReactElement {
    switch (component.type) {
        case 'stat':
            return (
                <StatCard
                    title={component.props.title as string}
                    value={String(component.props.value)}
                    icon={component.props.icon as string}
                />
            );
        case 'text':
            return (
                <div className="re-text-block">
                    <p>{component.props.content as string}</p>
                </div>
            );
        case 'error':
            return (
                <div className="re-error-block">
                    <span>⚠️</span>
                    <p>{component.props.message as string}</p>
                </div>
            );
        default:
            return (
                <div className="re-text-block">
                    <p>{JSON.stringify(component.props)}</p>
                </div>
            );
    }
}

export function ChatInterface({
    apiEndpoint = 'http://localhost:8000',
    title = 'Niti AI',
    subtitle = 'Retention Analytics Agent',
    placeholder = 'Ask about customer retention...',
}: ChatInterfaceProps): React.ReactElement {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeConversation?.messages]);

    const startNewConversation = useCallback(() => {
        const newConvo: Conversation = {
            id: crypto.randomUUID(),
            title: 'New Chat',
            messages: [],
            createdAt: new Date(),
        };
        setConversations(prev => [newConvo, ...prev]);
        setActiveConversation(newConvo);
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (conversations.length === 0) {
            startNewConversation();
        }
    }, [conversations.length, startNewConversation]);

    const sendMessage = useCallback(async () => {
        if (!inputValue.trim() || !activeConversation || isLoading) return;

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date(),
        };

        const updatedConvo = {
            ...activeConversation,
            title: activeConversation.messages.length === 0 ? inputValue.slice(0, 30) + '...' : activeConversation.title,
            messages: [...activeConversation.messages, userMessage],
        };

        setActiveConversation(updatedConvo);
        setConversations(prev => prev.map(c => c.id === updatedConvo.id ? updatedConvo : c));
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch(`${apiEndpoint}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    conversation_id: activeConversation.id,
                }),
            });

            if (!response.ok) {
                throw new Error(`Chat failed: ${response.status}`);
            }

            const data = await response.json();

            const assistantMessage: ChatMessage = {
                id: data.message_id || crypto.randomUUID(),
                role: 'assistant',
                content: data.text || '',
                components: data.components || [],
                timestamp: new Date(data.timestamp || Date.now()),
            };

            const finalConvo = {
                ...updatedConvo,
                messages: [...updatedConvo.messages, assistantMessage],
            };

            setActiveConversation(finalConvo);
            setConversations(prev => prev.map(c => c.id === finalConvo.id ? finalConvo : c));

        } catch (error) {
            console.error('Chat error:', error);

            const errorMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: '',
                components: [{
                    type: 'error',
                    props: { message: error instanceof Error ? error.message : 'Failed to send message' },
                }],
                timestamp: new Date(),
            };

            const errorConvo = {
                ...updatedConvo,
                messages: [...updatedConvo.messages, errorMessage],
            };

            setActiveConversation(errorConvo);
            setConversations(prev => prev.map(c => c.id === errorConvo.id ? errorConvo : c));
        } finally {
            setIsLoading(false);
        }
    }, [inputValue, activeConversation, isLoading, apiEndpoint]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }, [sendMessage]);

    return (
        <div className="re-chat-interface">
            {/* Sidebar */}
            <div className="re-chat-sidebar">
                <div className="re-chat-sidebar-header">
                    <span className="re-chat-logo">✦</span>
                    <span className="re-chat-title">C1 Chat</span>
                    <button className="re-chat-collapse-btn" title="Collapse">☰</button>
                </div>

                <button className="re-chat-new-btn" onClick={startNewConversation}>
                    New Chat
                    <span>+</span>
                </button>

                <div className="re-chat-history">
                    <div className="re-chat-history-section">
                        <span className="re-chat-history-label">Today</span>
                        {conversations.map(convo => (
                            <button
                                key={convo.id}
                                className={`re-chat-history-item ${activeConversation?.id === convo.id ? 'active' : ''}`}
                                onClick={() => setActiveConversation(convo)}
                            >
                                {convo.title}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="re-chat-main">
                <div className="re-chat-main-header">
                    <div className="re-chat-main-title">
                        <h1>{title}</h1>
                        <span className="re-chat-main-subtitle">{subtitle}</span>
                    </div>
                    <button className="re-chat-action-btn">New Analysis</button>
                </div>

                <div className="re-chat-messages">
                    {activeConversation?.messages.map(message => (
                        <div
                            key={message.id}
                            className={`re-chat-message re-chat-message--${message.role}`}
                        >
                            {message.role === 'user' ? (
                                <div className="re-chat-user-bubble">
                                    {message.content}
                                </div>
                            ) : (
                                <div className="re-chat-assistant-response">
                                    {message.content && (
                                        <p className="re-chat-assistant-text">{message.content}</p>
                                    )}
                                    {message.components && message.components.length > 0 && (
                                        <div className="re-dynamic-renderer">
                                            {message.components.map((comp, i) => (
                                                <div key={i} className="re-dynamic-component">
                                                    {renderComponent(comp)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="re-chat-message re-chat-message--assistant">
                            <div className="re-chat-loading">
                                <div className="re-chat-loading-dot"></div>
                                <div className="re-chat-loading-dot"></div>
                                <div className="re-chat-loading-dot"></div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <div className="re-chat-input-area">
                    <input
                        ref={inputRef}
                        type="text"
                        className="re-chat-input"
                        placeholder={placeholder}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />
                    <button
                        className="re-chat-send-btn"
                        onClick={sendMessage}
                        disabled={isLoading || !inputValue.trim()}
                    >
                        →
                    </button>
                </div>
            </div>
        </div>
    );
}
