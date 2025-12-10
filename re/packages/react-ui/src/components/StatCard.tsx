/**
 * StatCard - Display a key metric with title, value, and optional change indicator.
 * Matches C1's stat card aesthetic.
 */
import React from 'react';

export interface StatCardProps {
    title: string;
    value: string | number;
    icon?: string;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    subtitle?: string;
}

export function StatCard({
    title,
    value,
    icon,
    change,
    changeType = 'neutral',
    subtitle,
}: StatCardProps): React.ReactElement {
    return (
        <div className="re-stat-card">
            <div className="re-stat-card-header">
                {icon && <span className="re-stat-card-icon">{getIcon(icon)}</span>}
                <span className="re-stat-card-title">{title}</span>
            </div>
            <div className="re-stat-card-value">{formatValue(value)}</div>
            {change && (
                <div className={`re-stat-card-change re-stat-card-change--${changeType}`}>
                    {changeType === 'positive' && '↑'}
                    {changeType === 'negative' && '↓'}
                    {change}
                </div>
            )}
            {subtitle && <div className="re-stat-card-subtitle">{subtitle}</div>}
        </div>
    );
}

function formatValue(value: string | number): string {
    if (typeof value === 'number') {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
        return value.toLocaleString();
    }
    return value;
}

function getIcon(icon: string): string {
    const icons: Record<string, string> = {
        users: '👥',
        people: '👥',
        trending_down: '📉',
        trending_up: '📈',
        chart: '📊',
        money: '💰',
        time: '⏱️',
        warning: '⚠️',
        check: '✓',
        x: '✗',
    };
    return icons[icon] || '📊';
}
