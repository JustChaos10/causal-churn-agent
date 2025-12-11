import React, { useState, useCallback, useRef, useEffect } from 'react';
import './App.css';

// ============================================================================
// Types
// ============================================================================

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

interface ReasoningResult {
  query?: string;
  hypotheses?: Array<{
    cause: string;
    effect: string;
    confidence: number;
    mechanism: string;
  }>;
  levers?: Array<{
    action: string;
    impact: string;
    effort: string;
    confidence: number;
  }>;
  summary?: string;
}

// ============================================================================
// Typewriter Text Effect
// ============================================================================

function TypewriterText({ text, speed = 20 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setIsComplete(false);
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayed(prev => prev + text[index]);
        index++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={`c1-typewriter ${isComplete ? 'c1-typewriter--complete' : ''}`}>
      {displayed}
      {!isComplete && <span className="c1-cursor">|</span>}
    </span>
  );
}

// ============================================================================
// Skeleton Loading Placeholder
// ============================================================================

function Skeleton({ width = '100%', height = '20px', variant = 'text' }: {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rect' | 'circle';
}) {
  return (
    <div
      className={`c1-skeleton c1-skeleton--${variant}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      }}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="c1-skeleton-card">
      <Skeleton width={40} height={40} variant="circle" />
      <div className="c1-skeleton-content">
        <Skeleton width="60%" height={24} />
        <Skeleton width="40%" height={16} />
      </div>
    </div>
  );
}

function SkeletonResponse() {
  return (
    <div className="c1-skeleton-response">
      <Skeleton width="90%" height={16} />
      <Skeleton width="75%" height={16} />
      <Skeleton width="85%" height={16} />
      <div className="c1-skeleton-cards">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <Skeleton width="100%" height={120} variant="rect" />
    </div>
  );
}

// ============================================================================
// Data Source Badge
// ============================================================================

function DataSourceBadge({ source = 'retention_customers.csv' }: { source?: string }) {
  return (
    <div className="c1-source-badge">
      <span className="c1-source-icon">📊</span>
      <span className="c1-source-text">Data from: <strong>{source}</strong></span>
    </div>
  );
}

// ============================================================================
// Loading Progress Bar
// ============================================================================

function LoadingProgress({ message = "Analyzing..." }: { message?: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="c1-loading-progress">
      <div className="c1-loading-header">
        <span className="c1-loading-icon">✨</span>
        <span className="c1-loading-text">{message}</span>
      </div>
      <div className="c1-progress-bar">
        <div
          className="c1-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="c1-loading-steps">
        <div className={`c1-step ${progress > 20 ? 'c1-step--done' : ''}`}>
          <span className="c1-step-icon">{progress > 20 ? '✓' : '○'}</span>
          Processing query
        </div>
        <div className={`c1-step ${progress > 50 ? 'c1-step--done' : ''}`}>
          <span className="c1-step-icon">{progress > 50 ? '✓' : '○'}</span>
          Analyzing data
        </div>
        <div className={`c1-step ${progress > 80 ? 'c1-step--done' : ''}`}>
          <span className="c1-step-icon">{progress > 80 ? '✓' : '○'}</span>
          Generating response
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// C1-Style Stat Card with Animation
// ============================================================================

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = 0;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(startValue + (value - startValue) * eased));

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };

    requestAnimationFrame(tick);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

function StatCard({
  title,
  value,
  icon,
  subtitle,
  change,
  changeType,
  index = 0
}: {
  title: string;
  value: string;
  icon?: string;
  subtitle?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  index?: number;
}) {
  const [copied, setCopied] = useState(false);

  const getIconEmoji = (iconName?: string) => {
    const icons: Record<string, string> = {
      'trending_down': '📉',
      'trending_up': '📈',
      'users': '👥',
      'people': '👥',
      'chart': '📊',
      'percent': '%',
      'warning': '⚠️',
      'check': '✅',
    };
    return iconName ? icons[iconName] || '📊' : null;
  };

  const getChangeClass = () => {
    if (!changeType) return '';
    if (changeType === 'positive') return 'c1-stat-change--positive';
    if (changeType === 'negative') return 'c1-stat-change--negative';
    return '';
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${title}: ${value}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      className={`c1-stat-card ${changeType ? `c1-stat-card--${changeType}` : ''}`}
      onClick={handleCopy}
      title="Click to copy"
    >
      {copied && <div className="c1-copied-toast">Copied! ✓</div>}
      {icon && <div className="c1-stat-icon">{getIconEmoji(icon)}</div>}
      <div className="c1-stat-value">{value}</div>
      {change && (
        <div className={`c1-stat-change ${getChangeClass()}`}>
          <span className="c1-change-arrow">{changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : ''}</span>
          {change}
        </div>
      )}
      <div className="c1-stat-title">{title}</div>
      {subtitle && <div className="c1-stat-subtitle">{subtitle}</div>}
    </div>
  );
}

// ============================================================================
// C1-Style Pie Chart
// ============================================================================

function PieChart({
  title,
  data,
  labelKey,
  valueKey
}: {
  title: string;
  data: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
}) {
  const total = data.reduce((sum, item) => sum + (Number(item[valueKey]) || 0), 0);
  const colors = ['#4fd1c5', '#f472b6', '#fbbf24', '#a78bfa', '#34d399', '#f87171'];

  // Calculate segments
  let currentAngle = 0;
  const segments = data.map((item, i) => {
    const value = Number(item[valueKey]) || 0;
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const startAngle = currentAngle;
    currentAngle += (percentage / 100) * 360;
    return {
      label: String(item[labelKey]),
      value,
      percentage,
      startAngle,
      endAngle: currentAngle,
      color: colors[i % colors.length],
    };
  });

  // Create conic gradient
  let gradientStops = '';
  segments.forEach((seg, i) => {
    if (i === 0) {
      gradientStops += `${seg.color} 0deg ${seg.endAngle}deg`;
    } else {
      gradientStops += `, ${seg.color} ${seg.startAngle}deg ${seg.endAngle}deg`;
    }
  });

  return (
    <div className="c1-pie-section">
      <h3 className="c1-chart-title">{title}</h3>
      <div className="c1-pie-container">
        <div
          className="c1-pie-chart"
          style={{ background: `conic-gradient(${gradientStops})` }}
        >
          <div className="c1-pie-center">
            <span className="c1-pie-total">{total.toLocaleString()}</span>
            <span className="c1-pie-label">Total</span>
          </div>
        </div>
        <div className="c1-pie-legend">
          {segments.map((seg, i) => (
            <div key={i} className="c1-legend-item">
              <span className="c1-legend-color" style={{ background: seg.color }}></span>
              <span className="c1-legend-label">{seg.label}</span>
              <span className="c1-legend-value">{seg.value.toLocaleString()}</span>
              <span className="c1-legend-percent">{seg.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// C1-Style Horizontal Bar Chart
// ============================================================================

interface BarChartData {
  [key: string]: string | number;
}

function HorizontalBarChart({
  title,
  data,
  xKey,
  yKey
}: {
  title: string;
  data: BarChartData[];
  xKey: string;
  yKey: string;
}) {
  const maxVal = Math.max(...data.map(d => Number(d[yKey]) || 0));

  return (
    <div className="c1-chart-section">
      <h3 className="c1-chart-title">{title}</h3>
      <div className="c1-bar-chart">
        {data.map((item, i) => {
          const val = Number(item[yKey]) || 0;
          const percentage = maxVal > 0 ? (val / maxVal) * 100 : 0;
          const displayVal = val < 1 ? `${(val * 100).toFixed(0)}%` : val.toFixed(1);

          return (
            <div key={i} className="c1-bar-row">
              <div className="c1-bar-label">{String(item[xKey])}</div>
              <div className="c1-bar-container">
                <div
                  className="c1-bar-fill"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <div className="c1-bar-value">{displayVal}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Reasoning Results Display
// ============================================================================

function ReasoningResults({ result }: { result: ReasoningResult }) {
  return (
    <div className="c1-reasoning-results">
      {result.summary && (
        <div className="c1-reasoning-summary">
          <h4>Analysis Summary</h4>
          <p>{result.summary}</p>
        </div>
      )}

      {result.hypotheses && result.hypotheses.length > 0 && (
        <div className="c1-hypotheses-section">
          <h4>🔍 Key Findings</h4>
          <div className="c1-hypotheses-list">
            {result.hypotheses.map((h, i) => (
              <div key={i} className="c1-hypothesis-card">
                <div className="c1-hypothesis-header">
                  <span className="c1-hypothesis-cause">{h.cause}</span>
                  <span className="c1-hypothesis-arrow">→</span>
                  <span className="c1-hypothesis-effect">{h.effect}</span>
                </div>
                <div className="c1-hypothesis-mechanism">{h.mechanism}</div>
                <div className="c1-hypothesis-confidence">
                  Confidence: {(h.confidence * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.levers && result.levers.length > 0 && (
        <div className="c1-levers-section">
          <h4>🎯 Recommended Actions</h4>
          <div className="c1-levers-list">
            {result.levers.map((l, i) => (
              <div key={i} className="c1-lever-card">
                <div className="c1-lever-action">{l.action}</div>
                <div className="c1-lever-details">
                  <span className="c1-lever-impact">Impact: {l.impact}</span>
                  <span className="c1-lever-effort">Effort: {l.effort}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Reasoning Executor Component
// ============================================================================

function ReasoningExecutor({
  query,
  apiEndpoint
}: {
  query: string;
  apiEndpoint: string;
}) {
  const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading');
  const [result, setResult] = useState<ReasoningResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const runAnalysis = async () => {
      try {
        const response = await fetch(`${apiEndpoint}/api/analyze-query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.status}`);
        }

        const data = await response.json();
        setResult(data);
        setStatus('complete');
      } catch (err) {
        console.error('Reasoning error:', err);
        setError(err instanceof Error ? err.message : 'Analysis failed');
        setStatus('error');
      }
    };

    runAnalysis();
  }, [query, apiEndpoint]);

  if (status === 'loading') {
    return (
      <div className="c1-reasoning-loading">
        <div className="c1-reasoning-spinner"></div>
        <div className="c1-reasoning-loading-text">
          <span className="c1-loading-title">Running causal analysis...</span>
          <span className="c1-loading-query">{query}</span>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="c1-error-block">
        <span className="c1-error-icon">⚠️</span>
        <span>{error}</span>
      </div>
    );
  }

  if (result) {
    return <ReasoningResults result={result} />;
  }

  return null;
}

// ============================================================================
// Component Renderer
// ============================================================================

function renderComponent(component: UIComponent, apiEndpoint: string): React.ReactElement {
  switch (component.type) {
    case 'stat':
      return (
        <StatCard
          title={component.props.title as string || 'Metric'}
          value={String(component.props.value || '-')}
          icon={component.props.icon as string}
          subtitle={component.props.subtitle as string}
          change={component.props.change as string}
          changeType={component.props.changeType as 'positive' | 'negative' | 'neutral'}
        />
      );

    case 'chart': {
      const chartData = component.props.data as BarChartData[];
      const chartType = component.props.chartType as string || 'bar';

      if (!chartData || chartData.length === 0) {
        return <div className="c1-text-block">No chart data available</div>;
      }

      // Use pie chart for pie type
      if (chartType === 'pie') {
        return (
          <PieChart
            title={component.props.title as string || 'Chart'}
            data={chartData}
            labelKey={component.props.xKey as string || 'name'}
            valueKey={component.props.yKey as string || 'value'}
          />
        );
      }

      // Default to bar chart
      return (
        <HorizontalBarChart
          title={component.props.title as string || 'Chart'}
          data={chartData}
          xKey={component.props.xKey as string || 'name'}
          yKey={component.props.yKey as string || 'value'}
        />
      );
    }

    case 'text': {
      const content = component.props.content as string || '';
      // Parse simple markdown
      const formatted = content
        .split('\n')
        .map((line, i) => {
          // Headers
          if (line.startsWith('## ')) {
            return <h2 key={i} className="c1-text-h2">{line.replace('## ', '')}</h2>;
          }
          if (line.startsWith('### ')) {
            return <h3 key={i} className="c1-text-h3">{line.replace('### ', '')}</h3>;
          }
          // Bold text
          const withBold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          // Lists
          if (line.startsWith('- ')) {
            return <li key={i} className="c1-text-li" dangerouslySetInnerHTML={{ __html: withBold.replace('- ', '') }} />;
          }
          // Regular paragraph
          if (line.trim()) {
            return <p key={i} className="c1-text-p" dangerouslySetInnerHTML={{ __html: withBold }} />;
          }
          return null;
        })
        .filter(Boolean);

      return <div className="c1-text-block">{formatted}</div>;
    }

    case 'reasoning':
      // If trigger is true, actually run the analysis
      if (component.props.trigger) {
        return (
          <ReasoningExecutor
            query={component.props.query as string}
            apiEndpoint={apiEndpoint}
          />
        );
      }
      return <div className="c1-text-block">Analysis complete</div>;

    case 'error':
      return (
        <div className="c1-error-block">
          <span className="c1-error-icon">⚠️</span>
          <span>{component.props.message as string}</span>
        </div>
      );

    case 'suggestions': {
      const suggestions = component.props.items as string[];
      const title = component.props.title as string;
      return (
        <div className="c1-suggestions">
          <div className="c1-suggestions-title">{title || "Related questions:"}</div>
          <div className="c1-suggestions-list">
            {suggestions?.map((suggestion, i) => (
              <button
                key={i}
                className="c1-suggestion-chip"
                onClick={() => {
                  // Find and populate the input field
                  const input = document.querySelector('.c1-input') as HTMLInputElement;
                  if (input) {
                    input.value = suggestion;
                    input.focus();
                    // Trigger input event for React state
                    const event = new Event('input', { bubbles: true });
                    input.dispatchEvent(event);
                  }
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      );
    }

    case 'table': {
      const columns = component.props.columns as string[];
      const tableData = component.props.data as Record<string, unknown>[];

      // Helper to find value by column name (case-insensitive, handles underscore/space variations)
      const getCellValue = (row: Record<string, unknown>, col: string): string => {
        // Try exact match first
        if (row[col] !== undefined) return String(row[col]);

        // Try lowercase
        const lowerCol = col.toLowerCase();
        if (row[lowerCol] !== undefined) return String(row[lowerCol]);

        // Try with underscores (e.g., "Customer Count" -> "customer_count")
        const underscoreCol = col.toLowerCase().replace(/\s+/g, '_');
        if (row[underscoreCol] !== undefined) return String(row[underscoreCol]);

        // Try without underscores (e.g., "customer_count" -> "customercount")
        const noUnderscoreCol = col.toLowerCase().replace(/[_\s]+/g, '');
        for (const key of Object.keys(row)) {
          if (key.toLowerCase().replace(/[_\s]+/g, '') === noUnderscoreCol) {
            return String(row[key]);
          }
        }

        // Try positional match if column index matches key order
        const keys = Object.keys(row);
        const colIndex = columns?.indexOf(col);
        if (colIndex !== undefined && colIndex >= 0 && keys[colIndex]) {
          return String(row[keys[colIndex]]);
        }

        return '';
      };

      return (
        <div className="c1-table-wrapper">
          <h4 className="c1-table-title">{component.props.title as string}</h4>
          <table className="c1-table">
            <thead>
              <tr>
                {columns?.map((col, i) => <th key={i}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {tableData?.map((row, i) => (
                <tr key={i}>
                  {columns?.map((col, j) => (
                    <td key={j}>{getCellValue(row, col)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'error':
      return (
        <div className="c1-error-block">
          <span className="c1-error-icon">⚠️</span>
          <span className="c1-error-message">{component.props.message as string || 'An error occurred'}</span>
        </div>
      );

    case 'loading':
      return (
        <div className="c1-loading-indicator">
          <div className="c1-loading-spinner"></div>
          <span className="c1-loading-text">{component.props.message as string || 'Loading...'}</span>
        </div>
      );

    default:
      return (
        <div className="c1-text-block">
          {typeof component.props === 'object'
            ? JSON.stringify(component.props, null, 2)
            : String(component.props)}
        </div>
      );
  }
}

// ============================================================================
// Main App Component
// ============================================================================

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showConfetti, setShowConfetti] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const apiEndpoint = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Theme toggle
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Cmd/Ctrl + N for new chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        startNewConversation();
      }
      // Escape to blur
      if (e.key === 'Escape') {
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Confetti effect
  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  // Delete a conversation
  const deleteConversation = useCallback((convoId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the chat when clicking delete
    setConversations(prev => prev.filter(c => c.id !== convoId));
    if (activeConversation?.id === convoId) {
      const remaining = conversations.filter(c => c.id !== convoId);
      setActiveConversation(remaining.length > 0 ? remaining[0] : null);
    }
  }, [activeConversation, conversations]);

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

  // Initialize with one conversation only once
  useEffect(() => {
    if (conversations.length === 0) {
      const newConvo: Conversation = {
        id: crypto.randomUUID(),
        title: 'New Chat',
        messages: [],
        createdAt: new Date(),
      };
      setConversations([newConvo]);
      setActiveConversation(newConvo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      title: activeConversation.messages.length === 0
        ? inputValue.slice(0, 25) + (inputValue.length > 25 ? '...' : '')
        : activeConversation.title,
      messages: [...activeConversation.messages, userMessage],
    };

    setActiveConversation(updatedConvo);
    setConversations(prev => prev.map(c => c.id === updatedConvo.id ? updatedConvo : c));
    setInputValue('');
    setIsLoading(true);

    try {
      // Create a placeholder assistant message that we'll update as stream comes in
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        components: [],
        timestamp: new Date(),
      };

      // Add placeholder message to show streaming
      let streamingConvo = {
        ...updatedConvo,
        messages: [...updatedConvo.messages, assistantMessage],
      };
      setActiveConversation(streamingConvo);
      setConversations(prev => prev.map(c => c.id === streamingConvo.id ? streamingConvo : c));

      // Use SSE streaming
      const response = await fetch(`${apiEndpoint}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_id: activeConversation.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let streamedText = '';
      const streamedComponents: UIComponent[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'text-delta') {
                  // Accumulate text but don't display raw JSON - it will be parsed for components
                  streamedText += data.text;
                  // Only update if we don't have components yet (shows we're loading)
                  if (streamedComponents.length === 0) {
                    const updatedMessage = {
                      ...assistantMessage,
                      content: '',
                      components: [{
                        type: 'loading',
                        props: { message: 'Analyzing your question...' }
                      }],
                    };

                    streamingConvo = {
                      ...streamingConvo,
                      messages: [...updatedConvo.messages, updatedMessage],
                    };
                    setActiveConversation(streamingConvo);
                    setConversations(prev => prev.map(c => c.id === streamingConvo.id ? streamingConvo : c));
                  }
                }

                if (data.type === 'component') {
                  // Add component as it streams in
                  streamedComponents.push(data.component);

                  const updatedMessage = {
                    ...assistantMessage,
                    content: streamedText,
                    components: [...streamedComponents],
                  };

                  streamingConvo = {
                    ...streamingConvo,
                    messages: [...updatedConvo.messages, updatedMessage],
                  };
                  setActiveConversation(streamingConvo);
                  setConversations(prev => prev.map(c => c.id === streamingConvo.id ? streamingConvo : c));
                }

                if (data.type === 'error') {
                  throw new Error(data.message);
                }
              } catch (parseError) {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }
      }

      // Final update after stream completes - clear the "Thinking..." text
      const finalMessage = {
        ...assistantMessage,
        content: '', // Don't show raw JSON - components render the content
        components: streamedComponents,
      };

      const finalConvo = {
        ...updatedConvo,
        messages: [...updatedConvo.messages, finalMessage],
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
    <div className={`c1-app c1-theme-${theme}`}>
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="c1-confetti">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="c1-confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                backgroundColor: ['#4fd1c5', '#f472b6', '#fbbf24', '#a78bfa', '#34d399'][Math.floor(Math.random() * 5)],
              }}
            />
          ))}
        </div>
      )}

      {/* Sidebar */}
      <aside className={`c1-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="c1-sidebar-header">
          <span className="c1-logo">🧠</span>
          {!sidebarCollapsed && <span className="c1-brand">Niti AI</span>}
          <button className="c1-icon-btn" title="Toggle Sidebar" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {!sidebarCollapsed && (
          <>
            <button className="c1-new-chat-btn" onClick={startNewConversation}>
              <span>New Chat</span>
              <span>+</span>
            </button>

            <div className="c1-chat-list">
              <div className="c1-chat-section">
                <span className="c1-section-label">Today</span>
                {conversations.map(convo => (
                  <div
                    key={convo.id}
                    className={`c1-chat-item ${activeConversation?.id === convo.id ? 'active' : ''}`}
                    onClick={() => setActiveConversation(convo)}
                  >
                    <span className="c1-chat-title">{convo.title}</span>
                    <button
                      className="c1-delete-btn"
                      title="Delete chat"
                      onClick={(e) => deleteConversation(convo.id, e)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Main Content */}
      <main className="c1-main">
        {/* Header */}
        <header className="c1-header">
          {/* Menu button for collapsed sidebar */}
          {sidebarCollapsed && (
            <button
              className="c1-menu-btn"
              onClick={() => setSidebarCollapsed(false)}
              title="Open sidebar"
            >
              ☰
            </button>
          )}
          <div className="c1-header-title">
            <h1>Niti AI</h1>
            <span className="c1-header-subtitle">· Retention Analytics</span>
          </div>
          <div className="c1-header-actions">
            <button className="c1-header-btn" onClick={() => {
              setInputValue('Run a comprehensive churn analysis');
              inputRef.current?.focus();
            }}>New Analysis</button>
          </div>
        </header>

        {/* Messages */}
        <div className="c1-messages">
          {/* Empty State */}
          {(!activeConversation?.messages || activeConversation.messages.length === 0) && !isLoading && (
            <div className="c1-empty-state">
              <div className="c1-empty-icon">🧠</div>
              <h2 className="c1-empty-title">Niti AI</h2>
              <p className="c1-empty-subtitle">
                Your intelligent retention analytics assistant. Ask me about churn patterns, customer behavior, and growth opportunities.
              </p>
              <div className="c1-example-prompts">
                <button
                  className="c1-example-prompt"
                  onClick={() => {
                    setInputValue('What is our current churn rate by channel?');
                    inputRef.current?.focus();
                  }}
                >
                  What is our current churn rate by channel?
                </button>
                <button
                  className="c1-example-prompt"
                  onClick={() => {
                    setInputValue('Show me regional retention breakdown');
                    inputRef.current?.focus();
                  }}
                >
                  Show me regional retention breakdown
                </button>
                <button
                  className="c1-example-prompt"
                  onClick={() => {
                    setInputValue('Run a comprehensive churn analysis');
                    inputRef.current?.focus();
                  }}
                >
                  Run a comprehensive churn analysis
                </button>
                <button
                  className="c1-example-prompt"
                  onClick={() => {
                    setInputValue('What factors are driving customer churn?');
                    inputRef.current?.focus();
                  }}
                >
                  What factors are driving customer churn?
                </button>
              </div>
            </div>
          )}

          {activeConversation?.messages.map(message => (
            <div key={message.id} className={`c1-message c1-message--${message.role}`}>
              {message.role === 'user' ? (
                <div className="c1-user-bubble">{message.content}</div>
              ) : (
                <div className="c1-assistant-content">
                  {message.content && (
                    <p className="c1-assistant-text">
                      <TypewriterText text={message.content} speed={10} />
                    </p>
                  )}
                  {message.components && message.components.length > 0 && (
                    <div className="c1-components">
                      {/* Data source badge */}
                      <DataSourceBadge source="retention_customers.csv" />
                      {/* Stats row */}
                      <div className="c1-stats-row">
                        {message.components
                          .filter(c => c.type === 'stat')
                          .map((comp, i) => (
                            <div key={i}>{renderComponent(comp, apiEndpoint)}</div>
                          ))}
                      </div>
                      {/* Other components */}
                      {message.components
                        .filter(c => c.type !== 'stat')
                        .map((comp, i) => (
                          <div key={i}>{renderComponent(comp, apiEndpoint)}</div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="c1-message c1-message--assistant">
              <SkeletonResponse />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="c1-input-area">
          <div className="c1-input-container">
            <input
              ref={inputRef}
              type="text"
              className="c1-input"
              placeholder="Ask about churn, retention, or customer analytics..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              className="c1-send-btn"
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
            >
              ↑
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
