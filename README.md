HygiaAI
=======

HygiaAI ist ein intelligentes Planungstool für Gebäudereinigungsfirmen.  
Die Anwendung hilft dabei, Kunden, Mitarbeiter und Reinigungsobjekte zu verwalten, Routen zu optimieren und Dienstleistungen wie Glasreinigung, Treppenhausreinigung, Unterhaltsreinigung, Photovoltaikreinigung oder Sonderreinigung zu organisieren.

Struktur
--------

- `backend`: FastAPI-Backend (Python)
- `frontend`: Next.js-Frontend (React, App Router)
- `infra`: Infrastruktur-/Deployment-Vorbereitung (z. B. docker-compose)

Schnellstart
------------

1) Voraussetzungen
- Python 3.11+
- Node.js 18+ (empfohlen 20+)

2) Umgebungsvariablen
- Kopiere `.env.example` zu `.env` und passe die Werte an.

3) Backend lokal starten
- Installiere Abhängigkeiten:
  - `python -m venv .venv && source .venv/bin/activate`
  - `pip install -r backend/requirements.txt`
- Starte den Server:
  - `uvicorn backend.app.main:app --reload --port 8000`
- Test: `GET http://localhost:8000/` → `{ "message": "HygiaAI backend active" }`

4) Frontend entwickeln
- (Optional) Abhängigkeiten installieren:
  - `cd frontend && npm install`
- Dev-Server:
  - `npm run dev`
- Öffne: `http://localhost:3000`

Hinweise
--------
- Supabase und OpenRouter.ai werden später angebunden. Die Platzhalter für die Variablen sind bereits in `.env.example` enthalten.
- Die Ordner- und Dateistruktur ist so ausgelegt, dass das Projekt schrittweise erweitert werden kann (Domain-Module, Routen, Services, Integrationen).

HygiaAI
========

HygiaAI ist ein intelligentes Planungstool für Gebäudereinigungsfirmen. Es hilft dabei, Kunden, Mitarbeiter und Reinigungsobjekte zu verwalten, Routen zu optimieren und Dienstleistungen wie Glasreinigung, Treppenhausreinigung, Unterhaltsreinigung, Photovoltaikreinigung und Sonderreinigung zu kategorisieren.

Projektstruktur
---------------

- `backend/`: FastAPI Backend (Python), vorbereitet für Supabase und spätere AI-Features (OpenRouter)
- `frontend/`: Next.js (React) Frontend mit Dashboard-Grundgerüst
- `infra/`: Infrastruktur-Dateien und Platzhalter
- `.env.example`: Beispiel-Umgebungsvariablen

Schnellstart
------------

Backend (FastAPI):

1. Python-Umgebung erstellen und Abhängigkeiten installieren:
   ```bash
   cd backend
   python3 -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Environment setzen (siehe `.env.example` im Repo-Wurzelverzeichnis).
3. Server starten:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
4. Test: `GET http://localhost:8000/` → `{"message":"HygiaAI backend active"}`

Frontend (Next.js):

1. Dependencies installieren:
   ```bash
   cd frontend
   npm install
   ```
2. Dev-Server starten:
   ```bash
   npm run dev
   ```
3. Aufrufen: `http://localhost:3000`

Umgebungsvariablen
------------------

Lege eine `.env` im Wurzelverzeichnis an, basierend auf `.env.example`. Wichtige Variablen:

- `SUPABASE_URL` und `SUPABASE_ANON_KEY` für die Datenbank-Anbindung
- `OPENROUTER_API_KEY` für spätere AI-Funktionen
- `ENVIRONMENT` (z. B. `development`)

Hinweise
--------

- Der Backend-Endpunkt `/` liefert bereits eine einfache JSON-Antwort zur Funktionsprüfung.
- Supabase-Client ist vorbereitet, initialisiert sich jedoch erst bei Bedarf (lazy init).
- Die Infrastruktur-Ordner sind als Platzhalter angelegt und können später mit Docker, Terraform o. Ä. befüllt werden.


