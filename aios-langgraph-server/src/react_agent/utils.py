"""Utility & helper functions."""

import copy
import os
from typing import Optional

from langchain.chat_models import init_chat_model
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage, AIMessage
from langchain_openai import ChatOpenAI

class OpenRouter(ChatOpenAI):
    """OpenRouter chat model that extends OpenAI."""
    
    def __init__(self, **kwargs):
        """Initialize OpenRouter with base_url and api_key from env."""
        super().__init__(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
            **kwargs
        )


def get_message_text(msg: BaseMessage) -> str:
    """Get the text content of a message."""
    content = msg.content
    if isinstance(content, str):
        return content
    elif isinstance(content, dict):
        return content.get("text", "")
    else:
        txts = [c if isinstance(c, str) else (c.get("text") or "") for c in content]
        return "".join(txts).strip()


def load_chat_model(fully_specified_name: str) -> BaseChatModel:
    """Load a chat model from a fully specified name.

    Args:
        fully_specified_name (str): String in the format 'provider/model'.
    """
    provider, model = fully_specified_name.split("/", maxsplit=1)
    if provider == "anthropic":
        print("Using OpenRouter for Anthropic")
        return OpenRouter(model=fully_specified_name)
    return init_chat_model(model, model_provider=provider)


def normalize_message_for_openai(msg: BaseMessage) -> BaseMessage:
    """Normalize a message to ensure compatibility with OpenAI API.
    
    Removes the 'function_call' attribute from message's additional_kwargs 
    if tool_calls are present, to prevent OpenAI API errors.
    
    Args:
        msg (BaseMessage): The message to normalize
        
    Returns:
        BaseMessage: A normalized copy of the message if needed, or the original message
    """
    # Only AIMessages need normalization for this issue
    if not isinstance(msg, AIMessage):
        return msg
        
    # Check if both tool_calls and function_call exist
    has_tool_calls = hasattr(msg, 'tool_calls') and msg.tool_calls
    has_function_call = (hasattr(msg, 'additional_kwargs') and 
                        msg.additional_kwargs and 
                        'function_call' in msg.additional_kwargs)
    
    # If both exist, we need to create a normalized copy
    if has_tool_calls and has_function_call:
        # Try multiple copy methods for compatibility
        msg_copy = _safe_copy_message(msg)
        if msg_copy:
            # Remove the function_call to avoid OpenAI API error
            del msg_copy.additional_kwargs['function_call']
            return msg_copy
    
    # Message doesn't need normalization or copy failed (rare)
    return msg


def _safe_copy_message(msg: BaseMessage) -> Optional[BaseMessage]:
    """Create a deep copy of a message using the appropriate method.
    
    Tries multiple copy methods for compatibility with different LangChain versions.
    
    Args:
        msg (BaseMessage): Message to copy
        
    Returns:
        Optional[BaseMessage]: Copied message or None if all methods fail
    """
    try:
        # Try Pydantic v2+ method
        return msg.model_copy(deep=True)
    except AttributeError:
        try:
            # Try Pydantic v1 method
            return msg.copy(deep=True)
        except AttributeError:
            try:
                # General fallback
                return copy.deepcopy(msg)
            except Exception:
                # If all copy methods fail (very unlikely)
                return None
