"""Chat router for C1-style conversational UI.

Handles natural language queries and generates structured UI components
using Vertex AI for understanding and response generation.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, AsyncGenerator
from uuid import uuid4

import pandas as pd
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import SystemMessage, HumanMessage
from loguru import logger
from pydantic import BaseModel

# Data directory
DATA_DIR = Path(__file__).parent.parent.parent.parent.parent / "data"


# ============================================================================
# Request/Response Models
# ============================================================================

class ChatRequest(BaseModel):
    """Chat request from frontend."""
    message: str
    conversation_id: str | None = None
    context: dict[str, Any] | None = None


class UIComponent(BaseModel):
    """A UI component to render on the frontend."""
    type: str  # stat, chart, table, text, reasoning, error
    props: dict[str, Any]


class ChatResponse(BaseModel):
    """Chat response with UI components."""
    conversation_id: str
    message_id: str
    text: str | None = None
    components: list[UIComponent] = []
    timestamp: str


# ============================================================================
# Data Loading
# ============================================================================

_data_cache: dict[str, pd.DataFrame] = {}


def load_data() -> dict[str, pd.DataFrame]:
    """Load CSV data files into memory."""
    global _data_cache
    
    if _data_cache:
        return _data_cache
    
    data_files = {
        "customers": "retention_customers.csv",
        "brand_metrics": "retention_brand_metrics_daily.csv",
        "events": "retention_events.csv",
        "shopify": "shopify_retention_synthetic_dataset.csv",
    }
    
    for name, filename in data_files.items():
        filepath = DATA_DIR / filename
        if filepath.exists():
            try:
                _data_cache[name] = pd.read_csv(filepath)
                logger.info(f"Loaded {name}: {len(_data_cache[name])} rows")
            except Exception as e:
                logger.error(f"Failed to load {filename}: {e}")
    
    return _data_cache


def get_data_summary() -> str:
    """Get a summary of available data for the LLM."""
    data = load_data()
    summary_parts = []
    
    for name, df in data.items():
        cols = ", ".join(df.columns.tolist()[:15])  # First 15 columns
        if len(df.columns) > 15:
            cols += f"... (+{len(df.columns) - 15} more)"
        summary_parts.append(f"- {name}: {len(df)} rows, columns: [{cols}]")
    
    return "\n".join(summary_parts)


# ============================================================================
# LLM Integration
# ============================================================================

CHAT_SYSTEM_PROMPT = """You are Niti AI, a friendly and insightful retention analytics assistant. You help users understand customer data and provide actionable insights.

AVAILABLE DATA:
{data_summary}

RESPONSE STYLE:
- Be conversational and friendly, like a helpful data analyst colleague
- Lead with the most important insight first
- Use clear section headers with emojis (📊, 🔍, 💡, ⚡)
- Include trend indicators in stats (e.g., "+5.2%" or "-3.1%")
- End with actionable recommendations when relevant

RESPONSE FORMAT:
Respond with a JSON object containing UI components:

1. **stat**: Key metric with optional trend
   {{"type": "stat", "props": {{"title": "Churn Rate", "value": "54.5%", "change": "-3.2%", "changeType": "positive", "subtitle": "vs last month"}}}}

2. **chart**: Visualization
   {{"type": "chart", "props": {{"chartType": "bar|line|pie", "title": "📊 Churn by Channel", "data": [...], "xKey": "x", "yKey": "y"}}}}

3. **table**: Tabular data
   {{"type": "table", "props": {{"title": "Top Churning Segments", "columns": ["Segment", "Churn Rate"], "data": [...]}}}}

4. **text**: Insights and explanations (use markdown formatting)
   {{"type": "text", "props": {{"content": "## 🔍 Key Insight\\n\\nCustomers from **Referral** channel show the highest churn at 65.6%. This is likely because..."}}}}

5. **reasoning**: Causal analysis (for "why" questions)
   {{"type": "reasoning", "props": {{"trigger": true, "query": "the user's question"}}}}

EXAMPLE - Metric Query:
User: "What is the churn rate?"
{{"components": [
  {{"type": "text", "props": {{"content": "## 📊 Churn Overview\\n\\nHere's a quick snapshot of your customer retention metrics:"}}}},
  {{"type": "stat", "props": {{"title": "30-Day Churn Rate", "value": "54.5%", "change": "+2.1%", "changeType": "negative", "icon": "trending_down"}}}},
  {{"type": "stat", "props": {{"title": "Total Customers", "value": "600", "subtitle": "in current cohort"}}}},
  {{"type": "stat", "props": {{"title": "Churned", "value": "327", "changeType": "negative"}}}},
  {{"type": "stat", "props": {{"title": "Retained", "value": "273", "changeType": "positive"}}}},
  {{"type": "text", "props": {{"content": "💡 **Tip:** Your churn rate is above the industry average of 5-7%. Consider focusing on the first 7 days of customer onboarding."}}}}
]}}

