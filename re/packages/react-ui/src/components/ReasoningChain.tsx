import React from 'react';
import clsx from 'clsx';
import type { ReasoningChain as ReasoningChainType, ReasoningStep, Confidence } from '@re/core';

export interface ReasoningChainProps {
    chain: ReasoningChainType;
    showSteps?: boolean;
    compact?: boolean;
}

const confidenceIcons: Record<Confidence, string> = {
    low: '○',
    medium: '◐',
    high: '●',
};

const confidenceColors: Record<Confidence, string> = {
    low: 're-text-warning',
    medium: 're-text-info',
    high: 're-text-success',
};

export function ReasoningChainComponent({
    chain,
    showSteps = true,
    compact = false,
}: ReasoningChainProps) {
    return (
        <div className={clsx('re-reasoning-chain', compact && 're-reasoning-chain-compact')}>
            {/* Summary */}
            <div className="re-reasoning-summary">
                <h3 className="re-reasoning-title">{chain.summary}</h3>
                <div className="re-reasoning-confidence">
                    <span className="re-reasoning-confidence-label">Confidence:</span>
                    <div className="re-reasoning-confidence-bar">
                        <div
                            className="re-reasoning-confidence-fill"
                            style={{ width: `${chain.overall_confidence * 100}%` }}
                        />
                    </div>
                    <span className="re-reasoning-confidence-value">
                        {(chain.overall_confidence * 100).toFixed(0)}%
                    </span>
                </div>
            </div>

            {/* Steps */}
            {showSteps && chain.steps.length > 0 && (
                <div className="re-reasoning-steps">
                    {chain.steps.map((step, index) => (
                        <ReasoningStepCard
                            key={step.step_number}
                            step={step}
                            isLast={index === chain.steps.length - 1}
                        />
                    ))}
                </div>
            )}

            {/* Conclusion */}
            <div className="re-reasoning-conclusion">
                <h4 className="re-reasoning-section-title">Conclusion</h4>
                <p className="re-reasoning-conclusion-text">{chain.conclusion}</p>
            </div>

            {/* Recommendations */}
            <div className="re-reasoning-recommendations">
                <h4 className="re-reasoning-section-title">Recommendations</h4>

                <div className="re-reasoning-primary-lever">
                    <span className="re-reasoning-lever-label">Primary Lever:</span>
                    <span className="re-reasoning-lever-value">{chain.primary_lever}</span>
                </div>

                {chain.secondary_levers.length > 0 && (
                    <div className="re-reasoning-secondary-levers">
                        <span className="re-reasoning-lever-label">Secondary Levers:</span>
                        <ul className="re-reasoning-lever-list">
                            {chain.secondary_levers.map((lever, i) => (
                                <li key={i}>{lever}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="re-reasoning-impact">
                    <span className="re-reasoning-impact-label">Expected Impact:</span>
                    <span className="re-reasoning-impact-value">{chain.expected_impact}</span>
                </div>
            </div>

            {/* Caveats */}
            {chain.caveats.length > 0 && (
                <div className="re-reasoning-caveats">
                    <h4 className="re-reasoning-section-title">Caveats</h4>
                    <ul className="re-reasoning-caveat-list">
                        {chain.caveats.map((caveat, i) => (
                            <li key={i} className="re-reasoning-caveat">{caveat}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

interface ReasoningStepCardProps {
    step: ReasoningStep;
    isLast: boolean;
}

function ReasoningStepCard({ step, isLast }: ReasoningStepCardProps) {
    return (
        <div className="re-reasoning-step">
            {/* Step indicator */}
            <div className="re-reasoning-step-indicator">
                <div className="re-reasoning-step-number">{step.step_number}</div>
                {!isLast && <div className="re-reasoning-step-line" />}
            </div>

            {/* Step content */}
            <div className="re-reasoning-step-content">
                <div className="re-reasoning-step-header">
                    <h5 className="re-reasoning-step-claim">{step.claim}</h5>
                    <span className={clsx('re-reasoning-step-confidence', confidenceColors[step.confidence])}>
                        {confidenceIcons[step.confidence]} {step.confidence}
                    </span>
                </div>

                <p className="re-reasoning-step-evidence">{step.evidence}</p>

                {step.reasoning && (
                    <p className="re-reasoning-step-reasoning">{step.reasoning}</p>
                )}
            </div>
        </div>
    );
}
