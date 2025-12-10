import React, { useMemo } from 'react';
import clsx from 'clsx';
import type { CausalNode, CausalEdge } from '@re/core';

export interface CausalDiagramProps {
    nodes: CausalNode[];
    edges: CausalEdge[];
    width?: number;
    height?: number;
    highlightNode?: string;
    onNodeClick?: (nodeId: string) => void;
}

const nodeColors: Record<CausalNode['type'], string> = {
    treatment: '#0066ff',
    outcome: '#10b981',
    confounder: '#f59e0b',
    mediator: '#8b5cf6',
    collider: '#ef4444',
};

const nodeLabels: Record<CausalNode['type'], string> = {
    treatment: 'Treatment',
    outcome: 'Outcome',
    confounder: 'Confounder',
    mediator: 'Mediator',
    collider: 'Collider',
};

/**
 * Simple force-directed-like layout for causal graphs.
 * Places nodes in a left-to-right flow based on type.
 */
function layoutNodes(nodes: CausalNode[], width: number, height: number): CausalNode[] {
    // Group nodes by type for positioning
    const typeOrder: CausalNode['type'][] = ['confounder', 'treatment', 'mediator', 'outcome', 'collider'];
    const groups: Record<string, CausalNode[]> = {};

    for (const node of nodes) {
        if (!groups[node.type]) groups[node.type] = [];
        groups[node.type].push(node);
    }

    const positioned: CausalNode[] = [];
    const padding = 60;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;

    // Position each group
    let xIndex = 0;
    const numGroups = typeOrder.filter(t => groups[t]?.length).length;

    for (const type of typeOrder) {
        const group = groups[type];
        if (!group?.length) continue;

        const x = padding + (usableWidth / (numGroups + 1)) * (xIndex + 1);

        group.forEach((node, yIndex) => {
            const y = padding + (usableHeight / (group.length + 1)) * (yIndex + 1);
            positioned.push({
                ...node,
                x: node.x ?? x,
                y: node.y ?? y,
            });
        });

        xIndex++;
    }

    return positioned;
}

export function CausalDiagram({
    nodes,
    edges,
    width = 600,
    height = 400,
    highlightNode,
    onNodeClick,
}: CausalDiagramProps) {
    // Layout nodes if positions not provided
    const positionedNodes = useMemo(() => {
        const hasPositions = nodes.every(n => n.x !== undefined && n.y !== undefined);
        return hasPositions ? nodes : layoutNodes(nodes, width, height);
    }, [nodes, width, height]);

    // Create node lookup for edge rendering
    const nodeMap = useMemo(() => {
        return new Map(positionedNodes.map(n => [n.id, n]));
    }, [positionedNodes]);

    // Calculate arrow paths
    const arrowPaths = useMemo(() => {
        return edges.map((edge) => {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);

            if (!source?.x || !source?.y || !target?.x || !target?.y) {
                return null;
            }

            // Calculate path with offset for node radius
            const nodeRadius = 30;
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const offsetX = (dx / dist) * nodeRadius;
            const offsetY = (dy / dist) * nodeRadius;

            return {
                ...edge,
                x1: source.x + offsetX,
                y1: source.y + offsetY,
                x2: target.x - offsetX,
                y2: target.y - offsetY,
                midX: (source.x + target.x) / 2,
                midY: (source.y + target.y) / 2,
            };
        }).filter(Boolean);
    }, [edges, nodeMap]);

    return (
        <div className="re-causal-diagram">
            <svg width={width} height={height} className="re-causal-svg">
                {/* Arrow marker definition */}
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon
                            points="0 0, 10 3.5, 0 7"
                            fill="var(--re-text-secondary)"
                        />
                    </marker>
                </defs>

                {/* Edges */}
                {arrowPaths.map((path, i) => path && (
                    <g key={`edge-${i}`} className="re-causal-edge">
                        <line
                            x1={path.x1}
                            y1={path.y1}
                            x2={path.x2}
                            y2={path.y2}
                            stroke="var(--re-text-secondary)"
                            strokeWidth={path.weight ? Math.max(1, Math.min(4, Math.abs(path.weight) * 3)) : 2}
                            markerEnd="url(#arrowhead)"
                            opacity={0.6}
                        />
                        {path.label && (
                            <text
                                x={path.midX}
                                y={path.midY - 8}
                                textAnchor="middle"
                                className="re-causal-edge-label"
                            >
                                {path.label}
                            </text>
                        )}
                        {path.weight !== undefined && (
                            <text
                                x={path.midX}
                                y={path.midY + 12}
                                textAnchor="middle"
                                className="re-causal-edge-weight"
                            >
                                {path.weight.toFixed(2)}
                            </text>
                        )}
                    </g>
                ))}

                {/* Nodes */}
                {positionedNodes.map((node) => (
                    <g
                        key={node.id}
                        className={clsx(
                            're-causal-node',
                            highlightNode === node.id && 're-causal-node-highlight'
                        )}
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={() => onNodeClick?.(node.id)}
                        style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
                    >
                        {/* Node circle */}
                        <circle
                            r={30}
                            fill={nodeColors[node.type]}
                            stroke={highlightNode === node.id ? 'var(--re-text-primary)' : 'var(--re-bg-primary)'}
                            strokeWidth={highlightNode === node.id ? 3 : 2}
                        />

                        {/* Node label */}
                        <text
                            y={5}
                            textAnchor="middle"
                            className="re-causal-node-label"
                            fill="white"
                            fontWeight={600}
                            fontSize={12}
                        >
                            {node.label.length > 10 ? node.label.slice(0, 10) + '...' : node.label}
                        </text>
                    </g>
                ))}
            </svg>

            {/* Legend */}
            <div className="re-causal-legend">
                {Object.entries(nodeColors).map(([type, color]) => (
                    <div key={type} className="re-causal-legend-item">
                        <span
                            className="re-causal-legend-dot"
                            style={{ backgroundColor: color }}
                        />
                        <span className="re-causal-legend-label">
                            {nodeLabels[type as CausalNode['type']]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
