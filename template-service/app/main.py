"""FastAPI app main entry point"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.lifespan import lifespan
from app.api.v1.templates import router as templates_router


app = FastAPI(
    title="Notification Template Service",
    description="The Template Service manages, stores, and renders notification templates used across the notification system",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(templates_router, prefix="/api/v1/templates", tags=["Templates"])


@app.get("/health")
def health_check():
    return {"Health Check": "We are live"}
