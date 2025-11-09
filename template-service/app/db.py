from pathlib import Path
from dotenv import load_dotenv, find_dotenv
from sqlmodel import create_engine, Session
import os


dotenv_path = find_dotenv()
if not dotenv_path:
    candidate = Path(__file__).resolve().parents[1] / ".env"
    dotenv_path = str(candidate) if candidate.exists() else ""

if dotenv_path:
    load_dotenv(dotenv_path)


TEMPLATE_DATABASE_URL = os.getenv("TEMPLATE_DATABASE_URL")

if not TEMPLATE_DATABASE_URL:
    raise ValueError(
        "❌ TEMPLATE_DATABASE_URL is not set. Set it in the environment or place a .env at services/template-service/.env"
    )

engine = create_engine(TEMPLATE_DATABASE_URL, echo=True)


def get_session():
    """Database session."""
    with Session(engine) as session:
        yield session
