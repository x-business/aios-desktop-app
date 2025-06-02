"""WebSocket connection management."""
from dataclasses import dataclass
import logging
from typing import Dict, Any
import asyncio
from uuid import uuid4
import json
from fastapi import WebSocket

logger = logging.getLogger('websocket_server')

# Custom Exceptions
class ConnectionNotFoundError(Exception):
    """Raised when a connection ID is not found."""
    pass

class PendingToolCallError(Exception):
    """Raised when trying to disconnect a client with pending tool calls."""
    pass

@dataclass
class WebSocketConnection:
    socket: WebSocket
    tools: Dict[str, Any]  # Store tool definitions for this connection
    pending_calls: set[str] # Keep track of tool_call_ids pending for this connection


class ConnectionManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            # Initialize here to ensure they exist before __init__ is potentially called multiple times
            cls._instance.active_connections = {}
            cls._instance.response_callbacks = {}
        return cls._instance

    def __init__(self):
        # Initialize only if these attributes don't exist yet
        # Note: __new__ already initialized them, this is defensive.
        if not hasattr(self, 'active_connections'):
            self.active_connections: Dict[str, WebSocketConnection] = {}
        if not hasattr(self, 'response_callbacks'):
            self.response_callbacks: Dict[str, asyncio.Future] = {}

    async def connect(self, websocket: WebSocket, tools: Dict[str, Any]) -> str:
        """Store a new client connection and their tools"""
        connection_id = str(uuid4())
        logger.info(f"New connection created with ID: {connection_id}")
        self.active_connections[connection_id] = WebSocketConnection(
            socket=websocket,
            tools=tools,
            pending_calls=set() # Initialize pending calls set
        )
        return connection_id

    def disconnect(self, connection_id: str):
        """Remove a client connection"""
        if connection_id in self.active_connections:
            connection = self.active_connections[connection_id]
            # Optional: Check if there are pending calls before disconnecting fully
            # if connection.pending_calls:
            #     logger.warning(f"Disconnecting client {connection_id} with pending tool calls: {connection.pending_calls}")
            #     # Decide handling: maybe cancel futures, maybe raise error
            #     # For now, just log and proceed. Consider raising PendingToolCallError if strictness needed.

            logger.info(f"Disconnecting client: {connection_id}")
            # Clean up any futures associated with this connection that might still be lingering
            # This prevents memory leaks if a client disconnects before sending a response
            for tool_call_id in list(connection.pending_calls): # Iterate copy as we modify callbacks
                 if tool_call_id in self.response_callbacks:
                     future = self.response_callbacks.pop(tool_call_id)
                     if not future.done():
                         # Cancel the future to signal the waiting task
                         future.cancel()
                         logger.info(f"Cancelled pending future {tool_call_id} for disconnected client {connection_id}")

            del self.active_connections[connection_id]
        else:
            # Optionally log or handle cases where disconnect is called for an unknown ID
            logger.warning(f"Attempted to disconnect non-existent connection ID: {connection_id}")
            # Do not raise ConnectionNotFoundError here, as disconnect might be called during cleanup

    async def call_tool(self, connection_id: str, tool_call_id: str, tool_name: str, tool_args: Dict[str, Any]) -> asyncio.Future:
        """Call a tool on the client side and return a Future for the result"""
        connection = self.active_connections.get(connection_id)
        if connection is None:
            logger.error(f"No connection found for {connection_id} during tool call")
            raise ConnectionNotFoundError(f"No active connection found for ID: {connection_id}")

        if tool_call_id in self.response_callbacks:
             logger.warning(f"Tool call ID {tool_call_id} already exists. Overwriting.")
             # Decide handling: raise error or allow overwrite? Overwriting might happen with retries.

        logger.info(f"Calling tool {tool_name} with tool call ID: {tool_call_id} for connection {connection_id}")

        response_future = asyncio.Future()
        self.response_callbacks[tool_call_id] = response_future
        connection.pending_calls.add(tool_call_id) # Track pending call

        try:
            await connection.socket.send_json({
                "tool_call_id": tool_call_id,
                "type": "tool_call",
                "data": {
                    "name": tool_name,
                    "arguments": tool_args
                }
            })
        except Exception as e:
            logger.error(f"Failed to send tool call {tool_call_id} to {connection_id}: {e}")
            # Clean up the callback if sending failed
            self.response_callbacks.pop(tool_call_id, None)
            connection.pending_calls.discard(tool_call_id)
            # Re-raise or raise a specific "SendError"? Re-raising for now.
            raise

        # Add a listener to remove the tool_call_id from pending_calls when the future completes
        response_future.add_done_callback(
            lambda _: connection.pending_calls.discard(tool_call_id) if connection_id in self.active_connections else None
        )

        return response_future

    def handle_response(self, tool_call_id: str, response_data: Any):
        """Handle a response to a previously sent event"""
        logger.info(f"Handling response for tool call ID: {tool_call_id}")
        if tool_call_id in self.response_callbacks:
            future = self.response_callbacks.pop(tool_call_id) # Remove here
            if not future.done():
                 logger.info(f"Found callback for tool call: {tool_call_id}. Setting result.")
                 future.set_result(response_data)
            else:
                 logger.warning(f"Future for {tool_call_id} was already done (possibly cancelled or timed out).")
        else:
            logger.warning(f"No callback found or already handled for tool call: {tool_call_id}")


# --- Dependency Injection ---
_connection_manager_instance = ConnectionManager()

def get_connection_manager() -> ConnectionManager:
    """FastAPI dependency getter for the ConnectionManager singleton."""
    return _connection_manager_instance 