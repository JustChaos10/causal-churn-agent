"""Explanation generation node using LLM for rich explanations."""

import json
from typing import Any

from langchain_core.messages import SystemMessage, HumanMessage
from loguru import logger


EXPLANATION_SYSTEM_PROMPT = """You are an expert at explaining causal analysis results in clear, actionable business language.

Given causal analysis results, generate a structured explanation that:
1. Summarizes the key findings in plain English
2. Explains the causal chain (what causes what)
3. Provides actionable insights
4. Suggests next steps

Respond with JSON in this exact format:
{
    "summary": "A 2-3 sentence executive summary of the findings",
    "causal_chain": ["Cause 1 leads to Effect 1", "Effect 1 leads to Churn"],
    "key_insight": "The single most important insight from this analysis",
    "root_causes": ["Root cause 1", "Root cause 2"],
    "recommended_actions": [
        {"action": "Action description", "priority": "high|medium|low", "expected_impact": "Impact description"}
    ],
    "confidence_note": "A note about the confidence level of these findings"
}
"""


class ExplanationGeneratorNode:
    """Generates human-readable explanations of causal findings using LLM."""

    def __init__(self, llm: Any = None):
        """Initialize explanation generator.

        Args:
            llm: Language model for generation
        """
        self.llm = llm

    def _build_context(self, state: dict[str, Any]) -> str:
        """Build context string from analysis state.
        
        Args:
            state: Current graph state
            
        Returns:
            Context string for LLM
        """
        validated_causes = state.get("validated_causes", [])
        actionable_levers = state.get("actionable_levers", [])
        validated_hypotheses = state.get("validated_hypotheses", [])
        recommended_levers = state.get("recommended_levers", [])
        
        context_parts = []
        
        # Add validated causes
        if validated_causes:
            context_parts.append(f"Validated Causal Factors: {', '.join(validated_causes)}")
        
        # Add hypothesis details
        if validated_hypotheses:
            context_parts.append("\nValidated Hypotheses:")
            for i, h in enumerate(validated_hypotheses[:5], 1):  # Limit to 5
                cause = getattr(h, 'cause', 'Unknown')
                effect = getattr(h, 'effect', 'Unknown')
                mechanism = getattr(h, 'mechanism', 'Unknown mechanism')
                context_parts.append(f"  {i}. {cause} → {effect}")
                context_parts.append(f"     Mechanism: {mechanism}")
        
        # Add lever recommendations
        if recommended_levers:
            context_parts.append("\nRecommended Levers:")
            for lever in recommended_levers[:5]:  # Limit to 5
                if hasattr(lever, 'name'):
                    name = lever.name
                    impact = getattr(lever, 'impact_score', 0)
                    effort = getattr(lever, 'effort', 'Medium')
                    context_parts.append(f"  - {name} (impact: {impact:.0%}, effort: {effort})")
                else:
                    context_parts.append(f"  - {lever}")
        elif actionable_levers:
            context_parts.append(f"\nActionable Levers: {', '.join(actionable_levers)}")
        
        return "\n".join(context_parts)

    async def generate_explanation(self, state: dict[str, Any]) -> dict[str, Any]:
        """Generate rich explanation using LLM.
        
        Args:
            state: Current graph state
            
        Returns:
            Explanation dict with summary, causal_chain, etc.
        """
        context = self._build_context(state)
        
        if not context.strip():
            return {
                "summary": "Analysis complete but no significant causal factors were identified.",
                "causal_chain": [],
                "key_insight": "Consider expanding the analysis scope or gathering more data.",
                "root_causes": [],
                "recommended_actions": [],
                "confidence_note": "Low confidence due to insufficient data."
            }
        
        # If no LLM, generate a simple explanation
        if not self.llm:
            return self._generate_simple_explanation(state)
        
        # Build prompt
        prompt = f"""Analyze these causal analysis results and generate a structured explanation:

{context}

Generate a clear, actionable explanation in JSON format."""
        
        try:
            messages = [
                SystemMessage(content=EXPLANATION_SYSTEM_PROMPT),
                HumanMessage(content=prompt),
            ]
            
            response = await self.llm.ainvoke(messages)
            response_text = response.content
            
            # Parse JSON from response
            if "```json" in response_text:
                start = response_text.index("```json") + 7
                end = response_text.index("```", start)
                response_text = response_text[start:end].strip()
            elif "```" in response_text:
                start = response_text.index("```") + 3
                end = response_text.index("```", start)
                response_text = response_text[start:end].strip()
            
            explanation = json.loads(response_text)
            logger.info("Generated LLM explanation successfully")
            return explanation
            
        except Exception as e:
            logger.warning(f"LLM explanation failed: {e}, falling back to simple")
            return self._generate_simple_explanation(state)

    def _generate_simple_explanation(self, state: dict[str, Any]) -> dict[str, Any]:
        """Generate a simple explanation without LLM.
        
        Args:
            state: Current graph state
            
        Returns:
            Simple explanation dict
        """
        validated_causes = state.get("validated_causes", [])
        actionable_levers = state.get("actionable_levers", [])
        recommended_levers = state.get("recommended_levers", [])
        
        # Build summary
        if validated_causes:
            causes_str = ", ".join(validated_causes[:3])
            summary = f"Analysis identified {len(validated_causes)} causal factors affecting retention: {causes_str}."
        else:
            summary = "Analysis complete. Review the recommended levers for improvement opportunities."
        
        # Build causal chain
        causal_chain = []
        for cause in validated_causes[:3]:
            causal_chain.append(f"{cause} impacts customer behavior")
        if causal_chain:
            causal_chain.append("Changed behavior leads to increased churn")
        
        # Build recommended actions
        recommended_actions = []
        levers_to_use = recommended_levers if recommended_levers else actionable_levers
        for lever in levers_to_use[:3]:
            if hasattr(lever, 'name'):
                action_name = lever.name
                impact = getattr(lever, 'impact_score', 0.5)
                priority = "high" if impact > 0.7 else "medium" if impact > 0.4 else "low"
            else:
                action_name = str(lever)
                priority = "medium"
            
            recommended_actions.append({
                "action": f"Implement {action_name}",
                "priority": priority,
                "expected_impact": "Reduce churn by addressing root cause"
            })
        
        # Key insight
        if validated_causes:
            key_insight = f"Focus on {validated_causes[0]} as it has the strongest causal relationship with churn."
        else:
            key_insight = "Consider running additional analysis with more data to identify causal factors."
        
        return {
            "summary": summary,
            "causal_chain": causal_chain,
            "key_insight": key_insight,
            "root_causes": validated_causes[:3],
            "recommended_actions": recommended_actions,
            "confidence_note": "Based on statistical analysis of available data."
        }

    def __call__(self, state: dict[str, Any]) -> dict[str, Any]:
        """LangGraph node function.

        Args:
            state: Graph state

        Returns:
            Updated state
        """
        import asyncio
        
        logger.info("Generating explanation...")
        
        # Generate explanation (async)
        try:
            explanation = asyncio.run(self.generate_explanation(state))
        except RuntimeError:
            # Already in async context
            explanation = self._generate_simple_explanation(state)
        
        # Store both structured and text explanation
        state["explanation_data"] = explanation
        
        # Create text summary for backward compatibility
        summary = explanation.get("summary", "")
        key_insight = explanation.get("key_insight", "")
        
        text_explanation = f"{summary}\n\nKey Insight: {key_insight}"
        
        if explanation.get("recommended_actions"):
            text_explanation += "\n\nRecommended Actions:"
            for action in explanation["recommended_actions"]:
                text_explanation += f"\n- {action['action']} ({action['priority']} priority)"
        
        state["explanation"] = text_explanation
        
        logger.info("Explanation generated successfully")
        logger.debug(f"Explanation: {text_explanation[:200]}...")
        
        return state
