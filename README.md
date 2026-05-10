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

---

## RAG Integration (Assignment 10)

The API is extended with a **Retrieval-Augmented Generation (RAG)** layer that lets users search and chat with content stored in the Knowledge Hub database, powered by **Google Gemini** and **Qdrant** vector database.

---

### 1. How to obtain a Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click **Get API key** → **Create API key in new project** (or select an existing project)
4. Copy the generated key
5. Open your local `.env` file and set:
   ```dotenv
   GEMINI_API_KEY=<paste-your-key-here>
   ```

The key is free for personal use under Google's [free-tier limits](https://ai.google.dev/pricing).

---

### 2. Gemini models used

| Purpose | Model | Notes |
|---------|-------|-------|
| **Text generation** (RAG answers, chat) | `gemini-2.0-flash` | Controlled via `GEMINI_MODEL` env var |
| **Text embeddings** (indexing + search) | `text-embedding-004` | Produces 768-dimensional vectors; controlled via `GEMINI_EMBEDDING_MODEL` env var |

Both are available on the Gemini free tier.

---

### 3. Vector database — Qdrant

**[Qdrant](https://qdrant.tech/)** is an open-source, high-performance vector search engine. It runs as a dedicated container in the same Docker Compose environment as the app and PostgreSQL.

#### Running with Docker Compose

```bash
# Start all services (app + PostgreSQL + Qdrant)
docker-compose up --build

# Or with the dev profile (runs migrations + seed first)
docker-compose --profile dev up --build
```

The `vectordb` service in `docker-compose.yml`:

```yaml
vectordb:
  image: qdrant/qdrant:v1.9.2
  ports:
    - "6333:6333"          # REST API (browser UI also available here)
  volumes:
    - khub1api_vector-data:/qdrant/storage   # persistent vector data
  healthcheck:
    test: ["CMD-SHELL", "wget -qO- http://localhost:6333/healthz || exit 1"]
```

The `app` service waits for Qdrant to be healthy before starting (`depends_on: vectordb: condition: service_healthy`).

Qdrant dashboard is available at **http://localhost:6333/dashboard** when running locally.

---

### 4. Full startup flow after cloning

#### Step 1 — Install dependencies

```bash
npm install
```

#### Step 2 — Configure environment

```bash
cp .env.example .env
```

Open `.env` and set at minimum:

```dotenv
# Your Gemini API key
GEMINI_API_KEY=your-gemini-api-key

# PostgreSQL (keep defaults or adjust to your setup)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=khub1db

# RAG — Qdrant runs on localhost when not using Docker Compose
RAG_VECTOR_DB_URL=http://localhost:6333
RAG_VECTOR_COLLECTION=knowledge_hub_articles
RAG_CHUNK_SIZE=800
RAG_CHUNK_OVERLAP=200
RAG_CONVERSATION_MAX_MESSAGES=20
```

> When running via Docker Compose, `RAG_VECTOR_DB_URL` is automatically overridden to `http://vectordb:6333` by the `environment:` block — no manual change needed.

#### Step 3 — Start with Docker Compose (recommended)

```bash
docker-compose --profile dev up --build
```

This starts PostgreSQL, Qdrant, and the API (with migrations + seed applied automatically).

#### Alternative — run locally without Docker

```bash
# Start Qdrant standalone
docker run -p 6333:6333 qdrant/qdrant:v1.9.2

# Apply DB migrations and seed
npx prisma migrate deploy
npx prisma db seed

# Start the API
npm start
```

#### Step 4 — Build the vector index

After the app is running, call the index endpoint to embed and store all published articles:

```bash
# Get a token first
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"admin123"}' | jq -r '.accessToken')

# Build the index (published articles only)
curl -s -X POST http://localhost:4000/ai/rag/index \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"onlyPublished": true}' | jq
```

Expected response:

```json
{
  "indexedArticles": 3,
  "indexedChunks": 12,
  "vectorCollection": "knowledge_hub_articles"
}
```

#### Step 5 — Sample RAG requests

**Semantic search:**

```bash
curl -s -X POST http://localhost:4000/ai/rag/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "Docker containerization best practices", "limit": 3}' | jq
```

**Chat (single turn):**

```bash
curl -s -X POST http://localhost:4000/ai/rag/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Docker and why should I use it?"}' | jq
```

**Chat (multi-turn — continue the conversation):**

```bash
# Save the conversationId from the previous response
CONV_ID="<conversationId from previous response>"

curl -s -X POST http://localhost:4000/ai/rag/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"Can you give a concrete example?\", \"conversationId\": \"$CONV_ID\"}" | jq
```

**Delete an article from the index:**

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X DELETE http://localhost:4000/ai/rag/index/articles/<articleId> \
  -H "Authorization: Bearer $TOKEN"
# Returns 204 on success, 404 if not indexed
```

**View conversation history:**

```bash
curl -s http://localhost:4000/ai/rag/chat/$CONV_ID/history \
  -H "Authorization: Bearer $TOKEN" | jq
```

#### RAG endpoints reference

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/ai/rag/index` | Build or refresh vector index from articles |
| POST | `/ai/rag/search` | Semantic search with optional status/category/tag filters |
| POST | `/ai/rag/chat` | Ask a question grounded in Knowledge Hub articles |
| DELETE | `/ai/rag/index/articles/:id` | Remove article vectors from the index |
| GET | `/ai/rag/chat/:conversationId/history` | Retrieve conversation message history |

---

### 5. Known limitations

| Limitation | Detail |
|------------|--------|
| **Gemini free-tier embedding quota** | `text-embedding-004` allows ~1 500 requests/minute on the free tier. Indexing large article sets may hit rate limits; the service retries up to 3× with exponential backoff |
| **Gemini free-tier generation quota** | `gemini-2.0-flash` allows ~15 RPM on the free tier. Heavy concurrent chat use will return `503` after retries |
| **Indexing time** | Each article chunk requires one Gemini embedding API call (sequential). 10 articles × 2 chunks each = ~20 API calls; expect 10–30 seconds for a full reindex |
| **In-memory conversation store** | Conversations are stored in RAM — they are lost on server restart. Not suitable for production multi-instance deployments |
| **In-memory RAG does not invalidate on article update** | The vector index is not automatically refreshed when an article is edited. Call `POST /ai/rag/index` or `DELETE /ai/rag/index/articles/:id` manually after changes |
| **Latency** | Cold Gemini API responses take 1–5 seconds. A chat turn (embed + search + generate) typically takes 3–8 seconds end-to-end |
| **Regional availability** | The Gemini API may be unavailable or restricted in certain regions. Use a VPN if you receive persistent `403` errors |
| **Vector collection size** | Qdrant free local instance has no hard limit, but very large collections (100 k+ vectors) may require tuning `HNSW` indexing parameters |
