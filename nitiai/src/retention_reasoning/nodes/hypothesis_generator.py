"""Hypothesis generation node using LLM."""

import json
from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import SystemMessage, HumanMessage
from loguru import logger

from ..models.hypothesis import Hypothesis, Likelihood, TestMethod
from ..models.opportunity import Opportunity
from ..prompts.hypothesis_generation import (
    HYPOTHESIS_GENERATION_SYSTEM_PROMPT,
    generate_hypothesis_prompt,
)


class HypothesisGeneratorNode:
    """Generates causal hypotheses using an LLM."""

    def __init__(
        self,
        llm: BaseChatModel,
        available_features: list[str],
        max_hypotheses: int = 10,
    ):
        """Initialize hypothesis generator.

        Args:
            llm: Language model for generation
            available_features: List of available features in the dataset
            max_hypotheses: Maximum number of hypotheses to generate
        """
        self.llm = llm
        self.available_features = available_features
        self.max_hypotheses = max_hypotheses

    async def generate(
        self,
        opportunity: Opportunity,
        session_id: str,
        business_context: str | None = None,
    ) -> list[Hypothesis]:
        """Generate hypotheses for the given opportunity.

        Args:
            opportunity: The retention opportunity to analyze
            session_id: ID of the reasoning session
            business_context: Optional business context

        Returns:
            List of generated hypotheses
        """
        logger.info(f"Generating hypotheses for opportunity: {opportunity.opportunity_id}")

        # Create prompt
        prompt = generate_hypothesis_prompt(
            opportunity_context=opportunity.to_context_string(),
            available_features=self.available_features,
            business_context=business_context,
        )

        # Call LLM
        messages = [
            SystemMessage(content=HYPOTHESIS_GENERATION_SYSTEM_PROMPT),
            HumanMessage(content=prompt),
        ]

        try:
            logger.info("Calling LLM for hypothesis generation...")
            response = await self.llm.ainvoke(messages)
            response_text = response.content
            
            # DEBUG: Log raw response
            logger.info(f"LLM response length: {len(response_text)} chars")
            logger.debug(f"LLM raw response (first 500 chars): {response_text[:500]}")

            # Parse JSON response
            hypotheses_data = self._parse_response(response_text)
            
            # DEBUG: Log parsed data
            logger.info(f"Parsed {len(hypotheses_data.get('hypotheses', []))} hypotheses from response")

            # Helper function to map LLM strings to valid TestMethod enums
            def parse_test_method(method_str: str) -> TestMethod | None:
                """Map free-text test method to valid enum."""
                method_lower = method_str.lower().replace(" ", "_").replace("-", "_")
                
                # Direct mappings for common variations
                mappings = {
                    "propensity_score_matching": TestMethod.PROPENSITY_MATCHING,
                    "propensity_matching": TestMethod.PROPENSITY_MATCHING,
                    "psm": TestMethod.PROPENSITY_MATCHING,
                    "granger_causality": TestMethod.GRANGER_CAUSALITY,
                    "granger_causality_on_time_series_data": TestMethod.GRANGER_CAUSALITY,
                    "granger": TestMethod.GRANGER_CAUSALITY,
                    "regression_adjustment": TestMethod.REGRESSION_ADJUSTMENT,
                    "regression_discontinuity": TestMethod.REGRESSION_DISCONTINUITY,
                    "rdd": TestMethod.REGRESSION_DISCONTINUITY,
                    "instrumental_variables": TestMethod.INSTRUMENTAL_VARIABLES,
                    "iv": TestMethod.INSTRUMENTAL_VARIABLES,
                    "difference_in_differences": TestMethod.DIFFERENCE_IN_DIFFERENCES,
                    "diff_in_diff": TestMethod.DIFFERENCE_IN_DIFFERENCES,
                    "did": TestMethod.DIFFERENCE_IN_DIFFERENCES,
                    "synthetic_control": TestMethod.SYNTHETIC_CONTROL,
                    "dag_based": TestMethod.DAG_BASED,
                    "dag": TestMethod.DAG_BASED,
                }
                
                # Try direct lookup
                if method_lower in mappings:
                    return mappings[method_lower]
                
                # Try partial match - find best match
                for key, value in mappings.items():
                    if key in method_lower or method_lower in key:
                        return value
                
                # Fallback to propensity matching as default
                logger.debug(f"Unknown test method '{method_str}', skipping")
                return None

            # Convert to Hypothesis objects
            hypotheses = []
            for i, hyp_data in enumerate(hypotheses_data.get("hypotheses", [])[:self.max_hypotheses]):
                try:
                    # Parse test methods flexibly
                    test_methods = []
                    for method_str in hyp_data.get("test_methods", []):
                        parsed = parse_test_method(method_str)
                        if parsed:
                            test_methods.append(parsed)
                    
                    # Use default if none parsed
                    if not test_methods:
                        test_methods = [TestMethod.PROPENSITY_MATCHING]
                    
                    hypothesis = Hypothesis(
                        session_id=session_id,
                        cause=hyp_data["cause"],
                        effect=hyp_data.get("effect", opportunity.metric_name),
                        mechanism=hyp_data["mechanism"],
                        confounders=hyp_data.get("confounders", []),
                        mediators=hyp_data.get("mediators", []),
                        moderators=hyp_data.get("moderators", []),
                        test_methods=test_methods,
                        data_requirements=hyp_data.get("data_requirements", []),
                        likelihood=Likelihood(hyp_data.get("likelihood", "medium")),
                        rationale=hyp_data.get("rationale", ""),
                    )
                    hypotheses.append(hypothesis)
                    logger.info(f"Generated hypothesis {i+1}: {hypothesis.cause} → {hypothesis.effect}")

                except Exception as e:
                    logger.warning(f"Failed to parse hypothesis {i+1}: {e}")
                    continue

            logger.info(f"Generated {len(hypotheses)} valid hypotheses")
            return hypotheses

        except Exception as e:
            logger.error(f"Failed to generate hypotheses: {e}")
            return []

    def _parse_response(self, response_text: str) -> dict[str, Any]:
        """Parse JSON response from LLM.

        Args:
            response_text: Raw response text

        Returns:
            Parsed JSON object
        """
        # Try to extract JSON from markdown code blocks if present
        if "```json" in response_text:
            start = response_text.index("```json") + 7
            end = response_text.index("```", start)
            response_text = response_text[start:end].strip()
        elif "```" in response_text:
            start = response_text.index("```") + 3
            end = response_text.index("```", start)
            response_text = response_text[start:end].strip()

        try:
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}")
            logger.debug(f"Response text: {response_text[:500]}")
            return {"hypotheses": []}

    async def __call__(self, state: dict[str, Any]) -> dict[str, Any]:
        """LangGraph node function.

        This node is async to avoid calling asyncio.run inside an active loop.
        """
        opportunity = state["opportunity"]
        session_id = state["session_id"]
        business_context = state.get("business_context")

        hypotheses = await self.generate(opportunity, session_id, business_context)

        state["hypotheses"] = hypotheses
        state["hypotheses_count"] = len(hypotheses)

        return state
