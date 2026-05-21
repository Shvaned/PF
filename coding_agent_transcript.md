# Coding Agent Session — PrepFit

## Problem Context

PrepFit is a Next.js 16 SaaS app (AI-powered interview preparation) deployed on Vercel. The app initially used SQLite via `prisma-adapter-sqlite` for local development. This setup worked locally but had two fatal problems:

1. **SQLite is incompatible with Vercel serverless** — the filesystem is ephemeral. Every cold start creates an empty database. Data disappears between requests.
2. **The Prisma client import path was broken on Vercel** — the generated client lived at a custom path (`src/generated/prisma/`) that was gitignored, and `prisma generate` never ran during the Vercel build because no `postinstall` script existed.

The production deployment was completely non-functional — users couldn't sign up, log in, or use any feature because the database layer failed at build time.

## Goal

Migrate the database from SQLite to Neon PostgreSQL (serverless-compatible) and fix the Vercel deployment so the app builds and runs in production with persistent data.

---

## Session Transcript

### Prompt 1

"PrepFit failed to deploy on Vercel. The build passes locally but fails in production. Here's the error:

```
Module not found: Can't resolve '@/generated/prisma/client'
Import map: aliased to relative './src/generated/prisma/client' inside of [project]/
```

Help diagnose why Prisma client isn't found during the Vercel build and fix the production database setup. The app uses Prisma + SQLite locally."

### Agent Response Summary

- Identified that `src/generated/prisma/` was gitignored (`.gitignore` line 43)
- Found no `postinstall` script in `package.json` to run `prisma generate`
- Diagnosed root cause: `prisma generate` never executed on Vercel, so the generated client files didn't exist
- Added `"postinstall": "prisma generate"` to `package.json` scripts
- This runs after `npm install` on Vercel, generating the Prisma client before `next build`

### What Went Wrong

The `postinstall` fix solved the missing file issue, but the SQLite database was still fundamentally broken on Vercel. The local `dev.db` file was gitignored (correctly) and Vercel's filesystem is read-only and ephemeral after build. Any data written during one request would be lost on the next cold start.

Additionally, the Prisma 7 schema still used `provider = "sqlite"` and the client initialization used `PrismaSqlite` adapter from `prisma-adapter-sqlite`, which creates a file-based database connection incompatible with serverless.

### Course Correction

Prompt: "SQLite won't work on Vercel. I need to migrate to Neon PostgreSQL. The app should use a real hosted database that persists data across serverless invocations."

### Prompt 2

"Migrate the database from SQLite to Neon PostgreSQL. I have a Neon project already set up. Use the `@prisma/adapter-neon` package for the serverless-native HTTP driver. Keep all existing functionality."

### Agent Response Summary

- Updated `prisma/schema.prisma`: changed `provider = "sqlite"` to `provider = "postgresql"`
- Switched generator from custom output to standard `prisma-client-js` pattern
- Updated `src/lib/prisma.ts`: replaced `PrismaSqlite` adapter with `PrismaNeon` from `@prisma/adapter-neon`
- Installed `@prisma/adapter-neon` and `@neondatabase/serverless`, removed `prisma-adapter-sqlite`
- Updated `prisma.config.ts` to add `directUrl` for Neon's pooled connection setup
- Updated `.env`: changed `DATABASE_URL` from `file:./dev.db` to Neon PostgreSQL connection string
- Deleted old SQLite-generated client at `src/generated/`
- Deleted old SQLite migration files
- Removed `src/generated/prisma` from `.gitignore`

### What Went Wrong — First Failure

The build failed with a TypeScript error in `prisma.config.ts`:

```
Type error: 'directUrl' does not exist in type '{ url?: string | undefined; shadowDatabaseUrl?: string | undefined; }'
```

**What happened:** Prisma 7's config type doesn't support `directUrl` in `prisma.config.ts`. The `directUrl` parameter was only valid in the legacy `schema.prisma` datasource block, and Prisma 7 had removed both `url` and `directUrl` from the schema file entirely.

**Why the agent got it wrong:** The plan assumed Prisma 7's `datasource` config section accepted the same fields as Prisma 6. But Prisma 7 had moved connection URLs out of the schema into `prisma.config.ts`, and even there, only supported `url` (not `directUrl`). The adapter-based approach in Prisma 7 passes the connection to `PrismaClient` via the `adapter` constructor parameter, not through the datasource config.

### Course Correction

Agent removed `directUrl` from `prisma.config.ts`, keeping only `url`. The adapter (`PrismaNeonHttp`) would receive the connection string directly.

### What Went Wrong — Second Failure

A new TypeScript error appeared:

```
Type error: Type 'NeonQueryFunction<false, false>' has no properties in common with type 'PoolConfig'.
```

**What happened:** The agent imported `PrismaNeon` and passed it the result of `neon(process.env.DATABASE_URL!)`. But `PrismaNeon`'s constructor expects `neon.PoolConfig` (WebSocket-based pool configuration), while `neon()` returns a `NeonQueryFunction` (HTTP query function). These are incompatible types.

