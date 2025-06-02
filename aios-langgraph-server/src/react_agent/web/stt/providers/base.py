import logging
from typing import Protocol, Any, Dict, Callable, Awaitable

# Type alias for the callback function that sends data back to the client WebSocket
# It expects a dictionary (serializable to JSON) and returns nothing.
SendToClientCallback = Callable[[Dict[str, Any]], Awaitable[None]]

# Get logger
logger = logging.getLogger(__name__)

class STTServiceProvider(Protocol):
    """Defines the interface for a streaming Speech-to-Text service provider."""

    config: Any # Provider-specific configuration object
    send_to_client_callback: SendToClientCallback # Callback to send messages to the client

    def __init__(self, config: Any, send_to_client_callback: SendToClientCallback):
        """
        Initializes the STT service provider.

        Args:
            config: Configuration object specific to the provider (e.g., API keys, models).
            send_to_client_callback: An async function to call for sending messages
                                     (like transcripts or errors) back to the client.
        """
        ...

    async def connect(self, options: Dict[str, Any]) -> None:
        """
        Establishes a connection to the streaming STT service.

        Args:
            options: Dictionary containing connection options like 'encoding',
                     'sample_rate', 'language', 'model', etc. Specific keys
                     depend on the provider implementation.

        Raises:
            ConnectionError: If the connection to the STT service fails.
        """
        ...

    async def send_audio(self, audio_chunk: bytes) -> None:
        """
        Sends an audio chunk to the STT service.

        Args:
            audio_chunk: The raw audio data bytes.

        Raises:
            Exception: If sending fails (specific exception depends on provider).
        """
        ...

    async def finish(self) -> None:
        """
        Signals the end of the audio stream and gracefully disconnects
        from the STT service, cleaning up resources.
        """
        ... 