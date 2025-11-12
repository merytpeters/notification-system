"""External Microservices"""

import httpx
import os

USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://localhost:3001")


async def get_user(user_id: str) -> dict:
    """
    Fetch user data from the User microservice.
    """
    if not USER_SERVICE_URL:
        raise RuntimeError("USER_SERVICE_URL is not set")

    url = f"{USER_SERVICE_URL}/{user_id}"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=5.0)
            resp.raise_for_status()
            return resp.json()
        except httpx.RequestError as e:
            print(f"Error connecting to User service: {e}")
            return {"name": "John Doe", "email": "john@example.com"}
        except httpx.HTTPStatusError as e:
            print(f"User service returned an error: {e.response.status_code}")
            return {"name": "John Doe", "email": "john@example.com"}  # fallback


# Email service
EMAIL_SERVICE_URL = os.getenv("EMAIL_SERVICE_URL", "http://localhost:3002")


async def get_email_settings(user_id: str) -> dict:
    """Fetch email settings from the Email microservice."""
    if not EMAIL_SERVICE_URL:
        raise RuntimeError("EMAIL_SERVICE_URL is not set")
    url = f"{EMAIL_SERVICE_URL}/{user_id}/settings"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=5.0)
            resp.raise_for_status()
            return resp.json()
        except httpx.RequestError:
            return {}  # fallback
        except httpx.HTTPStatusError:
            return {}  # fallback
