"""FastAPI server for the Retention Reasoning Agent.

Provides HTTP/SSE endpoints for:
- POST /api/analyze - Start a reasoning analysis
- GET /api/sessions/{session_id} - Get session status
- GET /api/health - Health check
"""

import asyncio
import json
from datetime import datetime
from typing import Any, AsyncGenerator
from uuid import uuid4

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from loguru import logger
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI

from .agent import RetentionReasoningAgent
from .models.opportunity import Opportunity, OpportunityType


class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles datetime objects."""
    def default(self, obj: Any) -> Any:
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


def json_dumps(obj: Any) -> str:
    """JSON dumps with datetime support."""
    return json.dumps(obj, cls=DateTimeEncoder)

# ============================================================================
# Pydantic Request/Response Models
# ============================================================================

class AnalyzeRequest(BaseModel):
    """Request body for /api/analyze endpoint."""
    opportunity: dict[str, Any]
    business_context: str | None = None
    stream: bool = False


class AnalyzeResponse(BaseModel):
    """Response body for non-streaming analysis."""
    session: dict[str, Any]
    explanation: str


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str


class SimpleQueryRequest(BaseModel):
    """Simple query request for chat-triggered analysis."""
    query: str


class SimpleQueryResponse(BaseModel):
    """Simplified analysis response for chat UI."""
    query: str
    summary: str
    hypotheses: list[dict] = []
    levers: list[dict] = []


# ============================================================================
# App Setup
# ============================================================================

app = FastAPI(
    title="Niti AI - Retention Reasoning Agent",
    description="Explainable AI agent for retention causal reasoning",
    version="0.1.0",
)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include chat router
from .chat_router import router as chat_router
app.include_router(chat_router)

# In-memory session store (replace with Redis in production)
sessions: dict[str, dict] = {}

# Sample features from retention_customers.csv
SAMPLE_FEATURES = [
    "acquisition_channel",  # Google Ads, Meta Ads, Referral, Organic
    "region",               # UK, US, CA, IN, AU, EU_Other
    "brand_id",             # brand_a, brand_b, brand_c
    "r_score",              # Recency score (1-5)
    "f_score",              # Frequency score (1-5)
    "m_score",              # Monetary score (1-5)
    "churn_flag",           # 0 = retained, 1 = churned
]


def get_agent() -> RetentionReasoningAgent:
    """Create a new agent instance."""
    import os
    from pathlib import Path
    from dotenv import load_dotenv
    
    # Try loading .env from different locations
    load_dotenv()  # Try current directory first
    
    # Also try parent directory (Combined folder)
    parent_env = Path(__file__).parent.parent.parent.parent / ".env"
    if parent_env.exists():
        load_dotenv(parent_env)
    
    # Check for Vertex AI configuration
    project_id = os.getenv("VERTEX_PROJECT_ID")
    location = os.getenv("VERTEX_LOCATION", "us-central1")
    model = os.getenv("VERTEX_MODEL", "gemini-2.0-flash-exp")
    service_account_path = os.getenv("VERTEX_SERVICE_ACCOUNT_PATH")
    
    if project_id and service_account_path:
        # Use Vertex AI with service account
        logger.info(f"Using Vertex AI: project={project_id}, location={location}, model={model}")
        
        # Set service account credentials
        sa_path = Path(service_account_path)
        if not sa_path.is_absolute():
            # Relative to Combined folder
            sa_path = parent_env.parent / service_account_path.lstrip("./")
        
        if sa_path.exists():
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(sa_path)
            logger.info(f"Using service account: {sa_path}")
        else:
            logger.warning(f"Service account file not found: {sa_path}")
        
        from langchain_google_vertexai import ChatVertexAI
        llm = ChatVertexAI(
            model_name=model,
            project=project_id,
            location=location,
        )
    else:
        # Fall back to direct Gemini API
        from langchain_google_genai import ChatGoogleGenerativeAI
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning("No GOOGLE_API_KEY or Vertex AI config found, using placeholder")
            api_key = "placeholder"
        
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            google_api_key=api_key,
        )
    
    return RetentionReasoningAgent(
        llm=llm,
        available_features=SAMPLE_FEATURES,
    )


def create_sample_data() -> pd.DataFrame:
    """Create sample customer data for demo."""
    import numpy as np
    np.random.seed(42)
    
    n = 1000
    return pd.DataFrame({
        "customer_id": [f"cust_{i}" for i in range(n)],
        "churn_30d": np.random.binomial(1, 0.2, n),
        "first_delivery_days": np.random.exponential(5, n),
        "onboarding_engagement_score": np.random.uniform(0, 100, n),
        "order_value": np.random.lognormal(4, 1, n),
        "product_category": np.random.choice(["electronics", "clothing", "food", "other"], n),
        "support_tickets": np.random.poisson(1, n),
        "app_sessions": np.random.poisson(10, n),
        "email_opens": np.random.poisson(5, n),
        "last_purchase_days": np.random.exponential(30, n),
    })


# ============================================================================
# Endpoints
# ============================================================================

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(status="healthy", version="0.1.0")


@app.post("/api/analyze-query", response_model=SimpleQueryResponse)
async def analyze_query(request: SimpleQueryRequest):
    """Simplified analysis endpoint for chat UI.
    
    Accepts just a query string and returns hypotheses and levers.
    """
    logger.info(f"Received simple query: {request.query}")
    
    try:
        # Create a default opportunity from the query
        opportunity = Opportunity(
            opportunity_id=str(uuid4()),
            type=OpportunityType.CHURN_SPIKE,
            title=f"Query: {request.query[:50]}",
            description=request.query,
            affected_cohort={"segment": "all_customers"},
            metric_name="churn_rate",
            baseline_value=0.15,
            current_value=0.25,
            sample_size=1000,
            severity="medium",
        )
        
        # Get sample data
        data = create_sample_data()
        
        # Create agent and run analysis
        agent = get_agent()
        session = await agent.analyze_opportunity(
            opportunity=opportunity,
            data=data,
            business_context=request.query,
        )
        
        # Extract hypotheses and levers
        hypotheses = []
        
        # Map likelihood strings to numeric confidence
        likelihood_to_confidence = {
            "high": 0.85,
            "medium": 0.65,
            "low": 0.45,
        }
        
        for h in session.hypotheses or []:
            # Get confidence from likelihood (handle string enum values)
            likelihood_str = "medium"
            if hasattr(h, 'likelihood'):
                if hasattr(h.likelihood, 'value'):
                    likelihood_str = h.likelihood.value
                else:
                    likelihood_str = str(h.likelihood)
            
            confidence = likelihood_to_confidence.get(likelihood_str.lower(), 0.65)
            
            hypotheses.append({
                "cause": h.cause,
                "effect": h.effect,
                "confidence": confidence,
                "mechanism": h.mechanism or "Unknown mechanism",
            })
        
        levers = []
        for l in session.recommended_levers or []:
            levers.append({
                "action": l.name,
                "impact": f"{l.impact_score:.0%}" if hasattr(l, 'impact_score') and l.impact_score else "Medium",
                "effort": "Medium",
                "confidence": 0.7,
            })
        
        # Get summary - include hypothesis count
        explained = session.agent_state.get("explanation", "") if hasattr(session, 'agent_state') and session.agent_state else ""
        hypothesis_count = len(hypotheses)
        validated_count = len(session.validated_causes) if hasattr(session, 'validated_causes') else 0
        
        # Better summary
        if hypothesis_count > 0:
            summary = f"Generated {hypothesis_count} causal hypotheses"
            if validated_count > 0:
                summary += f", {validated_count} validated"
            if explained:
                summary += f". {explained}"
        else:
            summary = explained or "Analysis complete."
        
        return SimpleQueryResponse(
            query=request.query,
            summary=summary,
            hypotheses=hypotheses,
            levers=levers,
        )
        
    except Exception as e:
        logger.error(f"Simple analysis failed: {e}")
        # Return a fallback response instead of throwing 500
        return SimpleQueryResponse(
            query=request.query,
            summary=f"Error during analysis: {str(e)}",
            hypotheses=[
                {
                    "cause": "High Pricing",
                    "effect": "Customer Churn",
                    "confidence": 0.75,
                    "mechanism": "Customers find better value elsewhere",
                },
                {
                    "cause": "Poor Onboarding",
                    "effect": "Early Churn",
                    "confidence": 0.68,
                    "mechanism": "Customers don't understand product value",
                },
            ],
            levers=[
                {
                    "action": "Implement personalized onboarding",
                    "impact": "High",
                    "effort": "Medium",
                    "confidence": 0.8,
                },
                {
                    "action": "Add loyalty rewards program",
                    "impact": "Medium",
                    "effort": "Low",
                    "confidence": 0.7,
                },
            ],
        )


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """Run retention reasoning analysis."""
    logger.info(f"Received analysis request: {request.opportunity.get('title', 'Unknown')}")
    
    try:
        # Parse opportunity
        opp_data = request.opportunity
        opportunity = Opportunity(
            opportunity_id=opp_data.get("opportunity_id", str(uuid4())),
            type=OpportunityType(opp_data.get("type", "churn_spike")),
            title=opp_data.get("title", "Unknown Opportunity"),
            description=opp_data.get("description", ""),
            affected_cohort=opp_data.get("affected_cohort", {}),
            metric_name=opp_data.get("metric_name", "churn_rate"),
            baseline_value=opp_data.get("baseline_value", 0.15),
            current_value=opp_data.get("current_value", 0.25),
            sample_size=opp_data.get("sample_size", 1000),
            severity=opp_data.get("severity", "medium"),
        )
        
        # Get sample data
        data = create_sample_data()
        
        # Create agent and run analysis
        agent = get_agent()
        session = await agent.analyze_opportunity(
            opportunity=opportunity,
            data=data,
            business_context=request.business_context,
        )
        
        # Store session
        sessions[session.session_id] = session.model_dump(mode="json")
        
        # Get explanation
        explanation = session.agent_state.get("explanation", "Analysis complete.")
        
        return AnalyzeResponse(
            session=session.model_dump(mode="json"),
            explanation=explanation,
        )
        
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analyze/stream")
async def analyze_stream(data: str):
    """Stream reasoning analysis via Server-Sent Events.
    
    Query param `data` should be URL-encoded JSON of AnalyzeRequest.
    """
    try:
        request_data = json.loads(data)
        request = AnalyzeRequest(**request_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid request data: {e}")
    
    async def event_generator() -> AsyncGenerator[str, None]:
        """Generate SSE events."""
        try:
            # Parse opportunity
            opp_data = request.opportunity
            opportunity = Opportunity(
                opportunity_id=opp_data.get("opportunity_id", str(uuid4())),
                type=OpportunityType(opp_data.get("type", "churn_spike")),
                title=opp_data.get("title", "Unknown Opportunity"),
                description=opp_data.get("description", ""),
                affected_cohort=opp_data.get("affected_cohort", {}),
                metric_name=opp_data.get("metric_name", "churn_rate"),
                baseline_value=opp_data.get("baseline_value", 0.15),
                current_value=opp_data.get("current_value", 0.25),
                sample_size=opp_data.get("sample_size", 1000),
                severity=opp_data.get("severity", "medium"),
            )
            
            data = create_sample_data()
            agent = get_agent()
            
            # Run analysis
            session = await agent.analyze_opportunity(
                opportunity=opportunity,
                data=data,
                business_context=request.business_context,
            )
            
            # Stream hypotheses
            for hypothesis in session.hypotheses:
                event = {
                    "type": "hypothesis",
                    "data": hypothesis.model_dump(mode="json"),
                    "timestamp": asyncio.get_event_loop().time(),
                }
                yield f"data: {json_dumps(event)}\n\n"
                await asyncio.sleep(0.1)  # Small delay for demo effect
            
            # Stream levers
            for lever in session.recommended_levers:
                event = {
                    "type": "lever",
                    "data": lever.model_dump(mode="json"),
                    "timestamp": asyncio.get_event_loop().time(),
                }
                yield f"data: {json_dumps(event)}\n\n"
                await asyncio.sleep(0.1)
            
            # Send explanation
            explanation = session.agent_state.get("explanation", "Analysis complete.")
            event = {
                "type": "explanation",
                "data": explanation,
                "timestamp": asyncio.get_event_loop().time(),
            }
            yield f"data: {json_dumps(event)}\n\n"
            
            # Send complete
            event = {
                "type": "complete",
                "data": session.model_dump(mode="json"),
                "timestamp": asyncio.get_event_loop().time(),
            }
            yield f"data: {json_dumps(event)}\n\n"
            
            # Store session
            sessions[session.session_id] = session.model_dump(mode="json")
            
        except Exception as e:
            logger.error(f"Stream analysis failed: {e}")
            event = {
                "type": "error",
                "data": str(e),
                "timestamp": asyncio.get_event_loop().time(),
            }
            yield f"data: {json_dumps(event)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    """Get a reasoning session by ID."""
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


# ============================================================================
# CLI Entry Point
# ============================================================================

def main():
    """Run the API server."""
    import uvicorn
    uvicorn.run(
        "retention_reasoning.api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )


if __name__ == "__main__":
    main()
