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