EXAMPLE - Channel Analysis:
User: "Show me churn by acquisition channel"
{{"components": [
  {{"type": "text", "props": {{"content": "## 📊 Channel Performance\\n\\nI've analyzed churn rates across all acquisition channels:"}}}},
  {{"type": "stat", "props": {{"title": "Highest Churn", "value": "Referral", "subtitle": "65.6% churn rate", "changeType": "negative"}}}},
  {{"type": "stat", "props": {{"title": "Lowest Churn", "value": "Google Ads", "subtitle": "50.0% churn rate", "changeType": "positive"}}}},
  {{"type": "chart", "props": {{"chartType": "bar", "title": "Churn Rate by Channel", "data": [{{"channel": "Referral", "churn_rate": 65.6}}, {{"channel": "Meta Ads", "churn_rate": 55.4}}, {{"channel": "Google Ads", "churn_rate": 50.0}}], "xKey": "channel", "yKey": "churn_rate"}}}},
  {{"type": "text", "props": {{"content": "🔍 **Key Finding:** Referral customers churn 15% more than Google Ads customers. This could indicate:\\n- Referral expectations not being met\\n- Different customer quality between channels\\n\\n💡 **Recommendation:** Investigate the referral onboarding experience."}}}}
]}}

EXAMPLE - Causal Analysis:
User: "Why are customers churning?"
{{"components": [
  {{"type": "text", "props": {{"content": "## 🔍 Causal Analysis\\n\\nI'll run a deep analysis to identify the root causes of customer churn..."}}}},
  {{"type": "reasoning", "props": {{"trigger": true, "query": "Why are customers churning?"}}}}
]}}

