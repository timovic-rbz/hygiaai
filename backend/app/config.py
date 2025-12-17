from __future__ import annotations
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
	"""Application settings loaded from environment variables."""

	supabase_url: Optional[str] = None
	supabase_anon_key: Optional[str] = None
	supabase_service_role_key: Optional[str] = None
	openrouter_api_key: Optional[str] = None
	environment: str = "development"
	frontend_url: Optional[str] = "http://localhost:3000"

	class Config:
		env_file = ".env"


settings = Settings()


