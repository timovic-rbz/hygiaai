from __future__ import annotations
from typing import Optional, Dict, Any
import httpx

from .config import settings


class OpenRouterClient:
	"""Prepared client for OpenRouter.ai; not actively used yet."""

	def __init__(self, api_key: Optional[str]):
		self.api_key = api_key
		self.base_url = "https://openrouter.ai/api/v1"
		self.model = "openrouter/auto"

	def is_configured(self) -> bool:
		return bool(self.api_key)

	async def complete(self, prompt: str) -> Dict[str, Any]:
		# Prepared but unused path; kept for future integration
		if not self.is_configured():
			return {"reply": "KI ist noch nicht konfiguriert."}
		headers = {
			"Authorization": f"Bearer {self.api_key}",
			"Content-Type": "application/json",
		}
		payload = {
			"model": self.model,
			"messages": [{"role": "user", "content": prompt}],
		}
		async with httpx.AsyncClient(timeout=60) as client:
			resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
			resp.raise_for_status()
			data = resp.json()
			reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")
			return {"reply": reply, "raw": data}


openrouter_client = OpenRouterClient(settings.openrouter_api_key)