IMPORTANT RULES:
- Always respond with valid JSON
- Use the ACTUAL DATA provided in the context - never make up numbers
- Start responses with a friendly text component introducing the analysis
- Include trend indicators (change, changeType) in stats where relevant
- For "why" questions, use the reasoning component
- Be concise but insightful
"""


def get_llm():
    """Get LLM instance for chat."""
    from dotenv import load_dotenv
    
    # Load environment
    parent_env = Path(__file__).parent.parent.parent.parent / ".env"
    combined_env = Path(__file__).parent.parent.parent.parent.parent / ".env"
    
    if parent_env.exists():
        load_dotenv(parent_env)
    if combined_env.exists():
        load_dotenv(combined_env)
    
    # Check for Vertex AI config
    vertex_project = os.getenv("VERTEX_PROJECT_ID")
    vertex_location = os.getenv("VERTEX_LOCATION", "us-central1")
    vertex_model = os.getenv("VERTEX_MODEL", "gemini-2.0-flash-exp")
    service_account_path = os.getenv("VERTEX_SERVICE_ACCOUNT_PATH")
    
    if vertex_project and service_account_path:
        # Use Vertex AI
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = service_account_path
        from langchain_google_vertexai import ChatVertexAI
        return ChatVertexAI(
            model=vertex_model,
            project=vertex_project,
            location=vertex_location,
            temperature=0.3,
        )
    else:
        # Fall back to Google AI
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=os.getenv("GOOGLE_MODEL", "gemini-2.0-flash-exp"),
            temperature=0.3,
        )


async def process_chat_query(message: str) -> dict[str, Any]:
    """Process a chat query and generate UI components."""
    
    # Load data
    data = load_data()
    data_summary = get_data_summary()
    
    # Import and use the comprehensive data query module
    from .data_query import compute_data_context
    
    # Compute actual data aggregations based on the query
    data_context = compute_data_context(message)
    
    # Prepare system prompt with data context
    system_prompt = CHAT_SYSTEM_PROMPT.format(data_summary=data_summary)
    
    # If we have computed data, add it to the user message
    if data_context:
        user_message = f"{message}\n\n{data_context}"
        logger.info(f"Injected data context ({len(data_context)} chars)")
    else:
        user_message = message
    
    # Get LLM
    llm = get_llm()
    
    # Call LLM
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_message),
    ]
    
    try:
        response = await llm.ainvoke(messages)
        response_text = response.content
        
        # Parse JSON response
        # Try to extract JSON from markdown code blocks
        if "```json" in response_text:
            start = response_text.index("```json") + 7
            end = response_text.index("```", start)
            response_text = response_text[start:end].strip()
        elif "```" in response_text:
            start = response_text.index("```") + 3
            end = response_text.index("```", start)
            response_text = response_text[start:end].strip()
        
        result = json.loads(response_text)
        
        # Post-process for C1 parity
        result = enhance_c1_response(result, message)
        
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
        logger.debug(f"Response text: {response_text[:500]}")
        return {
            "components": [
                {"type": "text", "props": {"content": response_text}},
            ]
        }
    except Exception as e:
        logger.error(f"Chat processing failed: {e}")
        return {
            "components": [
                {"type": "error", "props": {"message": str(e)}},
            ]
        }


def enhance_c1_response(result: dict, query: str) -> dict:
    """Post-process LLM response for C1 parity.
    
    Adds:
    - Section headers if missing
    - Trend indicators to stat cards
    - Related suggestions at the end
    """
    components = result.get("components", [])
    if not components:
        return result
    
    enhanced = []
    has_header = False
    has_stats = False
    stat_count = 0
    
    # Check what types of components we have
    for comp in components:
        if comp.get("type") == "text":
            content = comp.get("props", {}).get("content", "")
            if content.startswith("##") or "📊" in content or "🔍" in content:
                has_header = True
        if comp.get("type") == "stat":
            has_stats = True
            stat_count += 1
    
    # Add section header if missing
    if has_stats and not has_header:
        query_lower = query.lower()
        if any(word in query_lower for word in ["churn", "retention", "churning"]):
            header_text = "## 📊 Churn Analysis\n\nHere's what I found in your customer data:"
        elif any(word in query_lower for word in ["channel", "acquisition", "source"]):
            header_text = "## 📊 Channel Performance\n\nBreaking down your acquisition channels:"
        elif any(word in query_lower for word in ["region", "country", "location"]):
            header_text = "## 🌍 Regional Analysis\n\nGeographic breakdown of your customers:"
        elif any(word in query_lower for word in ["customer", "how many", "count", "total"]):
            header_text = "## 📊 Customer Overview\n\nSnapshot of your customer base:"
        else:
            header_text = "## 📊 Analysis Results\n\nHere's what I found:"
        
        enhanced.append({
            "type": "text",
            "props": {"content": header_text}
        })
    
    # Process and enhance each component
    for comp in components:
        comp_type = comp.get("type")
        props = comp.get("props", {})
        
        # Enhance stat cards with changeType if missing
        if comp_type == "stat":
            value_str = str(props.get("value", ""))
            title = str(props.get("title", "")).lower()
            
            # Add changeType based on title and context
            if "changeType" not in props:
                if any(word in title for word in ["churn", "churned", "lost", "decline"]):
                    props["changeType"] = "negative"
                elif any(word in title for word in ["retained", "active", "growth", "increase"]):
                    props["changeType"] = "positive"
                elif "rate" in title and "%" in value_str:
                    # High churn rates are negative
                    try:
                        rate = float(value_str.replace("%", "").replace(",", ""))
                        if rate > 30:  # Above 30% churn is bad
                            props["changeType"] = "negative"
                    except:
                        pass
        
        enhanced.append({"type": comp_type, "props": props})
    
    # Add related suggestions at the end (C1 feature)
    query_lower = query.lower()
    suggestions = []
    
    if any(word in query_lower for word in ["churn", "churning"]):
        suggestions = [
            "What channels have the highest churn?",
            "Show me churn by region",
            "Why are customers churning?"
        ]
    elif any(word in query_lower for word in ["channel"]):
        suggestions = [
            "What is the overall churn rate?",
            "Which channel has the best retention?",
            "Why do Referral customers churn more?"
        ]
    elif any(word in query_lower for word in ["customer", "how many"]):
        suggestions = [
            "What is our churn rate?",
            "Show me customers by channel",
            "Why are customers leaving?"
        ]
    
    if suggestions:
        enhanced.append({
            "type": "suggestions",
            "props": {
                "title": "Related questions you might ask:",
                "items": suggestions
            }
        })
    
    # Add insight tip if we have stats but no tip
    has_tip = any(
        "💡" in comp.get("props", {}).get("content", "") 
        for comp in enhanced if comp.get("type") == "text"
    )
    
    if has_stats and not has_tip and stat_count >= 2:
        # Add contextual insight
        insight = get_contextual_insight(query_lower, enhanced)
        if insight:
            enhanced.append({
                "type": "text",
                "props": {"content": f"💡 **Insight:** {insight}"}
            })
    
    return {"components": enhanced}


def get_contextual_insight(query: str, components: list) -> str:
    """Generate a contextual insight based on the query and data."""
    if "churn" in query:
        return "Your churn rate appears high. Focus on the first 7 days of customer onboarding - this is when most customers decide to stay or leave."
    elif "channel" in query:
        return "Different channels attract different customer types. Consider creating channel-specific onboarding experiences."
    elif "region" in query:
        return "Regional variations in churn may reflect local market conditions or operational differences."
    elif "customer" in query:
        return "Understanding your customer segments helps prioritize retention efforts where they'll have the most impact."
    return ""


# ============================================================================
# Router
# ============================================================================

router = APIRouter(prefix="/api/chat", tags=["chat"])

# In-memory conversation store
conversations: dict[str, list[dict]] = {}


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Process a chat message and return UI components."""
    
    logger.info(f"Chat request: {request.message[:100]}...")
    
    # Generate IDs
    conversation_id = request.conversation_id or str(uuid4())
    message_id = str(uuid4())
    
    # Process query
    result = await process_chat_query(request.message)
    
    # Build response
    components = [
        UIComponent(type=c["type"], props=c.get("props", {}))
        for c in result.get("components", [])
    ]
    
    response = ChatResponse(
        conversation_id=conversation_id,
        message_id=message_id,
        text=result.get("text"),
        components=components,
        timestamp=datetime.utcnow().isoformat(),
    )
    
    # Store in conversation history
    if conversation_id not in conversations:
        conversations[conversation_id] = []
    
    conversations[conversation_id].append({
        "role": "user",
        "content": request.message,
        "timestamp": datetime.utcnow().isoformat(),
    })
    conversations[conversation_id].append({
        "role": "assistant",
        "content": result,
        "timestamp": response.timestamp,
    })
    
    return response


