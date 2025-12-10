/**
 * DynamicRenderer - Renders UI components based on JSON instructions from the backend.
 * Maps component types to actual React components.
 */
import React from 'react';
import { Chart } from './Chart';
import { StatCard } from './StatCard';
import { ReasoningGraph } from './ReasoningGraph';
import type { ReasoningSession } from '@re/core';

export interface UIComponent {
    type: 'stat' | 'chart' | 'table' | 'text' | 'reasoning' | 'error';
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
            if (component.props.trigger && onReasoningTrigger) {
                onReasoningTrigger(component.props.query as string);
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

        case 'error':
            return (
                <div className="re-error-block">
                    <span className="re-error-icon">⚠️</span>
                    <p>{component.props.message as string}</p>
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
