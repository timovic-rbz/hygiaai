from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .api import router as api_router
from .config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
	# Startup: Try to start scheduler
	try:
		from .services.notification import start_scheduler
		from .services.quality import start_quality_scheduler
		start_scheduler()
		start_quality_scheduler()
	except ImportError:
		print("WARNING: 'apscheduler' not installed. Reminder service disabled.")
	except Exception as e:
		print(f"WARNING: Failed to start scheduler: {e}")
	
	yield
	# Shutdown logic here if needed

app = FastAPI(title="HygiaAI Backend", lifespan=lifespan)

app.add_middleware(
	CORSMiddleware,
	allow_origins=[settings.frontend_url or "http://localhost:3000", "http://localhost:3000"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

@app.get("/")
def read_root():
	return {"message": "HygiaAI backend active"}

@app.get("/health")
def health():
	return {"ok": True}

app.include_router(api_router)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
