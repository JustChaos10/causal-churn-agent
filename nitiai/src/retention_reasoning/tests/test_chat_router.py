import json
import pytest

from retention_reasoning.chat_router import process_chat_query


class StubResp:
    def __init__(self, content: str):
        self.content = content


class StubLLM:
    async def ainvoke(self, messages):
        # Return fenced JSON to test parser path.
        payload = {
            "components": [
                {
                    "type": "text",
                    "props": {"content": "## Channel Performance"},
                },
                {
                    "type": "stat",
                    "props": {
                        "title": "Overall churn",
                        "value": "55%",
                        "changeType": "negative",
                    },
                },
                {
                    "type": "chart",
                    "props": {
                        "chartType": "bar",
                        "title": "Churn by Channel",
                        "data": [{"channel": "Referral", "churn_rate": 0.6}],
                        "xKey": "channel",
                        "yKey": "churn_rate",
                    },
                },
            ]
        }
        return StubResp("```json\n" + json.dumps(payload) + "\n```")


@pytest.mark.asyncio
async def test_chat_router_returns_valid_component_schema(monkeypatch):
    from retention_reasoning import chat_router

    monkeypatch.setattr(chat_router, "get_llm", lambda: StubLLM())

    result = await process_chat_query("show churn by acquisition channel")
    assert "components" in result and isinstance(result["components"], list)

    allowed_types = {"stat", "chart", "table", "text", "reasoning", "error", "suggestions"}
    for comp in result["components"]:
        assert comp["type"] in allowed_types
        assert isinstance(comp.get("props", {}), dict)
