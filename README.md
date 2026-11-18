# Triage — decide what to do next

A small, single-page website. Type a task, answer three Yes/No questions — **Is it urgent? Is it important to you? Will it take more than 5 minutes?** — and get one of eight clear recommendations. Tasks collect into a sorted list:

| Group | Cases |
|---|---|
| Do now | important & short · urgent & short · urgent + important & short |
| Attend to soon | urgent + important, more than 5 min |
| Schedule it | important, not urgent, more than 5 min |
| Interruption buffer | urgent, not important, more than 5 min, **recurring** |
| After important work | urgent, not important, more than 5 min, occasional · neither, more than 5 min |
| Brief breaks | neither urgent nor important, 5 min or less |

The rule comes from the course *Take Charge of Your Time*, Module 1 (Unit 2: the eight combinations). Exactly 5 minutes counts as short. The full table is on the page under “How it decides”.

**Privacy:** no accounts, no server, no tracking. The list is stored in your browser (`localStorage`) and stays on that device. Clearing site data deletes it.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

| Script | What it does |
|---|---|
| `npm run build` | Typecheck + static build to `dist/` |
| `npm run preview` | Serve the build locally |
| `npm run typecheck` / `npm run lint` | TypeScript / ESLint |
| `npm test` | Vitest: all 8 cases, recurring branch, groups, storage parsing (26 tests) |
| `npm run test:e2e` | Playwright on mobile Chromium, mobile WebKit (iPhone 14), desktop Chromium: adding all 8 cases, persistence, edit/done/delete/undo, validation, keyboard, layout 320–1440 px, axe accessibility |
| `npm run screenshots` | Regenerates `qa/screenshots/` |
| `npm run build:standalone` | One self-contained `standalone/triage.html` you can open by double-click (no server, no install) |

First Playwright run: `npx playwright install chromium webkit`.

## Status (18 Nov 2026)

- typecheck, lint: clean · unit: 26 passed · E2E: 36 passed (incl. the standalone file), skipped by design: layout sweep, keyboard and standalone tests run once per engine
- Not deployed. Not yet tried on a physical phone.
- Each device keeps its own list (no sync, by choice).

## Hosting (only after you approve)

It's a plain static site — any static host works, no environment variables needed. On Vercel: push this folder to a Git repo you own → New Project → import (Vite preset; `vercel.json` sets the build and security headers) → Deploy. Netlify, Cloudflare Pages or GitHub Pages work the same way with build `npm run build`, output `dist`.

## Files

```
src/App.tsx            page: form, live recommendation, grouped list, “How it decides”
src/lib/triage.ts      the eight-case rule (pure, tested)
src/lib/tasks.ts       groups, recurring rule, localStorage load/save
src/components/        Button, Yes/No control, text input, toast
tests/unit, tests/e2e  Vitest and Playwright
```
