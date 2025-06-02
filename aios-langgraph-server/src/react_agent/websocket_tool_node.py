"""Define a custom ToolNode that executes tools remotely via WebSockets.

This module extends the standard ToolNode from langgraph to support remote tool execution
using WebSockets for communication with client-side tools.
"""

import asyncio
from typing import Any, Dict, Literal, Optional, Sequence, Union

from langchain_core.messages import ToolMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import BaseTool
from langgraph.prebuilt.tool_node import ToolNode
from langgraph.store.base import BaseStore

from react_agent.web.connection_factory import get_connection_manager


class WebSocketToolNode(ToolNode):
    """A node that executes tools remotely via WebSockets.
    
    This class extends the standard ToolNode but overrides the tool execution method
    to make remote calls via WebSockets. It uses the ConnectionManager to communicate
    with client-side tools.
    
    Args:
        tools: A sequence of tools that can be invoked by the ToolNode.
        connection_id: The ID of the specific client connection to use.
        connection_manager: Optional. The WebSocket connection manager for communicating with clients.
                           If not provided, will use the global singleton.
        name: The name of the ToolNode in the graph. Defaults to "websocket_tools".
        tags: Optional tags to associate with the node. Defaults to None.
        handle_tool_errors: How to handle tool errors raised by tools inside the node.
        messages_key: The state key in the input that contains the list of messages.
    """

    def __init__(
        self,
        tools: Sequence[Union[BaseTool, Any]],
        connection_id: str,
        connection_manager=None,
        *,
        name: str = "websocket_tools",
        tags: Optional[list[str]] = None,
        handle_tool_errors: Union[bool, str, Any] = True,
        messages_key: str = "messages",
    ):
        """Initialize the WebSocketToolNode with connection details."""
        super().__init__(
            tools,
            name=name,
            tags=tags,
            handle_tool_errors=handle_tool_errors,
            messages_key=messages_key,
        )
        # Use provided manager or get the global singleton
        self.connection_manager = connection_manager or get_connection_manager()
        self.connection_id = connection_id

    async def _arun_one(
        self,
        call: Dict[str, Any],
        input_type: Literal["list", "dict", "tool_calls"],
        config: RunnableConfig,
    ) -> ToolMessage:
        """Execute a single tool call remotely via WebSocket.
        
        This method overrides the standard _arun_one method to make remote calls.
        
        Args:
            call: The tool call dictionary with name, args, and id.
            input_type: The type of input received by the ToolNode.
            config: Runtime configuration for the call.
            
        Returns:
            A ToolMessage containing the response from the remote tool.
        """
        # Validate the tool call first (using parent class method)
        if invalid_tool_message := self._validate_tool_call(call):
            return invalid_tool_message

        try:
            # Send the tool call over WebSocket and wait for the response
            tool_name = call["name"]
            tool_args = call["args"]
            tool_id = call["id"]
            
            # Call the tool remotely and get a future for the result
            response_future = await self.connection_manager.call_tool(
                connection_id=self.connection_id,
                tool_call_id=tool_id,
                tool_name=tool_name,
                tool_args=tool_args
            )
            
            # Wait for the response
            response = await response_future
            
            # Return the response as a ToolMessage
            return ToolMessage(
                content=response,
                name=tool_name,
                tool_call_id=tool_id
            )
            
        except Exception as e:
            # Handle errors based on handle_tool_errors setting
            if not self.handle_tool_errors:
                raise e
                
            error_message = f"Error executing remote tool: {str(e)}"
            return ToolMessage(
                content=error_message,
                name=call["name"],
                tool_call_id=call["id"],
                status="error"
            )
            
    # Override _run_one to ensure it also uses the async implementation
    def _run_one(
        self,
        call: Dict[str, Any],
        input_type: Literal["list", "dict", "tool_calls"],
        config: RunnableConfig,
    ) -> ToolMessage:
        """Execute a single tool call remotely via WebSocket.
        
        This method overrides the standard _run_one method to use the async implementation.
        
        Args:
            call: The tool call dictionary with name, args, and id.
            input_type: The type of input received by the ToolNode.
            config: Runtime configuration for the call.
            
        Returns:
            A ToolMessage containing the response from the remote tool.
        """
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(
            self._arun_one(call, input_type, config)
        ) 