# PortreAI frontend

Next.js gallery for importing and reviewing portrait photos. Clerk auth, shadcn/ui, TanStack Query.

The API lives in the sibling `backend/` app (http://localhost:4000).

## Setup

```bash
cp .env.example .env.local
```

Fill Clerk keys and `NEXT_PUBLIC_API_URL`. Then:

```bash
pnpm install
pnpm dev
```

App: http://localhost:3000

In Clerk, set sign-in/sign-up to `/sign-in` and `/sign-up`, and allow `http://localhost:3000`.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Next.js on port 3000 |
| `pnpm lint` / `pnpm typecheck` | Quality checks |
