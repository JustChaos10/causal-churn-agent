import json
import pytest

from retention_reasoning.agent import RetentionReasoningAgent
from retention_reasoning.data_query import get_data
from retention_reasoning.models.opportunity import Opportunity, OpportunityType
from retention_reasoning.models.hypothesis import TestResult, TestMethod, Confidence


class StubResp:
    def __init__(self, content: str):
        self.content = content


class StubLLM:
    async def ainvoke(self, messages):
        sys_msg = messages[0].content if messages else ""
        # Hypothesis generation prompt
        if "hypothesis" in sys_msg.lower():
            payload = {
                "hypotheses": [
                    {
                        "cause": "return_rate",
                        "effect": "churn_flag",
                        "mechanism": "Higher return rates indicate dissatisfaction leading to churn.",
                        "confounders": ["region"],
                        "mediators": [],
                        "moderators": [],
                        "test_methods": ["regression_adjustment"],
                        "likelihood": "high",
                        "rationale": "Returns correlate with churn.",
                    },
                    {
                        "cause": "avg_order_value",
                        "effect": "churn_flag",
                        "mechanism": "Low AOV customers churn more.",
                        "confounders": [],
                        "mediators": [],
                        "moderators": [],
                        "test_methods": ["regression_adjustment"],
                        "likelihood": "medium",
                        "rationale": "",
                    },
                ]
            }
            return StubResp(json.dumps(payload))

        # Explanation prompt
        if "Respond with JSON in this exact format" in sys_msg:
            return StubResp(
                json.dumps(
                    {
                        "summary": "Stub summary",
                        "causal_chain": ["return_rate leads to churn_flag"],
                        "key_insight": "Stub insight",
                        "root_causes": ["return_rate"],
                        "recommended_actions": [
                            {
                                "action": "Reduce return_rate",
                                "priority": "high",
                                "expected_impact": "lower churn",
                            }
                        ],
                        "confidence_note": "high",
                    }
                )
            )

        return StubResp("{}")


class FakeStats:
    """Deterministic statistical tests for graph logic."""

    def regression_adjustment(self, treatment, outcome, controls, hypothesis_id):
        is_good = treatment.name == "return_rate"
        return TestResult(
            hypothesis_id=hypothesis_id,
            method=TestMethod.REGRESSION_ADJUSTMENT,
            is_significant=is_good,
            p_value=0.01 if is_good else 0.6,
            effect_size=0.3 if is_good else 0.02,
            effect_direction="positive",
            confidence=Confidence.HIGH if is_good else Confidence.LOW,
            sample_size=len(treatment),
        )

    def propensity_score_matching(self, treatment, outcome, confounders, hypothesis_id, n_neighbors=5):
        return self.regression_adjustment(treatment, outcome, confounders, hypothesis_id)

    def granger_causality(self, treatment, outcome, hypothesis_id, max_lag=7):
        return self.regression_adjustment(treatment, outcome, outcome.to_frame(), hypothesis_id)

    def meta_analysis(self, test_results):
        significant = any(r.is_significant for r in test_results)
        pooled_effect = max((r.effect_size or 0.0) for r in test_results)
        return {
            "consensus_causal": significant,
            "effect_size": pooled_effect,
            "confidence": Confidence.HIGH if significant else Confidence.LOW,
            "effect_direction": "positive",
            "n_tests": len(test_results),
            "n_significant": sum(1 for r in test_results if r.is_significant),
            "individual_results": [],
        }


@pytest.mark.asyncio
async def test_langgraph_five_node_pipeline_logic():
    df = get_data()
    assert not df.empty

    features = [c for c in df.columns if c != "customer_id"]
    agent = RetentionReasoningAgent(llm=StubLLM(), available_features=features)
    # Inject deterministic stats so we test graph wiring, not real stats.
    agent.causal_tester.statistical_tests = FakeStats()

    opp = Opportunity(
        opportunity_id="test_001",
        type=OpportunityType.CHURN_SPIKE,
        title="Test",
        description="Test",
        affected_cohort={"segment": "all_customers"},
        metric_name="churn_flag",
        baseline_value=float(df["churn_flag"].mean()),
        current_value=float(df["churn_flag"].mean()),
        sample_size=len(df),
        severity="medium",
    )

    session = await agent.analyze_opportunity(opportunity=opp, data=df)

    assert session.status == "completed"
    assert session.hypotheses_count == 2
    assert session.validated_hypotheses_count == 1
    assert "return_rate" in session.validated_causes
    assert session.recommended_levers
    assert session.recommended_levers[0].name == "return_rate"

