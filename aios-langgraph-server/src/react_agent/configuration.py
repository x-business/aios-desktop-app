"""Define the configurable parameters for the agent."""

from __future__ import annotations

from dataclasses import dataclass, field, fields
from typing import Annotated, Optional, Sequence, Any, Dict, List

from langchain_core.runnables import RunnableConfig, ensure_config
from langchain_core.tools import StructuredTool
from react_agent import prompts


def add_tools(obj: Any) -> Any:
    """Annotation helper function for tool definitions."""
    return obj


@dataclass(kw_only=True)
class Configuration:
    """The configuration for the agent."""

    system_prompt: str = field(
        default=prompts.SYSTEM_PROMPT,
        metadata={
            "description": "The system prompt to use for the agent's interactions. "
            "This prompt sets the context and behavior for the agent."
        },
    )

    model: Annotated[str, {"__template_metadata__": {"kind": "llm"}}] = field(
        default="anthropic/claude-3-5-sonnet-20240620",
        metadata={
            "description": "The name of the language model to use for the agent's main interactions. "
            "Should be in the form: provider/model-name."
        },
    )

    fallback_model: Annotated[str, {"__template_metadata__": {"kind": "llm"}}] = field(
        default="openai/gpt-4.1",
        metadata={
            "description": "The name of the fallback language model to use when the primary model fails. "
            "Should be in the form: provider/model-name."
        },
    )

    recursion_limit: int = field(
        default=100,
        metadata={
            "description": "The maximum number of recursive calls allowed in the agent's execution."
        },
    )

    max_search_results: int = field(
        default=10,
        metadata={
            "description": "The maximum number of search results to return for each search query."
        },
    )

    tools: Annotated[Sequence[StructuredTool], add_tools] = field(
        default_factory=list,
        metadata={
            "description": "The tools to use for the agent's interactions."
        },
    )

    websocket_connection_id: str = field(
        default="",
        metadata={
            "description": "The ID of the websocket connection to use for the agent's interactions."
        },
    )

    @classmethod
    def from_runnable_config(
        cls, config: Optional[RunnableConfig] = None
    ) -> Configuration:
        """Create a Configuration instance from a RunnableConfig's "configurable" section.
        
        Args:
            config (Optional[RunnableConfig]): The config to create the Configuration from.
                If None, a new default config will be used.
                
        Returns:
            Configuration: A new Configuration instance based on the provided config.
        """
        run_config = ensure_config(config)  # Get a working copy, or default if None
        configurable = run_config.get("configurable") or {}
        
        # Convert tool dictionaries to StructuredTool objects if present
        if "tools" in configurable and isinstance(configurable["tools"], list):
            configurable["tools"] = convert_tool_dicts_to_structured_tools(configurable["tools"])
        
        _fields = {f.name for f in fields(cls) if f.init}
        # Create the Configuration instance using only relevant fields from configurable
        config_instance = cls(**{k: v for k, v in configurable.items() if k in _fields})
        
        return config_instance


def convert_tool_dicts_to_structured_tools(tool_dicts: List[Dict[str, Any]]) -> List[StructuredTool]:
    """Convert serialized tool dictionaries into StructuredTool instances"""
    tools = []
    for tool_dict in tool_dicts:
        # Create a WebSocket-based tool that calls back to the client
        tool_name = tool_dict.get("name", "unknown_tool")
        tool = StructuredTool.from_function(
            name=tool_name,
            description=tool_dict.get("description", ""),
            func=lambda _tool_name=tool_name, **kwargs: call_remote_tool(_tool_name, kwargs),
            args_schema=tool_dict.get("schema", {}),
        )
        tools.append(tool)
    return tools


def call_remote_tool(tool_name: str, kwargs: Dict[str, Any]) -> str:
    """Mock remote tool call that will later use WebSockets to call client-side tools.
    
    Args:
        tool_name: The name of the tool to call
        kwargs: The arguments to pass to the tool
        
    Returns:
        A string response (mocked for now)
    """
    print(f"Mock call to remote tool '{tool_name}' with args: {kwargs}")
    return "Hello world"
