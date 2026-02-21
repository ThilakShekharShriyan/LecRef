"""
config.py — centralised settings loaded from .env
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # STT (Speech to Text)
    smallest_api_key: str = ""
    smallest_ws_url: str = "wss://waves-api.smallest.ai/api/v1/pulse/get_text"
    smallest_language: str = "en"
    smallest_encoding: str = "linear16"
    smallest_sample_rate: int = 16000
    smallest_word_timestamps: bool = True

    # TTS (Text to Speech)
    smallest_tts_model: str = "lightning-v2"
    smallest_tts_voice_id: str = "alice"
    smallest_tts_sample_rate: int = 24000
    smallest_tts_speed: float = 1.0

    # LLM (Large Language Model) - using Groq
    groq_api_key: str = ""
    
    # Google Docs API
    google_docs_credentials: str = ""
    
    # Database - SQLite (always enabled)
    database_url: str = "sqlite+aiosqlite:///./lecref.db"
    
    # Convex (optional real-time database)
    enable_convex: bool = False
    convex_url: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
