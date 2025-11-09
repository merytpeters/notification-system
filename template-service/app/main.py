from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import engine
from sqlmodel import SQLModel


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up: creating database tables...")
    SQLModel.metadata.create_all(engine)

    yield
    print("Shutting down...")


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


@app.get("/health")
def health_check():
    return {"Health Check": "We are live"}
