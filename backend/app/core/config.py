import os
from functools import lru_cache


class Settings:
    def __init__(self) -> None:
        self.environment: str = os.getenv("ENVIRONMENT", "development")
        self.supabase_url: str = os.getenv("SUPABASE_URL", "")
        self.supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
        self.openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")


@lru_cache
def get_settings() -> Settings:
    return Settings()


