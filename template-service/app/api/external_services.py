"""External Microservices"""

# services/external.py
import os
import httpx


async def get_user(user_id: str, base_url: str | None = None) -> dict:
    """
    Fetch user data from the User microservice.
    """
    base_url = base_url or os.getenv("USER_SERVICE_URL", "http://localhost:3001")
    url = f"{base_url}/{user_id}"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=5.0)
            resp.raise_for_status()
            return resp.json()
        except (httpx.RequestError, httpx.HTTPStatusError) as e:
            print(f"User service error: {e}")
            return {"name": "John Doe", "email": "john@example.com"}  # Fallback


async def get_email_settings(user_id: str, base_url: str | None = None) -> dict:
    """
    Fetch email settings from the Email microservice.
    """
    base_url = base_url or os.getenv("EMAIL_SERVICE_URL", "http://localhost:3002")
    url = f"{base_url}/{user_id}/settings"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=5.0)
            resp.raise_for_status()
            return resp.json()
        except (httpx.RequestError, httpx.HTTPStatusError) as e:
            print(f"Email service error: {e}")
            return {}  # Fallback
