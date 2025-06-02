"""Defines interfaces and implementations for executing tools remotely."""

import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any

from react_agent.web.connection import (
    ConnectionManager,
    ConnectionNotFoundError,
    get_connection_manager
)

logger = logging.getLogger('executors')

# --- Custom Executor Exceptions ---

class ToolExecutionError(Exception):
    """Base class for errors during remote tool execution."""
    pass

class ToolTimeoutError(ToolExecutionError):
    """Raised when a remote tool call times out."""
    def __init__(self, tool_call_id: str, timeout: float):
        self.tool_call_id = tool_call_id
        self.timeout = timeout
        super().__init__(f"Tool call {tool_call_id} timed out after {timeout} seconds.")

class ClientUnavailableError(ToolExecutionError):
    """Raised when the client connection is not available for the tool call."""
    def __init__(self, connection_id: str):
        self.connection_id = connection_id
        super().__init__(f"Client connection {connection_id} not found or unavailable.")

class ToolSendError(ToolExecutionError):
    """Raised when sending the tool call to the client fails."""
    def __init__(self, tool_call_id: str, connection_id: str, original_exception: Exception):
        self.tool_call_id = tool_call_id
        self.connection_id = connection_id
        self.original_exception = original_exception
        super().__init__(f"Failed to send tool call {tool_call_id} to client {connection_id}: {original_exception}")


# --- Executor Interface ---

class RemoteToolExecutor(ABC):
    """Abstract base class for executing tools on a remote client."""

    @abstractmethod
    async def execute(
        self,
        connection_id: str,
        tool_call_id: str,
        tool_name: str,
        tool_args: Dict[str, Any],
        timeout: float = 30.0  # Default timeout
    ) -> Any:
        """Executes a tool remotely via the specified connection.

        Args:
            connection_id: The unique identifier for the client connection.
            tool_call_id: The unique identifier for this specific tool call.
            tool_name: The name of the tool to execute.
            tool_args: The arguments for the tool.
            timeout: Maximum time in seconds to wait for a response.

        Returns:
            The result returned by the client for the tool execution.

        Raises:
            ClientUnavailableError: If the connection_id is not found.
            ToolTimeoutError: If the client does not respond within the timeout.
            ToolSendError: If sending the request to the client fails.
            ToolExecutionError: For other unspecified execution errors.
        """
        pass


# --- WebSocket Implementation ---

class WebSocketToolExecutor(RemoteToolExecutor):
    """Executes tools remotely over a WebSocket connection using ConnectionManager."""

    def __init__(self, connection_manager: ConnectionManager):
        if connection_manager is None:
             # Fallback if not provided - though dependency injection is preferred
             logger.warning("WebSocketToolExecutor created without explicit ConnectionManager, using global instance.")
             self._manager = get_connection_manager()
        else:
             self._manager = connection_manager

    async def execute(
        self,
        connection_id: str,
        tool_call_id: str,
        tool_name: str,
        tool_args: Dict[str, Any],
        timeout: float = 30.0
    ) -> Any:
        """Executes the tool via WebSocket."""
        logger.info(f"Executor requesting tool '{tool_name}' (ID: {tool_call_id}) via connection {connection_id}")
        try:
            # Request the tool call via ConnectionManager, get the Future
            response_future = await self._manager.call_tool(
                connection_id=connection_id,
                tool_call_id=tool_call_id,
                tool_name=tool_name,
                tool_args=tool_args
            )

            # Wait for the Future to complete with a timeout
            result = await asyncio.wait_for(response_future, timeout=timeout)
            logger.info(f"Executor received result for tool call {tool_call_id}")
            return result

        except ConnectionNotFoundError as e:
            logger.error(f"Executor error: Connection {connection_id} not found.")
            raise ClientUnavailableError(connection_id=connection_id) from e
        except asyncio.TimeoutError as e:
            logger.error(f"Executor error: Tool call {tool_call_id} timed out after {timeout}s.")
            # Note: The future might still be in response_callbacks; ConnectionManager.disconnect handles cleanup.
            # Consider if ConnectionManager should have a specific cancel method too.
            raise ToolTimeoutError(tool_call_id=tool_call_id, timeout=timeout) from e
        except Exception as e:
            # Catch potential send errors re-raised by call_tool or other unexpected issues
            # Check if it was a send error specifically? Requires call_tool to raise a specific type.
            # For now, wrap generic errors.
            logger.error(f"Executor error during tool call {tool_call_id} for {connection_id}: {e}", exc_info=True)
            # If we had a more specific SendError from call_tool:
            # raise ToolSendError(tool_call_id, connection_id, e) from e
            raise ToolExecutionError(f"An unexpected error occurred during tool call {tool_call_id}: {e}") from e 