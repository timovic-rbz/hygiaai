from typing import Optional

from supabase import Client, create_client  # type: ignore

from ..core.config import get_settings

_client: Optional[Client] = None


def get_supabase_client() -> Client:
    global _client
    if _client is None:
        settings = get_settings()
        if not settings.supabase_url or not settings.supabase_anon_key:
            raise RuntimeError("Supabase credentials are not configured")
        _client = create_client(settings.supabase_url, settings.supabase_anon_key)
    return _client


