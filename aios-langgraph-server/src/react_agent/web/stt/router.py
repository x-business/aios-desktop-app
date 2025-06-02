import asyncio
import logging
from typing import Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState
from contextlib import suppress

# Import provider and config
from react_agent.web.stt.providers.deepgram import DeepgramServiceProvider
from react_agent.web.stt.config import stt_settings

logger = logging.getLogger(__name__)

stt_router = APIRouter()

@stt_router.websocket("/stt-stream")
async def stt_stream_endpoint(websocket: WebSocket):
    """WebSocket endpoint for streaming Speech-to-Text."""
    session_id = None # Placeholder for potential session management
    provider: DeepgramServiceProvider | None = None # Type hint for clarity

    try:
        await websocket.accept()
        session_id = websocket.headers.get("sec-websocket-key") # Use key as temporary ID
        logger.info(f"STT WebSocket connection accepted from {websocket.client.host}:{websocket.client.port}, session: {session_id}")

        # --- Instantiate Provider (Step 5) ---
        try:
            # Define the callback function specific to this client connection
            async def send_json_to_client(data: Dict[str, Any]):
                try:
                    await websocket.send_json(data)
                except WebSocketDisconnect:
                    logger.warning(f"Client {session_id} disconnected while trying to send message: {data.get('type')}")
                except Exception as e:
                    logger.error(f"Error sending message to client {session_id}: {e}", exc_info=True)

            provider = DeepgramServiceProvider(stt_settings, send_json_to_client)
            logger.info(f"STT Provider instantiated for session {session_id}")

        except ValueError as e:
             logger.error(f"Failed to instantiate STT provider for session {session_id}: {e}", exc_info=True)
             await websocket.close(code=1011, reason=f"Configuration error: {e}")
             return # Stop processing if provider fails to init
        except Exception as e:
             logger.error(f"Unexpected error instantiating STT provider for session {session_id}: {e}", exc_info=True)
             await websocket.close(code=1011, reason="Provider initialization failed")
             return # Stop processing
        # -------------------------------------

        # --- Connect Provider (Step 6) ---
        try:
            # TODO: Eventually allow client to pass options (encoding, sample_rate, etc.)
            # For now, use defaults defined in DeepgramServiceProvider.connect()
            await provider.connect({})
            logger.info(f"STT Provider connected for session {session_id}")
        except ConnectionError as e:
            logger.error(f"STT Provider connection failed for session {session_id}: {e}", exc_info=True)
            await websocket.close(code=1011, reason=f"STT connection failed: {e}")
            return # Stop processing if provider can't connect
        except Exception as e:
            logger.error(f"Unexpected error connecting STT provider for session {session_id}: {e}", exc_info=True)
            await websocket.close(code=1011, reason="STT connection failed")
            return # Stop processing
        # -------------------------------

        # Main loop to receive audio/messages from client
        while True:
            try:
                message = await websocket.receive()
                # logger.info(f"Received message: {message} for session {session_id}")
                # logger.debug(f"Received message type: {message.get('type')} for session {session_id}")

                if message["type"] == "websocket.receive":
                    if message.get("bytes"):
                        # --- Pass audio chunk to provider (Step 7) ---
                        if provider:
                           try:
                               await provider.send_audio(message['bytes'])
                           except Exception as e:
                               # Handle potential errors during audio sending (e.g., connection closed)
                               logger.error(f"Error sending audio chunk for session {session_id}: {e}", exc_info=False) # Don't need full stack trace usually
                               # Decide if we should close the connection here
                               # await websocket.close(code=1011, reason="Audio send error")
                               # break # Exit loop if sending fails critically
                        # ---------------------------------------------
                    elif message.get("text"):
                        # TODO: Handle potential JSON control messages (e.g., stop)
                        logger.warning(f"Received text message for session {session_id}: {message.get('text')}. Ignoring for now.")
                        pass # Placeholder

                elif message["type"] == "websocket.disconnect":
                    logger.info(f"Client {session_id} disconnected gracefully.")
                    break # Exit the loop cleanly

            except WebSocketDisconnect:
                logger.info(f"Client {session_id} disconnected abruptly.")
                break # Exit loop on abrupt disconnect
            except Exception as e:
                logger.error(f"Error during WebSocket communication for {session_id}: {e}", exc_info=True)
                # Attempt to close gracefully on server-side error
                with suppress(Exception):
                    await websocket.close(code=1011, reason="Internal server error")
                break # Exit loop after error

    except Exception as e:
        # Log errors during the connection setup phase (including accept() or provider init issues handled above)
        logger.error(f"Error during STT WebSocket setup/runtime for {session_id or 'unknown client'}: {e}", exc_info=True)
        # Ensure connection is closed if setup fails after accept (or during runtime error not caught above)
        with suppress(Exception):
            if websocket.client_state != WebSocketState.DISCONNECTED:
                await websocket.close(code=1011, reason="Server error during setup or communication")
    finally:
        logger.info(f"Cleaning up STT WebSocket connection for session {session_id}")
        if provider:
            # --- Ensure provider is cleaned up (Step 9) ---
            logger.debug(f"Initiating provider cleanup for session {session_id}")
            try:
                await provider.finish() # Ensure Deepgram connection is closed
            except Exception as e:
                 logger.error(f"Error during provider cleanup for session {session_id}: {e}", exc_info=True)
            # -------------------------------------------
        else:
            logger.debug(f"No provider to clean up for session {session_id} (may have failed init)") 