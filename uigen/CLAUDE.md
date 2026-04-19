# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Setup (first time)
npm run setup          # install deps, generate Prisma client, run migrations

# Development
npm run dev            # Next.js dev server with Turbopack
npm run dev:daemon     # dev server in background (logs to logs.txt)

# Production
npm run build
npm run start

# Code quality
npm run lint           # ESLint

# Testing
npm run test           # Vitest (all tests)

# Database
npm run db:reset       # Reset SQLite database (destructive)
```

To run a single test file: `npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx`

## Environment

Copy `.env` and set:
- `ANTHROPIC_API_KEY` — Claude API key (optional; falls back to a mock model that returns static responses)
- `JWT_SECRET` — session signing key (defaults to `"development-secret-key"` if unset)

## Architecture

UIGen is a Next.js 15 app where users describe React components in a chat interface and Claude generates them with live preview.

### Data flow

1. User types a prompt → `ChatProvider` (`/lib/contexts/chat-context.tsx`) calls `POST /api/chat`
2. `/api/chat/route.ts` streams a response from Claude (claude-haiku-4-5 via Vercel AI SDK) with two tools: `str_replace_editor` and `file_manager`
3. Tool calls are returned to the client mid-stream; `FileSystemProvider` (`/lib/contexts/file-system-context.tsx`) applies them to the in-memory `VirtualFileSystem`
4. `PreviewFrame` (`/components/preview/PreviewFrame.tsx`) detects file changes, transpiles JSX via Babel (`/lib/transform/jsx-transformer.ts`), and renders the result inside an `<iframe>`
5. On stream completion, the project (messages + serialized file system) is saved to SQLite via Prisma

### Virtual file system

`VirtualFileSystem` (`/lib/file-system.ts`) is an in-memory tree — no files are ever written to disk. Claude always creates `/App.jsx` as the entry point. Files use the `@/` import alias to reference each other.

### AI tools

- `str_replace_editor` (`/lib/tools/str-replace.ts`) — view, create, and edit files (str_replace / insert operations)
- `file_manager` (`/lib/tools/file-manager.ts`) — rename and delete files

The system prompt lives in `/lib/prompts/generation.tsx` and instructs Claude to use Tailwind CSS (no inline styles), keep `/App.jsx` as the entry, and import custom files with `@/`.

### Model provider

`/lib/provider.ts` returns either the real Anthropic model or a `MockLanguageModel` (static demo responses) when `ANTHROPIC_API_KEY` is absent. The mock implements `LanguageModelV1` from the AI SDK.

### Database schema

Defined in `prisma/schema.prisma` — always reference it to understand stored data structures. Two models:

- **`User`** — `id` (cuid), `email` (unique), `password` (bcrypt hash), timestamps, relation to projects
- **`Project`** — `id` (cuid), `name`, `userId` (nullable for anonymous projects), `messages` (JSON string), `data` (serialized `VirtualFileSystem` JSON string), timestamps

### Auth

JWT sessions stored in httpOnly cookies (7-day expiry, bcrypt password hashing). `src/middleware.ts` protects `/api/projects` and `/api/filesystem`. Projects can be anonymous (`userId: null`).

### Key directories

| Path | Purpose |
|------|---------|
| `src/app/api/chat/` | Streaming Claude endpoint |
| `src/lib/contexts/` | `ChatProvider` + `FileSystemProvider` |
| `src/lib/tools/` | AI tool definitions |
| `src/lib/prompts/` | Claude system prompt |
| `src/lib/transform/` | JSX → runnable JS (Babel) |
| `src/components/preview/` | iframe-based live preview |
| `src/components/editor/` | Monaco editor wrapper |
| `src/actions/` | Server actions (auth, project CRUD) |
| `prisma/` | SQLite schema (`User`, `Project`) |
