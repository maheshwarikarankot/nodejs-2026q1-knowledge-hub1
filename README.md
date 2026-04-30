# Knowledge Hub API

## Description

Task is to create a REST API for a Knowledge Hub platform using the Nest.js framework. The Knowledge Hub allows users to create, edit, and organize articles by categories and tags.

This repository contains a working implementation of that assignment.

The API manages:

- users
- categories
- articles
- comments

The project includes request validation, Swagger API docs, and automated unit/e2e tests.

## Prerequisites

- Git - [Download & Install Git](https://git-scm.com/downloads).
- Node.js - [Download & Install Node.js](https://nodejs.org/en/download/) and the npm package manager.

## Downloading

```bash
git clone https://github.com/maheshwarikarankot/nodejs-2026q1-knowledge-hub1.git
cd nodejs-2026q1-knowledge-hub1
```

## Installing NPM modules

```
npm install
```

## Running application

```
npm start
```

After starting the app on port (4000 as default) you can open
in your browser OpenAPI documentation by typing http://localhost:4000/doc/.
For more information about OpenAPI/Swagger please visit https://swagger.io/.

## Project Modules

- `user`: user CRUD + password update
- `category`: category CRUD
- `article`: article CRUD + filtering/pagination
- `comment`: comment CRUD for article discussion

## Core API Endpoints

Base URL:

```text
http://localhost:<PORT>
```

### Users

- `POST /user`
- `GET /user`
- `GET /user/:id`
- `PUT /user/:id` (update password)
- `DELETE /user/:id`

Create user example:

```bash
curl -X POST http://localhost:<PORT>/user \
	-H "Content-Type: application/json" \
	-d '{
		"login": "john",
		"password": "secret123",
		"role": "admin"
	}'
```

### Categories

- `POST /category`
- `GET /category`
- `GET /category/:id`
- `PUT /category/:id`
- `DELETE /category/:id`

Create category example:

```bash
curl -X POST http://localhost:<PORT>/category \
	-H "Content-Type: application/json" \
	-d '{
		"name": "Tech",
		"description": "Technology articles"
	}'
```

### Articles

- `POST /article`
- `GET /article`
- `GET /article/:id`
- `PUT /article/:id`
- `DELETE /article/:id`

Supported query params for `GET /article`:

- `status` (`draft|published|archived`)
- `categoryId`
- `tag`
- `page`
- `limit`
- `sortBy`
- `order` (`asc|desc`)

Create article example:

```bash
curl -X POST http://localhost:<PORT>/article \
	-H "Content-Type: application/json" \
	-d '{
		"title": "Understanding Node.js Streams and Buffers",
		"content": "Streams allow you to process data chunk by chunk...",
		"status": "published",
		"tags": ["nodejs", "streams", "performance"]
	}'
```

### Comments

- `POST /comment`
- `GET /comment?articleId=<UUID>`
- `DELETE /comment/:id`

Create comment example:

```bash
curl -X POST http://localhost:<PORT>/comment \
	-H "Content-Type: application/json" \
	-d '{
		"content": "Great article!",
		"articleId": "550e8400-e29b-41d4-a716-446655440000"
	}'
```

## Validation Behavior

- Global validation is enabled with `ValidationPipe`.
- Unknown fields are stripped (`whitelist: true`).
- Invalid payloads return `400 Bad Request`.
- Some domain-specific checks return `422 Unprocessable Entity` (for example, commenting on a non-existing article).

## Data Storage Note

The current implementation uses Prisma with PostgreSQL. Data is persisted in the configured database instead of in-memory service arrays.

## Prisma Hints

Helpful commands and patterns for working on this project:

- Run `npx prisma generate` after Prisma schema changes so the client types stay in sync.
- Use `npx prisma studio` to inspect and edit database records during development.
- Use `npx prisma migrate reset` when you need to reset the database, re-apply migrations, and run the seed again.
- Prefer `include` and `select` in Prisma queries to avoid over-fetching related data.
- Use `prisma.$transaction` for multi-step write operations that must succeed or fail together.

## Testing

After application running open new terminal and enter:

To run all tests without authorization

```
npm run test
```

To run only one of all test suites

```
npm run test -- <path to suite>
```

To run all test with authorization

```
npm run test:auth
```

To run only specific test suite with authorization

```
npm run test:auth -- <path to suite>
```

To run refresh token tests

```
npm run test:refresh
```

To run RBAC (role-based access control) tests

```
npm run test:rbac
```

### Auto-fix and format

```
npm run lint
```

```
npm run format
```

### Debugging in VSCode

Press <kbd>F5</kbd> to debug.

For more information, visit: https://code.visualstudio.com/docs/editor/debugging

## Containerization and Docker Setup (Assignment 06a Foundation)

This project includes a complete Docker-based runtime setup for the Knowledge Hub API with PostgreSQL, using a multi-container architecture.

### Implemented requirements

- TypeScript application runtime in Docker
- Node.js `24.x` base image (`node:24-alpine`)
- Multi-stage Docker build
- Non-root container user in production image
- PostgreSQL container with persistent storage
- Optional Adminer service for local debugging
- Custom bridge network for inter-service communication
- Container health checks and restart policies

### `.dockerignore`

The repository includes `.dockerignore` to reduce image build context and avoid copying unnecessary or sensitive files:

```text
node_modules
.git
logs/
*.log
.env
dist/
.vscode/
.idea/
```

Additional local artifacts are also ignored (`.DS_Store`, `npm-debug.log`, `.trivy-cache`).

### Dockerfile

The project Dockerfile (`dockerfile`) uses a multi-stage strategy:

1. `builder` stage:
- installs all dependencies
- runs `prisma generate`
- compiles TypeScript (`npm run build`)
- prunes dev dependencies

2. production stage:
- starts from `node:24-alpine`
- copies compiled `dist/` output
- copies production-ready `node_modules/` from builder stage
- sets `NODE_ENV=production`
- runs as a non-root user
- exposes app port and starts API with `node dist/main.js`

### `docker-compose.yml`

The Compose file defines the following services:

- `app`:
- built from local Dockerfile
- depends on healthy `db`
- loads env vars from `.env`
- maps API port (`${PORT:-4000}`)
- has health check on `http://localhost:<PORT>/`
- restart policy: `on-failure`

- `db` (`postgres:16-alpine`):
- uses `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- maps host `5440` to container `5432`
- uses named volume `khub1api_db-data`
- health check via `pg_isready`
- restart policy: `unless-stopped`

- `adminer` (optional):
- uses official `adminer` image
- available via Compose profile `debug`
- mapped to `8080:8080`
- connected to same network as `db`

Infrastructure:

- custom network: `kb-network` (bridge)
- named volume: `khub1api_db-data`

### Environment configuration

Database-related variables are included in `.env.example`:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_HOST` (default: `db`)
- `POSTGRES_PORT` (default: `5432`)
- `DATABASE_URL` / `DATABASE_URL_DOCKER` include `connection_limit` and `pool_timeout` for connection pooling

Note: `.env` is ignored and must not be committed.

### How to run

Build and start all required containers:

```bash
docker-compose up --build
```

Evaluator note (profile-based init job behavior):

- Production-like run (skip automatic seeding):

```bash
podman-compose up --build
```

- Development run (run one-shot `migrate-seed` job before app):

```bash
podman-compose --profile dev up --build
```

- CI run (run one-shot `migrate-seed` job before app):

```bash
podman-compose --profile ci up --build
```

If `docker-compose up --build -d` fails with `bind: address already in use`, free port `4000` first or set a different `PORT` in `.env`.

Run with Adminer enabled:

```bash
docker-compose --profile debug up --build
```

After startup, expected state:

- `app` container is healthy and responds on API port
- `db` container is healthy
- services communicate through `kb-network`

### Security scanning

Image vulnerability scanning was performed with Trivy.

Example command:

```bash
trivy image <image-name>
```

Scan artifacts are present in this repository:

- `trivy-report.json`
- `trivy-report.sarif`
- `trivy-scan-report.txt`
- `trivy-summary.txt`

Current app image size evidence (local):

- `localhost/mahikarankot/khub1_api:latest` -> `242 MB` (below the `500 MB` target)

### Docker Hub image

Application image has been pushed to Docker Hub:

- https://hub.docker.com/r/mahikarankot/khub1_api


Example pull command:

```bash
docker pull mahikarankot/khub1_api:latest
```
