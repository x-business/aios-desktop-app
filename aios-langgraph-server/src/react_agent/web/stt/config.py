import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

class STTSettings(BaseSettings):
    """Configuration settings for the STT service, loaded from environment variables."""
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    deepgram_api_key: str = "" # Loaded from DEEPGRAM_API_KEY env var
    deepgram_model: str = "nova-3" # Loaded from DEEPGRAM_MODEL env var, defaults to nova-2
    deepgram_language: str = "multi" # Loaded from DEEPGRAM_LANGUAGE env var, defaults to en-US

# Create a single instance to be imported elsewhere
stt_settings = STTSettings()

# Basic validation
if not stt_settings.deepgram_api_key:
    print("Warning: DEEPGRAM_API_KEY environment variable not set.") # Use logger in real app 