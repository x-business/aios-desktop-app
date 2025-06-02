"""FastAPI server implementation."""
from uuid import uuid4
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, Any
import logging
import json
import asyncio
from contextlib import suppress
from starlette.websockets import WebSocketState

# Use the new dependency getter and custom exception
from react_agent.web.connection import ConnectionManager, get_connection_manager, ConnectionNotFoundError
from react_agent.web.stt.router import stt_router

# Get the logger
logger = logging.getLogger(__name__)

# Basic logging configuration (configure level and format as needed)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Create FastAPI app
app = FastAPI(title="AIOS Agent Server with Tool and STT WebSocket")


@app.get("/")
def read_root():
    return {"status": "Server is running"}


# Inject the ConnectionManager instance using Depends for the existing tool WS
@app.websocket("/ws")
async def websocket_tool_endpoint(
    websocket: WebSocket,
    manager: ConnectionManager = Depends(get_connection_manager)
):
    connection_id = None
    try:
        logger.info("New Tool WebSocket connection attempt")
        await websocket.accept()
        logger.info("Tool WebSocket connection accepted")

        # Store connection (with empty tools) and immediately send back the connection ID
        connection_id = await manager.connect(websocket, tools={}) # Pass empty tools
        try:
            await websocket.send_json({
                "type": "connection_established",
                "connection_id": connection_id
            })
            logger.info(f"Tool connection established for {connection_id}")
        except WebSocketDisconnect:
             logger.warning(f"Client {connection_id} disconnected immediately after tool connection established.")
             # Manager disconnect will be handled in finally block
             return
        except Exception as e:
             logger.error(f"Failed to send connection_established to {connection_id}: {e}", exc_info=True)
             # Manager disconnect will be handled in finally block
             return

        # --- Handle incoming messages after setup --- (for tool WS)
        try:
            while True:
                try:
                    message_raw = await websocket.receive_text()
                    message = json.loads(message_raw)
                    logger.info(f"Received raw tool message content from {connection_id}: {message}")
                    # logger.info(f"Initial type of received message object for {connection_id}: {type(message)}")

                except json.JSONDecodeError:
                    logger.error(f"Initial JSON parse failed for tool WS {connection_id}. Raw data: '{message_raw[:100]}...'. Ignoring message.")
                    continue
                except WebSocketDisconnect:
                    logger.info(f"Tool WebSocket disconnected normally for {connection_id} during receive loop.")
                    break

                # Ensure message is a dictionary
                if not isinstance(message, dict):
                    logger.error(f"Received tool message is not a dictionary after parsing for {connection_id}: {type(message)}. Ignoring.")
                    continue

                if "tool_call_id" in message:
                    logger.info(f"Processing response for tool call {message['tool_call_id']} from {connection_id}")
                    manager.handle_response(
                        message["tool_call_id"],
                        message.get("response")
                    )
                else:
                    logger.warning(f"Received message from tool WS {connection_id} without tool_call_id. Type: {message.get('type', 'N/A')}. Ignoring.")

        except WebSocketDisconnect:
            logger.info(f"Tool WebSocket {connection_id} disconnected.")
        except Exception as e:
            logger.error(f"Unexpected error in tool WebSocket message loop for {connection_id}: {str(e)}", exc_info=True)
            with suppress(Exception):
                 if websocket.client_state != WebSocketState.DISCONNECTED:
                     await websocket.close(code=1011, reason="Internal server error during communication")

    except Exception as e:
        logger.error(f"Error during tool WebSocket connection setup phase: {str(e)}", exc_info=True)
        with suppress(Exception):
             if websocket.client_state != WebSocketState.DISCONNECTED:
                  await websocket.close(code=1011, reason="Setup error")

    finally:
        if connection_id:
            logger.info(f"Cleaning up tool connection: {connection_id}")
            manager.disconnect(connection_id)
        else:
             logger.info("Cleaning up tool connection attempt that failed before ID assignment.")

# Include the STT router
app.include_router(stt_router, prefix="/stt") # Add prefix for clarity

# Optional: Add main block for running with uvicorn if needed
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info") 