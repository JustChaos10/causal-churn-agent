/**
 * TypeScript types matching Niti AI's Python reasoning models.
 * These types enable type-safe communication between RE frontend and Niti AI backend.
 */

// Likelihood levels for hypotheses
export type Likelihood = 'low' | 'medium' | 'high';

// Confidence levels for test results
export type Confidence = 'low' | 'medium' | 'high';

// Causal inference test methods
export type TestMethod =
    | 'granger_causality'
    | 'propensity_matching'
    | 'regression_adjustment'
    | 'regression_discontinuity'
    | 'instrumental_variables'
    | 'difference_in_differences'
    | 'synthetic_control'
    | 'dag_based';

// Session status
export type SessionStatus = 'in_progress' | 'completed' | 'failed' | 'cancelled';

// Opportunity types
export type OpportunityType = 'churn_spike' | 'retention_drop' | 'engagement_decline' | 'custom';

/**
 * A retention opportunity to analyze
 */
export interface Opportunity {
    opportunity_id?: string;
    type: OpportunityType;
    title: string;
    description: string;
    affected_cohort: Record<string, string>;
    metric_name: string;
    baseline_value: number;
    current_value: number;
    sample_size: number;
    severity: 'low' | 'medium' | 'high';
}

/**
 * Result of a single causal inference test
 */
export interface TestResult {
    test_id: string;
    hypothesis_id: string;
    method: TestMethod;
    is_significant: boolean;
    p_value?: number;
    effect_size?: number;
    effect_direction?: 'positive' | 'negative' | 'none';
    point_estimate?: number;
    confidence_interval?: [number, number];
    confidence: Confidence;
    sample_size?: number;
    warnings: string[];
}

/**
 * Detailed causal structure after confounder analysis
 */
export interface CausalStructure {
    hypothesis_id: string;
    graph_id: string;
    direct_effect: number;
    indirect_effect: number;
    total_effect: number;
    mediators: string[];
    confounders: string[];
    colliders: string[];
    true_cause: string;
    proximate_cause: string;
    actionable_lever: string;
    nodes: CausalNode[];
    edges: CausalEdge[];
    structure_confidence: number;
}

/**
 * Node in a causal graph
 */
export interface CausalNode {
    id: string;
    label: string;
    type: 'treatment' | 'outcome' | 'confounder' | 'mediator' | 'collider';
    x?: number;
    y?: number;
}

/**
 * Edge in a causal graph
 */
export interface CausalEdge {
    source: string;
    target: string;
    weight?: number;
    label?: string;
}

/**
 * A testable causal hypothesis about retention
 */
export interface Hypothesis {
    hypothesis_id: string;
    session_id: string;
    cause: string;
    effect: string;
    mechanism: string;
    confounders: string[];
    mediators: string[];
    moderators: string[];
    test_methods: TestMethod[];
    likelihood: Likelihood;
    rationale: string;
    validated?: boolean;
    test_results: TestResult[];
    causal_structure?: CausalStructure;
}

/**
 * A single step in the reasoning chain
 */
export interface ReasoningStep {
    step_number: number;
    claim: string;
    evidence: string;
    confidence: Confidence;
    reasoning?: string;
}

/**
 * Complete reasoning chain explaining the causal analysis
 */
export interface ReasoningChain {
    chain_id: string;
    session_id: string;
    summary: string;
    conclusion: string;
    steps: ReasoningStep[];
    primary_lever: string;
    secondary_levers: string[];
    expected_impact: string;
    overall_confidence: number;
    caveats: string[];
    causal_graph_url?: string;
}

/**
 * Recommended intervention lever
 */
export interface Lever {
    lever_id: string;
    name: string;
    description: string;
    expected_impact: number;
    confidence: Confidence;
    effort: 'low' | 'medium' | 'high';
    timeframe: string;
}

/**
 * A complete retention reasoning session
 */
export interface ReasoningSession {
    session_id: string;
    opportunity_id: string;
    status: SessionStatus;
    hypotheses: Hypothesis[];
    hypotheses_count: number;
    validated_hypotheses_count: number;
    validated_causes: string[];
    recommended_levers: Lever[];
    reasoning_chain?: ReasoningChain;
    confidence_score: number;
    completeness_score: number;
    error_message?: string;
}

/**
 * Response from agent analysis endpoint
 */
export interface AnalysisResponse {
    session: ReasoningSession;
    explanation: string;
    causal_graph?: {
        nodes: CausalNode[];
        edges: CausalEdge[];
    };
}

/**
 * Streaming event from agent
 */
export interface AgentStreamEvent {
    type: 'hypothesis' | 'test_result' | 'explanation' | 'lever' | 'complete' | 'error';
    data: Hypothesis | TestResult | string | Lever | ReasoningSession;
    timestamp: number;
}
