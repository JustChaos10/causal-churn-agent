/**
 * DynamicRenderer - Renders UI components based on JSON instructions from the backend.
 * Maps component types to actual React components.
 */
import React from 'react';
import { Chart } from './Chart';
import { StatCard } from './StatCard';
import { ReasoningGraph } from './ReasoningGraph';
import { Alert } from './Alert';
import { Progress } from './Progress';
import { Badge } from './Badge';
import type { ReasoningSession } from '@re/core';

export interface UIComponent {
    type: 'stat' | 'chart' | 'table' | 'text' | 'reasoning' | 'error' | 'suggestions' | 'alert' | 'progress' | 'hypothesis' | 'lever' | 'badge';
    props: Record<string, unknown>;
}

export interface DynamicRendererProps {
    components: UIComponent[];
    session?: ReasoningSession | null;
    onReasoningTrigger?: (query: string) => void;
}

export function DynamicRenderer({
    components,
    session,
    onReasoningTrigger,
}: DynamicRendererProps): React.ReactElement {
    return (
        <div className="re-dynamic-renderer">
            {components.map((component, index) => (
                <div key={index} className="re-dynamic-component">
                    {renderComponent(component, session, onReasoningTrigger)}
                </div>
            ))}
        </div>
    );
}

function ReasoningBlock({
    query,
    trigger,
    session,
    onReasoningTrigger,
}: {
    query?: string;
    trigger?: boolean;
    session?: ReasoningSession | null;
    onReasoningTrigger?: (query: string) => void;
}) {
    const hasFiredRef = React.useRef(false);
    const lastKeyRef = React.useRef<string | undefined>(undefined);

    React.useEffect(() => {
        const key = query;
        if (key !== lastKeyRef.current) {
            hasFiredRef.current = false;
            lastKeyRef.current = key;
        }
        if (trigger && query && onReasoningTrigger && !hasFiredRef.current) {
            hasFiredRef.current = true;
            onReasoningTrigger(query);
        }
    }, [trigger, query, onReasoningTrigger]);

    if (trigger) {
        return (
            <div className="re-reasoning-loading">
                <div className="re-spinner"></div>
                <p>Analyzing causal relationships...</p>
            </div>
        );
    }
    if (session) {
        return <ReasoningGraph session={session} />;
    }
    return <div className="re-reasoning-placeholder">Reasoning results will appear here...</div>;
}

function renderComponent(
    component: UIComponent,
    session?: ReasoningSession | null,
    onReasoningTrigger?: (query: string) => void
): React.ReactElement {
    switch (component.type) {
        case 'stat':
            return (
                <StatCard
                    title={component.props.title as string}
                    value={component.props.value as string | number}
                    icon={component.props.icon as string}
                    change={component.props.change as string}
                    changeType={component.props.changeType as 'positive' | 'negative' | 'neutral'}
                    subtitle={component.props.subtitle as string}
                />
            );

        case 'chart':
            return (
                <div className="re-chart-wrapper">
                    <Chart
                        props={{
                            chartType: component.props.chartType as 'bar' | 'line' | 'pie' | 'area',
                            data: component.props.data as Array<Record<string, unknown>>,
                            xKey: component.props.xKey as string,
                            yKey: component.props.yKey as string,
                            title: component.props.title as string,
                        }}
                    />
                </div>
            );

        case 'table':
            return (
                <div className="re-table-wrapper">
                    <h4 className="re-table-title">{component.props.title as string}</h4>
                    <table className="re-table">
                        <thead>
                            <tr>
                                {(component.props.columns as string[])?.map((col, i) => (
                                    <th key={i}>{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(component.props.data as Array<Record<string, unknown>>)?.map((row, i) => (
                                <tr key={i}>
                                    {(component.props.columns as string[])?.map((col, j) => (
                                        <td key={j}>{String(row[col] ?? '')}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );

        case 'text':
            return (
                <div className="re-text-block">
                    <p>{component.props.content as string}</p>
                </div>
            );

        case 'reasoning':
            return (
                <ReasoningBlock
                    trigger={component.props.trigger as boolean | undefined}
                    query={component.props.query as string | undefined}
                    session={session}
                    onReasoningTrigger={onReasoningTrigger}
                />
            );

        case 'error':
            return (
                <div className="re-error-block">
                    <span className="re-error-icon">⚠️</span>
                    <p>{component.props.message as string}</p>
                </div>
            );

        case 'suggestions':
            return (
                <div className="re-suggestions-block">
                    <h4 className="re-suggestions-title">
                        {(component.props.title as string) || 'Related questions'}
                    </h4>
                    <ul className="re-suggestions-list">
                        {((component.props.items as string[]) || []).map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>
                </div>
            );

        case 'alert':
            return (
                <Alert
                    props={{
                        title: component.props.title as string,
                        message: component.props.message as string,
                        variant: (component.props.variant as 'info' | 'success' | 'warning' | 'error') || 'info',
                    }}
                />
            );

        case 'progress':
            return (
                <Progress
                    props={{
                        value: component.props.value as number,
                        max: (component.props.max as number) || 100,
                        label: component.props.label as string,
                        showPercentage: component.props.showPercentage as boolean,
                    }}
                />
            );

        case 'badge':
            return (
                <Badge
                    props={{
                        label: component.props.label as string,
                        variant: (component.props.variant as 'default' | 'success' | 'warning' | 'error' | 'info') || 'default',
                    }}
                />
            );

        case 'hypothesis':
            // Simplified hypothesis display - LLM can generate this directly
            return (
                <div className="re-hypothesis-simple">
                    <div className="re-hypothesis-header">
                        <span className="re-hypothesis-cause">{component.props.cause as string}</span>
                        <span className="re-hypothesis-arrow">→</span>
                        <span className="re-hypothesis-effect">{component.props.effect as string}</span>
                    </div>
                    <p className="re-hypothesis-mechanism">{component.props.mechanism as string}</p>
                    {typeof component.props.confidence === 'string' && (
                        <span className={`re-badge re-badge-${component.props.confidence === 'high' ? 'success' : component.props.confidence === 'medium' ? 'warning' : 'info'}`}>
                            {component.props.confidence} confidence
                        </span>
                    )}
                </div>
            );

        case 'lever':
            // Simplified lever/recommendation display
            return (
                <div className="re-lever-simple">
                    <div className="re-lever-header">
                        <h4 className="re-lever-name">{component.props.name as string}</h4>
                        <span className={`re-badge re-badge-${component.props.effort === 'low' ? 'success' : component.props.effort === 'medium' ? 'warning' : 'error'}`}>
                            {component.props.effort as string} effort
                        </span>
                    </div>
                    <p className="re-lever-description">{component.props.description as string}</p>
                    {typeof component.props.impact === 'string' && (
                        <div className="re-lever-impact">
                            Expected impact: <strong>{component.props.impact}</strong>
                        </div>
                    )}
                </div>
            );

        default:
            return (
                <div className="re-unknown-component">
                    <p>Unknown component type: {component.type}</p>
                </div>
            );
    }
}
