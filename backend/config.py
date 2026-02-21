"""
config.py — centralised settings loaded from .env
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    smallest_api_key: str = ""
    smallest_ws_url: str = "wss://waves-api.smallest.ai/api/v1/pulse/get_text"
    smallest_language: str = "en"
    smallest_encoding: str = "linear16"
    smallest_sample_rate: int = 16000
    smallest_word_timestamps: bool = True
    gemini_api_key: str = ""
    database_url: str = "sqlite+aiosqlite:///./lecref.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
