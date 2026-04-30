# Docker Setup

This project includes a two-service Docker setup:
- `backend`: Laravel API (PHP 8.3 + SQLite)
- `frontend`: Next.js dashboard

## Prerequisites

- Docker Engine
- Docker Compose plugin (`docker compose`)

## Start

From the repository root:

```bash
docker compose up --build
```

App URLs:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api`

## Host On Local Network (LAN)

If you want other devices on the same network to access the app, start Docker Compose with your machine IP as `HOST_IP`:

```bash
HOST_IP=$(hostname -I | awk '{print $1}') docker compose up --build
```

Then open from another device:
- Frontend: `http://<HOST_IP>:3000`
- Backend API: `http://<HOST_IP>:8000/api`

Example:
- Frontend: `http://192.168.1.25:3000`
- Backend API: `http://192.168.1.25:8000/api`

## Stop

```bash
docker compose down
```

## Reset containers and volumes

```bash
docker compose down -v
```

## Notes

- Backend uses SQLite at `backend/database/database.sqlite`.
- On startup, backend container will:
  - create `.env` from `.env.example` if missing
  - create SQLite database file if missing
  - run `composer install`
  - run migrations
  - start Laravel server on `0.0.0.0:8000`
- On startup, frontend container runs `npm install` and `next dev`.
- Frontend is configured with:
  - server-side API base: `http://backend:8000/api`
  - browser API base: `http://${HOST_IP:-localhost}:8000/api`

## Useful commands

Run backend artisan command:

```bash
docker compose exec backend php artisan route:list
```

Open backend shell:

```bash
docker compose exec backend sh
```

Open frontend shell:

```bash
docker compose exec frontend sh
```
