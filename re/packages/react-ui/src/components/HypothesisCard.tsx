import React from 'react';
import clsx from 'clsx';
import type { Hypothesis, Confidence } from '@re/core';

export interface HypothesisCardProps {
    hypothesis: Hypothesis;
    isExpanded?: boolean;
    onToggle?: () => void;
    onAction?: (actionId: string, hypothesisId: string) => void;
}

const confidenceColors: Record<string, string> = {
    low: 're-badge-warning',
    medium: 're-badge-info',
    high: 're-badge-success',
};

const validationIcons: Record<string, string> = {
    pending: '⏳',
    validated: '✓',
    rejected: '✗',
};

export function HypothesisCard({
    hypothesis,
    isExpanded = false,
    onToggle,
    onAction,
}: HypothesisCardProps) {
    const validationStatus = hypothesis.validated === undefined
        ? 'pending'
        : hypothesis.validated
            ? 'validated'
            : 'rejected';

    const statusClass = hypothesis.validated === undefined
        ? 're-hypothesis-pending'
        : hypothesis.validated
            ? 're-hypothesis-validated'
            : 're-hypothesis-rejected';

    return (
        <div className={clsx('re-hypothesis-card', statusClass)}>
            {/* Header with cause → effect */}
            <div className="re-hypothesis-header" onClick={onToggle}>
                <div className="re-hypothesis-flow">
                    <span className="re-hypothesis-cause">{hypothesis.cause}</span>
                    <span className="re-hypothesis-arrow">→</span>
                    <span className="re-hypothesis-effect">{hypothesis.effect}</span>
                </div>
                <div className="re-hypothesis-meta">
                    <span className={clsx('re-badge', confidenceColors[hypothesis.likelihood])}>
                        {hypothesis.likelihood}
                    </span>
                    <span className={clsx('re-hypothesis-status', `re-hypothesis-status-${validationStatus}`)}>
                        {validationIcons[validationStatus]}
                    </span>
                </div>
            </div>

            {/* Mechanism */}
            <p className="re-hypothesis-mechanism">{hypothesis.mechanism}</p>

            {/* Expanded details */}
            {isExpanded && (
                <div className="re-hypothesis-details">
                    {/* Rationale */}
                    <div className="re-hypothesis-section">
                        <h4 className="re-hypothesis-section-title">Rationale</h4>
                        <p className="re-hypothesis-section-text">{hypothesis.rationale}</p>
                    </div>

                    {/* Confounders */}
                    {hypothesis.confounders.length > 0 && (
                        <div className="re-hypothesis-section">
                            <h4 className="re-hypothesis-section-title">Confounders</h4>
                            <div className="re-hypothesis-tags">
                                {hypothesis.confounders.map((c) => (
                                    <span key={c} className="re-badge re-badge-default">{c}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mediators */}
                    {hypothesis.mediators.length > 0 && (
                        <div className="re-hypothesis-section">
                            <h4 className="re-hypothesis-section-title">Mediators</h4>
                            <div className="re-hypothesis-tags">
                                {hypothesis.mediators.map((m) => (
                                    <span key={m} className="re-badge re-badge-info">{m}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Test Methods */}
                    {hypothesis.test_methods.length > 0 && (
                        <div className="re-hypothesis-section">
                            <h4 className="re-hypothesis-section-title">Test Methods</h4>
                            <div className="re-hypothesis-tags">
                                {hypothesis.test_methods.map((method) => (
                                    <span key={method} className="re-badge re-badge-default">
                                        {method.replace(/_/g, ' ')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Test Results */}
                    {hypothesis.test_results.length > 0 && (
                        <div className="re-hypothesis-section">
                            <h4 className="re-hypothesis-section-title">Test Results</h4>
                            <div className="re-hypothesis-results">
                                {hypothesis.test_results.map((result) => (
                                    <div key={result.test_id} className="re-hypothesis-result">
                                        <span className="re-hypothesis-result-method">
                                            {result.method.replace(/_/g, ' ')}
                                        </span>
                                        <span className={clsx(
                                            're-hypothesis-result-sig',
                                            result.is_significant ? 're-text-success' : 're-text-muted'
                                        )}>
                                            {result.is_significant ? 'Significant' : 'Not Significant'}
                                        </span>
                                        {result.p_value !== undefined && (
                                            <span className="re-hypothesis-result-pvalue">
                                                p = {result.p_value.toFixed(4)}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Causal Structure */}
                    {hypothesis.causal_structure && (
                        <div className="re-hypothesis-section">
                            <h4 className="re-hypothesis-section-title">Causal Analysis</h4>
                            <div className="re-hypothesis-causal-stats">
                                <div className="re-hypothesis-stat">
                                    <span className="re-hypothesis-stat-label">Direct Effect</span>
                                    <span className="re-hypothesis-stat-value">
                                        {hypothesis.causal_structure.direct_effect.toFixed(3)}
                                    </span>
                                </div>
                                <div className="re-hypothesis-stat">
                                    <span className="re-hypothesis-stat-label">Indirect Effect</span>
                                    <span className="re-hypothesis-stat-value">
                                        {hypothesis.causal_structure.indirect_effect.toFixed(3)}
                                    </span>
                                </div>
                                <div className="re-hypothesis-stat">
                                    <span className="re-hypothesis-stat-label">Total Effect</span>
                                    <span className="re-hypothesis-stat-value re-text-primary">
                                        {hypothesis.causal_structure.total_effect.toFixed(3)}
                                    </span>
                                </div>
                            </div>
                            <p className="re-hypothesis-lever">
                                <strong>Actionable Lever:</strong> {hypothesis.causal_structure.actionable_lever}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Toggle expand */}
            {onToggle && (
                <button className="re-hypothesis-toggle" onClick={onToggle}>
                    {isExpanded ? 'Show less' : 'Show details'}
                </button>
            )}
        </div>
    );
}