@router.get("/history/{conversation_id}")
async def get_history(conversation_id: str):
    """Get conversation history."""
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {"conversation_id": conversation_id, "messages": conversations[conversation_id]}


@router.get("/conversations")
async def list_conversations():
    """List all conversations."""
    return {
        "conversations": [
            {
                "id": cid,
                "message_count": len(msgs),
                "last_message": msgs[-1]["content"] if msgs else None,
            }
            for cid, msgs in conversations.items()
        ]
    }


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """Stream chat response as Server-Sent Events compatible with Vercel AI SDK."""
    
    logger.info(f"Streaming chat request: {request.message[:100]}...")
    
    async def generate_sse() -> AsyncGenerator[str, None]:
        """Generate SSE events for streaming."""
        try:
            # Load data and get summary
            data = load_data()
            data_summary = get_data_summary()
            
            # Import and use the comprehensive data query module
            from .data_query import compute_data_context
            
            # Compute actual data aggregations based on the query
            data_context = compute_data_context(request.message)
            
            # Prepare system prompt
            system_prompt = CHAT_SYSTEM_PROMPT.format(data_summary=data_summary)
            
            # Get LLM
            llm = get_llm()
            
            # If we have computed data, add it to the user message
            if data_context:
                user_message = f"{request.message}\n\n{data_context}"
                logger.info(f"Streaming: Injected data context ({len(data_context)} chars)")
            else:
                user_message = request.message
            
            # Start streaming - send initial event
            yield f"data: {json.dumps({'type': 'start', 'message': 'Analyzing...'})}\n\n"
            
            # Call LLM
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_message),
            ]
            
            # Stream response tokens
            full_response = ""
            async for chunk in llm.astream(messages):
                if hasattr(chunk, 'content') and chunk.content:
                    full_response += chunk.content
                    # Send text chunk
                    yield f"data: {json.dumps({'type': 'text-delta', 'text': chunk.content})}\n\n"
            
            # Parse complete response for components
            try:
                response_text = full_response
                if "```json" in response_text:
                    start = response_text.index("```json") + 7
                    end = response_text.index("```", start)
                    response_text = response_text[start:end].strip()
                elif "```" in response_text:
                    start = response_text.index("```") + 3
                    end = response_text.index("```", start)
                    response_text = response_text[start:end].strip()
                
                result = json.loads(response_text)
                components = result.get("components", [])
                
                # Stream each component
                for i, comp in enumerate(components):
                    yield f"data: {json.dumps({'type': 'component', 'index': i, 'component': comp})}\n\n"
                
            except json.JSONDecodeError:
                # If can't parse JSON, send as text component
                yield f"data: {json.dumps({'type': 'component', 'index': 0, 'component': {'type': 'text', 'props': {'content': full_response}}})}\n\n"
            
            # Send done event
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_sse(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
