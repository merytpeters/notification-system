# Template Service

## Overview

The Template Service manages, stores, and renders notification templates used across the notification system. It provides a single place to author and version templates, perform safe variable substitution, and return fully-rendered content for different channels (email, push, SMS).

Primary consumers include the API Gateway, Email Service, and Push Notification Service — they call the Template Service to obtain rendered message content before sending notifications.

Code & where to find it

- Service code: `template-service/` — contains the Python package (`app/`), `requirements.txt`, `.env.example`, and `Dockerfile`.
- Developer docs: `docs/template-service.md` (this file).

## Key responsibilities

- Store templates (versioned and localized)
- Render templates with safe variable substitution and simple logic
- Provide a small, well-documented REST API for retrieving and previewing templates
- Cache rendered templates for performance
- Validate template variables and provide helpful errors for missing/invalid data

## Core technologies

- FastAPI — HTTP API and request validation
- Pydantic — request/response schema typing and validation
- PostgreSQL (hosted via Xata in this project) — persistent template storage
- Redis — caching rendered templates and improving read latency
- Docker — containerization for development and production

## Project structure

- app/ — Python package containing application code (FastAPI app, routes, models, services)
- requirements.txt — runtime Python dependencies
- Dockerfile — image build for containerized deployment

Adjust paths above if your layout differs.

## Local development & venv setup

We recommend running the service inside a Python virtual environment to keep dependencies isolated.

From the `template-service` folder (macOS / Linux, zsh):

```bash
# create a venv in the service folder
python3 -m venv .venv

# activate it
source .venv/bin/activate

# upgrade pip and install runtime dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

Running with Redis

The app initializes and pings Redis during startup (see `app/core/redis_manager.py`). If Redis is not available the startup may fail (or you may choose to run in a degraded mode). You can run Redis locally in one of two easy ways:

- Run the system Redis (macOS/brew):

  ```bash
  # install once if needed
  brew install redis

  # run Redis server in a separate terminal
  redis-server /usr/local/etc/redis.conf
  ```

- Or run Redis with Docker (recommended for isolation):

  ```bash
  docker run --rm -p 6379:6379 --name redis-local redis:7-alpine
  ```

After you have a Redis server running, set the Redis environment variables in `.env` (copy from `.env.example`):

```env
TEMPLATE_DATABASE_URL="postgres://user:pass@localhost:5432/template_db"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
```

Notes:

- If you run Redis in Docker but run the app in a container too, use the Docker network service name (for example `redis` if defined in docker-compose) rather than `localhost`.
- The app's lifespan will call `init_redis()` and then `get_redis()` which will perform a ping; if the ping fails the lifespan will raise and the app may exit. For development you can either ensure Redis is running before starting the app, or edit the lifespan to continue in degraded mode.


## Runtime / entrypoint

This service is a FastAPI app. In development you typically run with Uvicorn:

- uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

## Configuration (recommended environment variables)
- TEMPLATE_DATABASE_URL — Postgres connection string (Xata-provided or self-hosted)


## Healthchecks & readiness

- Expose a `/health` endpoint that checks:
  - app is running
  - DB reachable
  - Redis reachable (optionally)


## Containerization / Docker notes

- The project includes a `Dockerfile` that builds a slim Python image, installs dependencies in a virtualenv, and runs the service as a module by default.

Build and run locally:

```bash
cd template-service
docker build -t template-service:dev .
docker run --rm -p 8000:8000 \
  -e TEMPLATE_DATABASE_URL="postgres://..." \
  -e REDIS_URL="redis://..." \
  template-service:dev
```

Formatting

- We use Black to enforce consistent Python formatting. From the repository root you can run:

  - Check formatting without changing files:

    ```bash
    black --check template-service
    ```

  - Auto-format files in-place:

    ```bash
    black template-service
    ```

  It's recommended to install Black in your dev environment (pip install black) or add it to a `dev-requirements.txt`. For pre-commit integration, add Black to your `.pre-commit-config.yaml` so commits are auto-formatted.


## Contributing

- Follow repository coding standards. Add tests for any template rendering or validation logic you change.

## Where to look next

- `template-service/app` — application code and routes
- `template-service/requirements.txt` — Python dependencies
- `template-service/Dockerfile` — container build

## API Endpoints

This document lists the primary API endpoints exposed by the Template Service and notes that FastAPI serves interactive OpenAPI at `/docs`.

The service mounts its router under the prefix `/api/v1/templates`.

Primary endpoints (full paths):

- GET /api/v1/templates/ — list all templates (200)
- POST /api/v1/templates/ — create a new template + initial version (201)
- DELETE /api/v1/templates/ — delete all templates (204)
- GET /api/v1/templates/{template_id} — get a single template and its versions (200)
- PATCH /api/v1/templates/{template_id} — partially update a template (200)
- PUT /api/v1/templates/{template_id} — fully update a template (200)
- DELETE /api/v1/templates/{template_id} — delete a template and all its versions (204)
- POST /api/v1/templates/{template_id}/versions — create a new version for a template (201)
- GET /api/v1/templates/type/{template_type} — list templates by type (email, push, etc.) (200)
- GET /api/v1/templates/{template_id}/{version_number} — get a specific version (200)
- PATCH /api/v1/templates/{template_id}/versions/{version_number} — update a specific version (200)
- DELETE /api/v1/templates/templates/{template_id}/versions/{version_number} — delete a version by number (204)
  - Note: the implementation contains an extra `templates` segment for this route, so the effective full path is `/api/v1/templates/templates/{template_id}/versions/{version_number}`.
- GET /api/v1/templates/preview/{template_id}/{user_id} — render an HTML preview for a template (returns Jinja2-rendered HTML)

Other useful endpoints:

- GET /health — basic healthcheck used by orchestration and load balancers
- GET /docs — interactive OpenAPI UI (Swagger)
- GET /openapi.json — raw OpenAPI JSON spec

Quick examples

- List templates (curl):

  ```bash
  curl -sS http://localhost:8000/api/v1/templates/ | jq '.'
  ```

- Preview template in a browser (returns rendered HTML):

  Visit `http://localhost:8000/api/v1/templates/preview/<template_id>/<user_id>` in your browser or use curl:

  ```bash
  curl -i http://localhost:8000/api/v1/templates/preview/<template_id>/<user_id>
  ```

Notes

- Open `http://localhost:8000/docs` while the service is running to inspect exact request/response models and try operations interactively.