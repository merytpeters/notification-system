"""App startup/shutdown, table migrations"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlmodel import SQLModel
from .db import engine
from .redis_manager import init_redis, get_redis, close_redis
from app.models.templater import Template, TemplateVersion


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up: creating database tables...")
    SQLModel.metadata.create_all(engine, checkfirst=True)

    init_redis()
    await get_redis()

    yield
    print("Shutting down...")
    await close_redis()
