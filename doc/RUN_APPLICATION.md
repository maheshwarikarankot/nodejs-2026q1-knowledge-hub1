# Run Order For Knowledge Hub API

This guide combines the required flow from `.doc1` (Docker foundation) and `.doc2` (Prisma + PostgreSQL).

## Prerequisites

- Node.js `24.10.0+` (project requires `>=24.10.0 <25`)
- Podman + `podman-compose` (or Docker + `docker-compose`)

## 1. One-time setup

1. Install dependencies:

```bash
npm ci
```

2. Create `.env` from `.env.example` if needed:

```bash
cp .env.example .env
```

3. Confirm important values in `.env`:

- `PORT=4000`
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `DATABASE_URL=postgresql://...@localhost:5440/...`
- `DATABASE_URL_DOCKER=postgresql://...@db:5432/...`

Required connection examples from `.doc2`:
- local app + docker db: `postgresql://user:password@localhost:5432/knowledge_hub?schema=public`
- docker app + docker db: `postgresql://user:password@db:5432/knowledge_hub?schema=public`

Note:
- Host tools (Prisma CLI, local scripts) use `localhost:5440`.
- Containers communicate with DB using service name `db:5432`.
- In this repository, host-to-DB mapping is `localhost:5440` because `docker-compose.yml` maps `5440:5432`.

## Prisma migration commands (`dev` vs `deploy`)

- `npx prisma migrate dev`
	- Use in local development when you are changing `prisma/schema.prisma`.
	- Can create new migration files and apply them.
	- Run Mode: **A (Local app + docker db)**.

- `npx prisma migrate deploy`
	- Use in container/CI/runtime flows to apply already committed migrations only.
	- Non-interactive, does not create new migration files.
	- Run Mode: **B (Docker app + docker db)**.

## 2. Run Mode A: Local app + docker db

Connection string from `.doc2`:
- `postgresql://user:password@localhost:5432/knowledge_hub?schema=public`

Repository-specific note:
- This repository maps DB as `5440:5432`, so use `localhost:5440` for host-side connections.

Steps:

1. Start only the database container:

```bash
podman-compose up -d db
```

Docker alternative:

```bash
docker-compose up -d db
```

2. Ensure `.env` points host Prisma/app to local DB port:

- `DATABASE_URL=postgresql://<user>:<password>@localhost:5440/<db>?schema=public`

3. Apply migrations:

```bash
npx prisma migrate dev
```

4. Generate Prisma Client:

```bash
npx prisma generate
```

5. Seed database:

```bash
npx prisma db seed
```

6. Run app locally:

```bash
npm run start
```

7. Verify API:

```bash
curl http://localhost:4000/
```

## 3. Run Mode B: Docker app + docker db

Connection string from `.doc2`:
- `postgresql://user:password@db:5432/knowledge_hub?schema=public`

Steps:

1. Ensure `.env` has container connection for app service:

- `DATABASE_URL_DOCKER=postgresql://<user>:<password>@db:5432/<db>?schema=public`

2. Build and start full stack:

```bash
podman-compose up --build
```

Docker alternative:

```bash
docker-compose up --build
```

3. Apply committed migrations (recommended for containerized runtime):

```bash
npx prisma migrate deploy
```

4. If you intentionally changed `prisma/schema.prisma` and need a new migration file, run:

```bash
npx prisma migrate dev
```

5. Seed database:

```bash
npx prisma db seed
```

6. Verify API:

```bash
curl http://localhost:4000/
```

## 4. Daily run (after initial setup)

1. Full docker mode:

```bash
podman-compose up
```

2. Rebuild when Dockerfile or dependencies changed:

```bash
podman-compose up --build
```

3. Local app mode (db only in docker):

```bash
podman-compose up -d db
npm run start
```

## 5. Optional debug tools

1. Start Adminer profile:

```bash
podman-compose --profile debug up
```

2. Open Adminer at `http://localhost:8080`.

## 6. Stop and cleanup

1. Stop services:

```bash
podman-compose down
```

2. Stop and remove volumes (full DB reset):

```bash
podman-compose down -v
```

## 7. Quick health checks

- Running containers:

```bash
podman ps
```

- App logs:

```bash
podman logs nodejs-2026q1-knowledge-hub1_app_1
```

- DB logs:

```bash
podman logs nodejs-2026q1-knowledge-hub1_db_1
```
