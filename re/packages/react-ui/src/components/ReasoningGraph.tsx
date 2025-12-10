import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import type { ReasoningSession, Hypothesis, CausalNode, CausalEdge } from '@re/core';
import { HypothesisCard } from './HypothesisCard';
import { CausalDiagram } from './CausalDiagram';
import { ReasoningChainComponent } from './ReasoningChain';
import { LeverCard } from './LeverCard';


export interface ReasoningGraphProps {
    session: ReasoningSession;
    showDiagram?: boolean;
    showChain?: boolean;
    showHypotheses?: boolean;
    showLevers?: boolean;
    onAction?: (actionId: string, data?: any) => void;
}

type Tab = 'overview' | 'hypotheses' | 'diagram' | 'recommendations';

const statusColors: Record<ReasoningSession['status'], string> = {
    in_progress: 're-badge-warning',
    completed: 're-badge-success',
    failed: 're-badge-error',
    cancelled: 're-badge-default',
};

const statusLabels: Record<ReasoningSession['status'], string> = {
    in_progress: 'Analyzing...',
    completed: 'Complete',
    failed: 'Failed',
    cancelled: 'Cancelled',
};

export function ReasoningGraph({
    session,
    showDiagram = true,
    showChain = true,
    showHypotheses = true,
    showLevers = true,
    onAction,
}: ReasoningGraphProps) {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [expandedHypothesis, setExpandedHypothesis] = useState<string | null>(null);
    const [highlightedNode, setHighlightedNode] = useState<string | undefined>();

    // Build causal graph from all hypotheses
    const causalGraph = useMemo(() => {
        const nodes: Map<string, CausalNode> = new Map();
        const edges: CausalEdge[] = [];

        session.hypotheses.forEach((h) => {
            // Add cause node
            if (!nodes.has(h.cause)) {
                nodes.set(h.cause, {
                    id: h.cause,
                    label: h.cause,
                    type: 'treatment',
                });
            }

            // Add effect node
            if (!nodes.has(h.effect)) {
                nodes.set(h.effect, {
                    id: h.effect,
                    label: h.effect,
                    type: 'outcome',
                });
            }

            // Add confounders
            h.confounders.forEach((c) => {
                if (!nodes.has(c)) {
                    nodes.set(c, { id: c, label: c, type: 'confounder' });
                }
            });

            // Add mediators
            h.mediators.forEach((m) => {
                if (!nodes.has(m)) {
                    nodes.set(m, { id: m, label: m, type: 'mediator' });
                }
            });

            // Add edge for hypothesis
            const effect = h.causal_structure?.total_effect;
            edges.push({
                source: h.cause,
                target: h.effect,
                weight: effect,
                label: h.validated ? 'validated' : undefined,
            });
        });

        return {
            nodes: Array.from(nodes.values()),
            edges,
        };
    }, [session.hypotheses]);

    // Validated vs rejected counts
    const validatedCount = session.hypotheses.filter((h) => h.validated === true).length;
    const rejectedCount = session.hypotheses.filter((h) => h.validated === false).length;
    const pendingCount = session.hypotheses.filter((h) => h.validated === undefined).length;

    return (
        <div className="re-reasoning-graph">
            {/* Header */}
            <div className="re-reasoning-graph-header">
                <div className="re-reasoning-graph-title-row">
                    <h2 className="re-reasoning-graph-title">Retention Analysis</h2>
                    <span className={clsx('re-badge', statusColors[session.status])}>
                        {statusLabels[session.status]}
                    </span>
                </div>

                {/* Summary stats */}
                <div className="re-reasoning-graph-stats">
                    <div className="re-reasoning-stat">
                        <span className="re-reasoning-stat-value">{session.hypotheses_count}</span>
                        <span className="re-reasoning-stat-label">Hypotheses</span>
                    </div>
                    <div className="re-reasoning-stat">
                        <span className="re-reasoning-stat-value re-text-success">{validatedCount}</span>
                        <span className="re-reasoning-stat-label">Validated</span>
                    </div>
                    <div className="re-reasoning-stat">
                        <span className="re-reasoning-stat-value re-text-error">{rejectedCount}</span>
                        <span className="re-reasoning-stat-label">Rejected</span>
                    </div>
                    <div className="re-reasoning-stat">
                        <span className="re-reasoning-stat-value">
                            {(session.confidence_score * 100).toFixed(0)}%
                        </span>
                        <span className="re-reasoning-stat-label">Confidence</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="re-reasoning-graph-tabs">
                <button
                    className={clsx('re-reasoning-tab', activeTab === 'overview' && 're-reasoning-tab-active')}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                {showHypotheses && (
                    <button
                        className={clsx('re-reasoning-tab', activeTab === 'hypotheses' && 're-reasoning-tab-active')}
                        onClick={() => setActiveTab('hypotheses')}
                    >
                        Hypotheses ({session.hypotheses_count})
                    </button>
                )}
                {showDiagram && (
                    <button
                        className={clsx('re-reasoning-tab', activeTab === 'diagram' && 're-reasoning-tab-active')}
                        onClick={() => setActiveTab('diagram')}
                    >
                        Causal Graph
                    </button>
                )}
                {showLevers && (
                    <button
                        className={clsx('re-reasoning-tab', activeTab === 'recommendations' && 're-reasoning-tab-active')}
                        onClick={() => setActiveTab('recommendations')}
                    >
                        Recommendations ({session.recommended_levers.length})
                    </button>
                )}
            </div>

            {/* Tab content */}
            <div className="re-reasoning-graph-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="re-reasoning-overview">
                        {/* Reasoning chain */}
                        {showChain && session.reasoning_chain && (
                            <ReasoningChainComponent chain={session.reasoning_chain} />
                        )}

                        {/* Validated causes summary */}
                        {session.validated_causes.length > 0 && (
                            <div className="re-reasoning-validated-causes">
                                <h3 className="re-reasoning-section-title">Validated Causes</h3>
                                <div className="re-reasoning-causes-list">
                                    {session.validated_causes.map((cause, i) => (
                                        <div key={i} className="re-reasoning-cause-item">
                                            <span className="re-reasoning-cause-icon">✓</span>
                                            <span className="re-reasoning-cause-text">{cause}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Error state */}
                        {session.status === 'failed' && session.error_message && (
                            <div className="re-alert re-alert-error">
                                <h4 className="re-alert-title">Analysis Failed</h4>
                                <p className="re-alert-message">{session.error_message}</p>
                            </div>
                        )}

                        {/* Loading state */}
                        {session.status === 'in_progress' && (
                            <div className="re-reasoning-loading">
                                <div className="re-reasoning-spinner" />
                                <p>Analyzing causal relationships...</p>
                                <p className="re-text-secondary">
                                    Testing {pendingCount} hypothesis{pendingCount !== 1 ? 'es' : ''}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Hypotheses Tab */}
                {activeTab === 'hypotheses' && showHypotheses && (
                    <div className="re-reasoning-hypotheses">
                        {session.hypotheses.map((hypothesis) => (
                            <HypothesisCard
                                key={hypothesis.hypothesis_id}
                                hypothesis={hypothesis}
                                isExpanded={expandedHypothesis === hypothesis.hypothesis_id}
                                onToggle={() =>
                                    setExpandedHypothesis(
                                        expandedHypothesis === hypothesis.hypothesis_id
                                            ? null
                                            : hypothesis.hypothesis_id
                                    )
                                }
                            />
                        ))}
                        {session.hypotheses.length === 0 && (
                            <p className="re-text-secondary">No hypotheses generated yet.</p>
                        )}
                    </div>
                )}

                {/* Diagram Tab */}
                {activeTab === 'diagram' && showDiagram && (
                    <div className="re-reasoning-diagram-container">
                        <CausalDiagram
                            nodes={causalGraph.nodes}
                            edges={causalGraph.edges}
                            highlightNode={highlightedNode}
                            onNodeClick={setHighlightedNode}
                            width={700}
                            height={400}
                        />
                    </div>
                )}

                {/* Recommendations Tab */}
                {activeTab === 'recommendations' && showLevers && (
                    <div className="re-reasoning-levers">
                        {session.recommended_levers.map((lever, index) => (
                            <LeverCard
                                key={lever.lever_id}
                                lever={lever}
                                isPrimary={index === 0}
                                onApply={(leverId) => onAction?.('apply_lever', { leverId })}
                            />
                        ))}
                        {session.recommended_levers.length === 0 && (
                            <p className="re-text-secondary">No recommendations available yet.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
