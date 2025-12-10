"""Debug script to test the LangGraph agent pipeline."""

import asyncio
import pandas as pd
from pathlib import Path
import os
import sys

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from retention_reasoning.api import get_agent, create_sample_data
from retention_reasoning.models import Opportunity, OpportunityType


async def debug_agent():
    """Run the agent with verbose logging."""
    print("=" * 60)
    print("DEBUGGING LANGGRAPH AGENT PIPELINE")
    print("=" * 60)
    
    # Create opportunity
    opportunity = Opportunity(
        opportunity_id="debug_test_001",
        type=OpportunityType.CHURN_SPIKE,
        title="Debug: Why are customers churning?",
        description="Testing the causal reasoning pipeline",
        affected_cohort={"segment": "all_customers"},
        metric_name="churn_rate",
        baseline_value=0.15,
        current_value=0.25,
        sample_size=1000,
        severity="medium",
    )
    
    # Create sample data
    data = create_sample_data()
    print(f"\n[DATA] Sample data shape: {data.shape}")
    print(f"[DATA] Columns: {list(data.columns)}")
    
    # Get agent
    agent = get_agent()
    print(f"\n[AGENT] Created with {len(agent.available_features)} features:")
    for f in agent.available_features:
        print(f"  - {f}")
    
    # Run analysis
    print("\n[RUNNING] Starting analysis...")
    session = await agent.analyze_opportunity(
        opportunity=opportunity,
        data=data,
        business_context="Why are customers churning?",
    )
    
    print("\n[RESULTS]")
    print(f"  Session ID: {session.session_id}")
    print(f"  Status: {session.status}")
    print(f"  Hypotheses count: {session.hypotheses_count}")
    print(f"  Hypotheses: {session.hypotheses}")
    print(f"  Validated causes: {session.validated_causes}")
    print(f"  Confidence: {session.confidence_score}")
    
    if hasattr(session, 'agent_state') and session.agent_state:
        print(f"  Agent state: {session.agent_state}")
    
    return session


if __name__ == "__main__":
    session = asyncio.run(debug_agent())
