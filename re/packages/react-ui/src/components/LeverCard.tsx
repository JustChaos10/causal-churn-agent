import React from 'react';
import clsx from 'clsx';
import type { Lever, Confidence } from '@re/core';

export interface LeverCardProps {
    lever: Lever;
    isPrimary?: boolean;
    onApply?: (leverId: string) => void;
}

const effortColors: Record<Lever['effort'], string> = {
    low: 're-badge-success',
    medium: 're-badge-warning',
    high: 're-badge-error',
};

const confidenceWidths: Record<Confidence, string> = {
    low: '33%',
    medium: '66%',
    high: '100%',
};

export function LeverCard({ lever, isPrimary = false, onApply }: LeverCardProps) {
    const impactPercent = Math.min(100, Math.max(0, lever.expected_impact * 100));
    const impactColor = impactPercent > 20 ? 're-text-success' : impactPercent > 10 ? 're-text-warning' : 're-text-info';

    return (
        <div className={clsx('re-lever-card', isPrimary && 're-lever-card-primary')}>
            {/* Primary badge */}
            {isPrimary && (
                <div className="re-lever-primary-badge">
                    ⭐ Primary Recommendation
                </div>
            )}

            {/* Header */}
            <div className="re-lever-header">
                <h4 className="re-lever-name">{lever.name}</h4>
                <div className="re-lever-badges">
                    <span className={clsx('re-badge', effortColors[lever.effort])}>
                        {lever.effort} effort
                    </span>
                </div>
            </div>

            {/* Description */}
            <p className="re-lever-description">{lever.description}</p>

            {/* Metrics */}
            <div className="re-lever-metrics">
                {/* Expected Impact */}
                <div className="re-lever-metric">
                    <div className="re-lever-metric-header">
                        <span className="re-lever-metric-label">Expected Impact</span>
                        <span className={clsx('re-lever-metric-value', impactColor)}>
                            +{impactPercent.toFixed(1)}%
                        </span>
                    </div>
                    <div className="re-lever-metric-bar">
                        <div
                            className="re-lever-metric-fill re-lever-impact-fill"
                            style={{ width: `${impactPercent}%` }}
                        />
                    </div>
                </div>

                {/* Confidence */}
                <div className="re-lever-metric">
                    <div className="re-lever-metric-header">
                        <span className="re-lever-metric-label">Confidence</span>
                        <span className="re-lever-metric-value">{lever.confidence}</span>
                    </div>
                    <div className="re-lever-metric-bar">
                        <div
                            className="re-lever-metric-fill re-lever-confidence-fill"
                            style={{ width: confidenceWidths[lever.confidence] }}
                        />
                    </div>
                </div>
            </div>

            {/* Timeframe */}
            <div className="re-lever-timeframe">
                <span className="re-lever-timeframe-icon">⏱</span>
                <span className="re-lever-timeframe-text">{lever.timeframe}</span>
            </div>

            {/* Action button */}
            {onApply && (
                <button
                    className="re-button re-button-primary re-lever-apply"
                    onClick={() => onApply(lever.lever_id)}
                >
                    Apply Recommendation
                </button>
            )}
        </div>
    );
}
