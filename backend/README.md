# HygiaAI Backend (FastAPI)

Dieser Ordner enthält das FastAPI-Backend für HygiaAI. Der Root-Endpunkt `/` liefert eine einfache JSON-Antwort zur Funktionsprüfung.

Schnellstart:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Konfiguration: Umgebungsvariablen gemäß der `.env.example` im Repo-Wurzelverzeichnis.


