"""Lever impact estimation node with real impact scoring."""

import math
from typing import Any
from dataclasses import dataclass

from loguru import logger


@dataclass
class SimpleLever:
    """Simplified lever for impact estimation results."""
    name: str
    impact_score: float
    effort: str
    confidence: float
    roi_score: float
    description: str = ""
    
    def __repr__(self) -> str:
        return f"Lever({self.name}, impact={self.impact_score:.2f}, effort={self.effort})"


class LeverEstimatorNode:
    """Estimates impact of intervention levers based on causal test results."""

    # Effort estimates by lever type keywords
    EFFORT_MAPPING = {
        "onboarding": "Medium",
        "engagement": "Medium",
        "referral": "Medium",
        "pricing": "High",
        "discount": "High",
        "support": "Low",
        "communication": "Low",
        "email": "Low",
        "notification": "Low",
        "training": "Medium",
        "loyalty": "Medium",
        "reward": "Medium",
        "improve": "Medium",
        "enhance": "Medium",
        "targeted": "Medium",
        "personalize": "High",
    }

    def __init__(self):
        """Initialize lever estimator."""
        pass

    def _estimate_effort(self, lever_name: str) -> str:
        """Estimate implementation effort based on lever name.
        
        Args:
            lever_name: Name of the lever
            
        Returns:
            Effort level: 'Low', 'Medium', or 'High'
        """
        lever_lower = lever_name.lower()
        
        for keyword, effort in self.EFFORT_MAPPING.items():
            if keyword in lever_lower:
                return effort
        
        return "Medium"  # Default

    def _calculate_impact_score(
        self,
        effect_size: float,
        p_value: float,
        sample_size: int,
    ) -> float:
        """Calculate impact score based on statistical evidence.
        
        Formula: impact = effect_size * confidence * sample_weight
        Where:
        - confidence = 1 - p_value (higher when p-value is lower)
        - sample_weight = log10(sample_size) / 4 (normalized)
        
        Args:
            effect_size: Magnitude of causal effect (0-1 scale typically)
            p_value: Statistical significance (0-1, lower is better)
            sample_size: Number of observations
            
        Returns:
            Impact score between 0 and 1
        """
        # Confidence from p-value (0 to 1)
        confidence = max(0, 1 - p_value)
        
        # Sample weight (logarithmic scale, normalized)
        sample_weight = min(1.0, math.log10(max(10, sample_size)) / 4)
        
        # Combined impact score
        impact = abs(effect_size) * confidence * sample_weight
        
        # Normalize to 0-1 range
        return min(1.0, max(0.0, impact))

    def _calculate_roi_score(self, impact_score: float, effort: str) -> float:
        """Calculate ROI score (impact / effort).
        
        Args:
            impact_score: Impact score (0-1)
            effort: Effort level string
            
        Returns:
            ROI score for prioritization
        """
        effort_weights = {"Low": 1.0, "Medium": 2.0, "High": 3.0}
        effort_value = effort_weights.get(effort, 2.0)
        
        return impact_score / effort_value

    def _generate_description(self, lever_name: str, impact_score: float) -> str:
        """Generate a description for the lever.
        
        Args:
            lever_name: Name of the lever
            impact_score: Calculated impact score
            
        Returns:
            Description string
        """
        impact_label = "high" if impact_score > 0.7 else "moderate" if impact_score > 0.4 else "low"
        return f"Implement {lever_name.lower()} to achieve {impact_label} impact on retention."

    def estimate_levers(
        self,
        actionable_levers: list[str],
        validated_hypotheses: list[Any],
        sample_size: int = 1000,
    ) -> list[SimpleLever]:
        """Estimate impact for all levers.
        
        Args:
            actionable_levers: List of lever names from confounder analysis
            validated_hypotheses: List of validated hypotheses with test results
            sample_size: Sample size from data
            
        Returns:
            List of SimpleLever objects with impact scores
        """
        levers = []

        # Global fallback averages
        global_effects: list[float] = []
        global_pvalues: list[float] = []
        for hypothesis in validated_hypotheses:
            for result in getattr(hypothesis, "test_results", []) or []:
                if getattr(result, "effect_size", None) is not None:
                    global_effects.append(abs(float(result.effect_size)))
                if getattr(result, "p_value", None) is not None:
                    global_pvalues.append(float(result.p_value))
        global_avg_effect = sum(global_effects) / len(global_effects) if global_effects else 0.25
        global_avg_p = sum(global_pvalues) / len(global_pvalues) if global_pvalues else 0.05

        for lever_name in actionable_levers:
            # Collect evidence tied to this lever
            lever_effects: list[float] = []
            lever_pvalues: list[float] = []
            for hypothesis in validated_hypotheses:
                actionable = getattr(getattr(hypothesis, "causal_structure", None), "actionable_lever", None)
                if actionable == lever_name or getattr(hypothesis, "cause", None) == lever_name:
                    for result in getattr(hypothesis, "test_results", []) or []:
                        if getattr(result, "effect_size", None) is not None:
                            lever_effects.append(abs(float(result.effect_size)))
                        if getattr(result, "p_value", None) is not None:
                            lever_pvalues.append(float(result.p_value))

            avg_effect = sum(lever_effects) / len(lever_effects) if lever_effects else global_avg_effect
            avg_pvalue = sum(lever_pvalues) / len(lever_pvalues) if lever_pvalues else global_avg_p

            impact_score = self._calculate_impact_score(
                effect_size=min(1.0, avg_effect),
                p_value=avg_pvalue,
                sample_size=sample_size,
            )
            
            effort = self._estimate_effort(lever_name)
            roi_score = self._calculate_roi_score(impact_score, effort)
            confidence = 1 - avg_pvalue
            description = self._generate_description(lever_name, impact_score)
            
            lever = SimpleLever(
                name=lever_name,
                impact_score=impact_score,
                effort=effort,
                confidence=confidence,
                roi_score=roi_score,
                description=description,
            )
            levers.append(lever)
            
            logger.info(
                f"Lever '{lever_name}': impact={impact_score:.2f}, "
                f"effort={effort}, ROI={roi_score:.2f}"
            )
        
        # Sort by ROI (highest first)
        levers.sort(key=lambda l: l.roi_score, reverse=True)
        
        return levers

    def __call__(self, state: dict[str, Any]) -> dict[str, Any]:
        """LangGraph node function.

        Args:
            state: Graph state

        Returns:
            Updated state
        """
        logger.info("Running lever impact estimation...")
        
        actionable_levers = state.get("actionable_levers", [])
        validated_hypotheses = state.get("validated_hypotheses", [])
        data = state.get("data")
        
        sample_size = len(data) if data is not None else 1000
        
        if not actionable_levers:
            logger.warning("No actionable levers to estimate")
            state["recommended_levers"] = []
            return state
        
        # Estimate impact for all levers
        levers = self.estimate_levers(
            actionable_levers=actionable_levers,
            validated_hypotheses=validated_hypotheses,
            sample_size=sample_size,
        )
        
        state["recommended_levers"] = levers
        state["lever_count"] = len(levers)
        
        logger.info(f"Estimated impact for {len(levers)} levers")
        
        return state