**Why the agent got it wrong:** The agent read the npm package name `@prisma/adapter-neon` and `@neondatabase/serverless` and assumed the standard pattern (`neon()` → `PrismaNeon()`). But the actual type definitions revealed that `PrismaNeon` is WebSocket-based and needs a `Pool` or `PoolConfig`, while `PrismaNeonHttp` is HTTP-based and accepts a connection string directly. For Vercel serverless, `PrismaNeonHttp` is the correct choice because HTTP connections survive serverless cold starts better than WebSocket connections.

### Course Correction

Agent read the actual type definitions at `node_modules/@prisma/adapter-neon/dist/index.d.ts` and discovered:
- `PrismaNeon` — WebSocket-based, constructor takes `neon.PoolConfig`
- `PrismaNeonHttp` — HTTP-based, constructor takes `connectionString: string`

### What Went Wrong — Third Failure

Switched to `PrismaNeonHttp`, but the build failed again:

```
Type error: Expected 2 arguments, but got 1.
```

`PrismaNeonHttp` requires a second argument: `neon.HTTPQueryOptions<boolean, boolean>` (options object). The agent passed only the connection string.

### What Went Wrong — Fourth Failure

After adding `{}` as the second argument, `prisma generate` failed:

```
Error: An output path is required for the `prisma-client` generator.
```

**What happened:** Prisma 7's `prisma-client` generator ALWAYS requires the `output` path. The agent had removed `output = "../src/generated/prisma"` from the schema, thinking it would default to `node_modules/@prisma/client` like the legacy `prisma-client-js` generator. But `prisma-client` (Prisma 7's generator) requires an explicit output path.

**Why the agent got it wrong:** The plan assumed the standard `@prisma/client` import pattern, but Prisma 7's architecture requires custom output for the `prisma-client` generator. The import must point to the generated output path, not the npm package.

### Course Correction

Restored `output = "../src/generated/prisma"` in the generator block and `src/generated/prisma` in `.gitignore`. Changed the import in `src/lib/prisma.ts` back to `@/generated/prisma/client` (the custom output path). The `postinstall` script ensures `prisma generate` runs on Vercel to produce these files at build time.

### Prompt 3

"Good — `prisma generate` succeeds and the build passes. Now I've added my real Neon DATABASE_URL to `.env`. I ran `npx prisma migrate dev --name init_pg` and got:

```
Error: P1001: Can't reach database server at `ep-xxxx.us-east-2.aws.neon.tech:5432`
```

What's wrong?"

### Agent Response Summary

- Recognized the `ep-xxxx` hostname is the placeholder from `.env`, not a real Neon endpoint
- Directed user to copy their actual Neon connection string from the Neon Dashboard → Connection Details
- Confirmed the user had already done this (the `.env` had been updated with their real pooled connection string)

### Final Outcome

After the user inserted their real Neon connection string:

1. `prisma migrate dev --name init_pg` successfully created PostgreSQL tables on Neon
2. Old SQLite migration (`20260505143723_init`) was deleted, migration lock was regenerated with `provider = "postgresql"`
3. New migration `20260509131627_init_pg/migration.sql` was generated with PostgreSQL-compatible SQL
4. `npm run build` passed cleanly — 30 routes, TypeScript check, Turbopack compilation
5. Pushed to GitHub → Vercel auto-deployed successfully
6. Production database accessible via Neon SQL Editor

### Final `src/lib/prisma.ts` (simplified)

The working solution uses `PrismaNeonHttp` with HTTP-based queries (no TCP/WebSocket connections):

```ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});

export const prisma = new PrismaClient({ adapter });
```

No other file in the app needed changes — all 14+ files import `{ prisma }` from `@/lib/prisma`.

---

## Final Outcome

- **Database**: Migrated from local SQLite to Neon PostgreSQL
- **Vercel build**: Fixed — `postinstall: prisma generate` generates the Prisma client at build time
- **Data persistence**: Works across serverless cold starts via Neon's hosted PostgreSQL
- **Schema**: All 16 models preserved, zero application code changes needed beyond `prisma.ts`
- **Production**: Deployed and functional on Vercel

---

## What I Learned

**Prisma 7 has breaking changes from Prisma 6.** Connection URLs moved out of `schema.prisma`. The generator requires an explicit output path. The adapter API is different — you need to read the actual type definitions rather than guessing from package names. `PrismaNeon` (WebSocket) and `PrismaNeonHttp` (HTTP) are different classes with different constructors. For serverless, the HTTP variant is correct.

**The agent made four distinct wrong assumptions** before arriving at the working solution: (1) `directUrl` exists in Prisma 7 config types, (2) `PrismaNeon` accepts the result of `neon()`, (3) `PrismaNeonHttp` takes one argument, (4) the generator works without an output path. Each failure was caught by TypeScript or Prisma CLI, and the fix involved reading the actual library type definitions rather than trusting the agent's assumptions.

**The most valuable pattern** was reading `node_modules/@prisma/adapter-neon/dist/index.d.ts` to understand the actual constructor signatures. The agent's initial code was syntactically plausible but wrong at the type level — only the library's own type definitions could resolve the ambiguity.

**Production database migrations on serverless require thinking about connection pooling.** The `DATABASE_URL` uses a pooled Neon endpoint for the application runtime, while Prisma migrations need a direct TCP connection. In this case, `PrismaNeonHttp` uses HTTP queries (not TCP), so the pooled URL works for both runtime and migrations — a simplification that eliminated the need for a separate `DIRECT_URL`.
