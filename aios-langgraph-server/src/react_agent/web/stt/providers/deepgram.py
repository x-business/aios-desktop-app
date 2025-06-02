import logging
from typing import Dict, Any, List

from deepgram import (
    DeepgramClient, DeepgramClientOptions, LiveTranscriptionEvents, LiveOptions,
    LiveResultResponse, OpenResponse, SpeechStartedResponse, UtteranceEndResponse, 
    ErrorResponse, CloseResponse, UnhandledResponse
)
from deepgram.clients.live.v1.client import AsyncLiveClient

from .base import STTServiceProvider, SendToClientCallback
from ..config import STTSettings

logger = logging.getLogger(__name__)

class DeepgramServiceProvider:
    """Implementation of STTServiceProvider using the Deepgram service.

    Handles the connection to Deepgram, processing of audio, and forwarding
    transcripts/errors back to the client via a provided callback function.

    Optional Status Callbacks:
        The following Deepgram event handlers contain commented-out code
        to send additional status messages to the client via the callback.
        These can be uncommented if the client application is designed to handle them:

        - `_on_open`: Sends `{"type": "status", "message": "STT engine connected"}`
        - `_on_speech_started`: Sends `{"type": "status", "event": "speech_started"}`
        - `_on_utterance_end`: Sends `{"type": "status", "event": "utterance_end"}`
        - `_on_close`: Sends `{"type": "status", "message": "STT engine disconnected"}`
    """

    def __init__(self, config: STTSettings, send_to_client_callback: SendToClientCallback):
        """
        Initializes the Deepgram STT service provider.

        Args:
            config: The STTSettings instance containing API keys and defaults.
            send_to_client_callback: Async callback function to send messages to the client.
        """
        logger.info("Initializing DeepgramServiceProvider")
        if not config.deepgram_api_key:
            logger.error("Deepgram API key is not configured.")
            raise ValueError("Deepgram API key is required but not set.")

        self.config = config
        self.send_to_client_callback = send_to_client_callback
        self.dg_connection: AsyncLiveClient | None = None # Will hold the active Deepgram connection
        self._is_finals: List[str] = [] # Buffer for final utterances

        # Configure Deepgram client
        dg_config: DeepgramClientOptions = DeepgramClientOptions(
            verbose=logging.DEBUG,
        )
        self.deepgram_client: DeepgramClient = DeepgramClient(config.deepgram_api_key, dg_config)
        logger.info("Deepgram client initialized.")

    # --- Deepgram Event Handlers ---
    async def _on_open(self, client_instance: AsyncLiveClient, open_data: OpenResponse, **kwargs):
        """Handler for the Deepgram Open event."""
        logger.info(f"Deepgram connection opened. Data: {open_data}, KWArgs: {kwargs}")
        # Optionally send status to client based on open_data or kwargs
        # Example: if open_data and open_data.get("success"): 
        #    await self.send_to_client_callback({"type": "status", "message": "STT engine connected"})

    async def _on_message(self, client_instance: AsyncLiveClient, **kwargs):
        """Handler for the Deepgram Transcript/Results event."""
        result_data: LiveResultResponse = kwargs.get('result')
        if not result_data:
            # Log the kwargs to see what was actually received if 'result' is missing
            logger.warning(f"'_on_message' received without 'result' in kwargs. KWArgs: {kwargs}")
            return
        
        try:
            if not result_data.channel or not result_data.channel.alternatives or len(result_data.channel.alternatives) == 0:
                # logger.debug("Received empty transcript result from Deepgram.")
                return

            sentence = result_data.channel.alternatives[0].transcript
            if len(sentence) == 0:
                return

            message_to_send = {}
            if result_data.is_final:
                self._is_finals.append(sentence)
                # If speech is final, combine accumulated finals and send
                if result_data.speech_final:
                    utterance = " ".join(self._is_finals)
                    logger.info(f"Deepgram speech final: {utterance}")
                    message_to_send = {"type": "final_transcript", "transcript": utterance}
                    self._is_finals = [] # Clear buffer after sending
                else:
                    # Send is_final=true segment (useful for faster final words)
                    logger.info(f"Deepgram is_final: {sentence}")
                    # Optionally send these as well, depends on frontend needs
                    # message_to_send = {"type": "final_segment", "transcript": sentence}
                    pass # Often, we only care about interim and full final utterances

            else:
                # Send interim results
                # logger.debug(f"Deepgram interim: {sentence}") # Can be verbose
                message_to_send = {"type": "interim_transcript", "transcript": sentence}

            # Send the message if one was prepared
            if message_to_send:
                await self.send_to_client_callback(message_to_send)

        except Exception as e:
            logger.error(f"Error processing Deepgram message: {e} (data: {result_data})", exc_info=True)
            # Attempt to send an error back to the client
            try:
                 await self.send_to_client_callback({"type": "error", "message": f"Error processing STT result: {e}"})
            except Exception as cb_e:
                 logger.error(f"Failed to send processing error back to client: {cb_e}", exc_info=True)

    async def _on_metadata(self, client_instance: AsyncLiveClient, **kwargs):
        """Handler for the Deepgram Metadata event."""
        metadata_data: Dict[str, Any] = kwargs.get('metadata')
        if not metadata_data:
            logger.warning(f"'_on_metadata' received without 'metadata' in kwargs. KWArgs: {kwargs}")
            return
        logger.info(f"Deepgram metadata received: {metadata_data}")

    async def _on_speech_started(self, client_instance: AsyncLiveClient, **kwargs):
        """Handler for the Deepgram SpeechStarted event."""
        speech_started_data: SpeechStartedResponse = kwargs.get('speech_started')
        if not speech_started_data:
            logger.warning(f"'_on_speech_started' received without 'speech_started' in kwargs. KWArgs: {kwargs}")
            return
        logger.info(f"Deepgram speech started: {speech_started_data}")
        # Optionally send status:
        # await self.send_to_client_callback({"type": "status", "event": "speech_started"})

    async def _on_utterance_end(self, client_instance: AsyncLiveClient, **kwargs):
        """Handler for the Deepgram UtteranceEnd event."""
        utterance_end_data: UtteranceEndResponse = kwargs.get('utterance_end')
        if not utterance_end_data:
            logger.warning(f"'_on_utterance_end' received without 'utterance_end' in kwargs. KWArgs: {kwargs}")
            return
        logger.info(f"Deepgram utterance end: {utterance_end_data}")
        try:
            # If there are any finals accumulated that weren't sent with speech_final=true,
            # send them now as the utterance is definitely complete.
            if len(self._is_finals) > 0:
                utterance = " ".join(self._is_finals)
                logger.info(f"Deepgram utterance end final: {utterance}")
                await self.send_to_client_callback({"type": "final_transcript", "transcript": utterance})
                self._is_finals = [] # Clear buffer
            # Optionally send status:
            # await self.send_to_client_callback({"type": "status", "event": "utterance_end"})
        except Exception as e:
            logger.error(f"Error processing utterance end: {e}", exc_info=True)

    async def _on_error(self, client_instance: AsyncLiveClient, **kwargs):
        """Handler for the Deepgram Error event."""
        error_data: ErrorResponse = kwargs.get('error')
        if not error_data:
            logger.error(f"'_on_error' received without 'error' in kwargs. Sending generic error. KWArgs: {kwargs}")
            try:
                await self.send_to_client_callback({"type": "error", "message": f"Deepgram Error: Unknown error structure (kwargs: {kwargs})"})
            except Exception as e_cb:
                logger.error(f"Failed to send generic Deepgram error back to client: {e_cb}", exc_info=True)
            return
        
        logger.error(f"Deepgram error received: {error_data}")
        try:
            error_message = str(error_data.message) if hasattr(error_data, 'message') and error_data.message else str(error_data)
            await self.send_to_client_callback({"type": "error", "message": f"Deepgram Error: {error_message}"})
        except Exception as e:
            logger.error(f"Failed to send Deepgram error back to client: {e}", exc_info=True)

    async def _on_close(self, client_instance: AsyncLiveClient, **kwargs):
        """Handler for the Deepgram Close event."""
        close_data: CloseResponse = kwargs.get('close')
        # Close event might not always have specific data in kwargs['close']
        logger.info(f"Deepgram connection closed. Data via kwargs['close']: {close_data}, All KWArgs: {kwargs}")
        # Optionally send status:
        # try:
        #     await self.send_to_client_callback({"type": "status", "message": "STT engine disconnected"})
        # except Exception as e:
        #     logger.warning(f"Could not send disconnection status to client: {e}")

    async def _on_unhandled(self, client_instance: AsyncLiveClient, **kwargs):
        """Handler for the Deepgram Unhandled event."""
        # Unhandled event might pass the raw message directly or in a specific kwarg
        unhandled_data_specific = kwargs.get('unhandled')
        logger.warning(f"Deepgram unhandled message. Specific 'unhandled' kwarg: {unhandled_data_specific}, All KWArgs: {kwargs}")
    # --- End of Deepgram Event Handlers ---

    async def connect(self, options: Dict[str, Any]) -> None:
        """
        Establishes a connection to the Deepgram streaming STT service.

        Args:
            options: Dictionary containing Deepgram LiveOptions keys
                     (e.g., 'model', 'language', 'encoding', 'sample_rate', 'channels').
                     Defaults from config are merged with provided options.
        Raises:
            ConnectionError: If the connection to Deepgram fails.
        """
        if self.dg_connection:
            logger.warning("Connect called while already connected. Ignoring.")
            return

        logger.info(f"Attempting to connect to Deepgram with options: {options}")

        try:
            # --- Configure LiveOptions for Opus Encoding --- 
            live_options = LiveOptions(
                model=options.get("model", self.config.deepgram_model),
                language=options.get("language", self.config.deepgram_language),
                # Common options for streaming:
                interim_results=True, utterance_end_ms="1000", vad_events=True,
                endpointing=300, smart_format=True,
            )
            # -----------------------------------------------
            # Allow overriding any LiveOption directly if provided in options dict
            # Note: This could override our encoding/sample_rate if client sends them
            for key, value in options.items():
                if hasattr(live_options, key):
                    logger.info(f"Overriding LiveOption '{key}' with value: {value}")
                    setattr(live_options, key, value)

            # Create the connection instance
            self.dg_connection = self.deepgram_client.listen.asynclive.v("1")

            # Register event handlers
            self.dg_connection.on(LiveTranscriptionEvents.Open, self._on_open)
            self.dg_connection.on(LiveTranscriptionEvents.Transcript, self._on_message)
            self.dg_connection.on(LiveTranscriptionEvents.Metadata, self._on_metadata)
            self.dg_connection.on(LiveTranscriptionEvents.SpeechStarted, self._on_speech_started)
            self.dg_connection.on(LiveTranscriptionEvents.UtteranceEnd, self._on_utterance_end)
            self.dg_connection.on(LiveTranscriptionEvents.Error, self._on_error)
            self.dg_connection.on(LiveTranscriptionEvents.Close, self._on_close)
            self.dg_connection.on(LiveTranscriptionEvents.Unhandled, self._on_unhandled)

            logger.info(f"Starting Deepgram connection with LiveOptions: {live_options}")
            if not await self.dg_connection.start(live_options):
                 logger.error("Failed to start Deepgram connection.")
                 self.dg_connection = None
                 raise ConnectionError("Failed to connect to Deepgram STT service.")
            logger.info("Deepgram connection started successfully.")

        except Exception as e:
            logger.error(f"Error connecting to Deepgram: {e}", exc_info=True)
            self.dg_connection = None
            raise ConnectionError(f"Failed to connect to Deepgram STT service: {e}")

    async def send_audio(self, audio_chunk: bytes) -> None:
        """
        Sends an audio chunk to Deepgram.

        Args:
            audio_chunk: The raw audio data bytes.

        Raises:
            Exception: Can raise exceptions if the send operation fails.
        """
        if not self.dg_connection:
            logger.warning("Attempted to send audio before connection established or after failure.")
            # Potentially raise an error or notify client?
            return
        try:
            logger.info(f"Sending {len(audio_chunk)} bytes to Deepgram") # Optional: very verbose
            await self.dg_connection.send(audio_chunk)
        except Exception as e:
            logger.error(f"Error sending audio to Deepgram: {e}", exc_info=True)
            # Consider how to handle send errors - maybe notify client via callback?
            # Maybe try to finish/close connection?
            # Re-raise the exception for the router to potentially handle?
            raise # Re-raise the exception for now

    async def finish(self) -> None:
        """
        Signals the end of the audio stream and gracefully disconnects
        from the STT service, cleaning up resources.
        """
        logger.info("Finishing Deepgram connection.")
        # Reset finals buffer regardless of connection state
        self._is_finals = []

        if self.dg_connection:
             try:
                 # This signals to Deepgram that the audio stream is complete.
                 await self.dg_connection.finish()
                 logger.info("Deepgram connection finish() called successfully.")
             except Exception as e:
                  logger.error(f"Error during Deepgram connection finish: {e}", exc_info=True)
             finally:
                 # Ensure connection object is cleared after attempting finish
                 self.dg_connection = None
        else:
            logger.info("No active Deepgram connection to finish.") 