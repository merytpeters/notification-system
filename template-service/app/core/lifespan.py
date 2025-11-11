"""App startup/shutdown, table migrations"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlmodel import SQLModel
from .db import engine
from app.models.templater import Template


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up: creating database tables...")
    SQLModel.metadata.create_all(engine, checkfirst=True)

    yield
    print("Shutting down...")
