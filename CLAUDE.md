# Instructions for Claude Code — Triage (decision-maker website)

Read this file, `README.md` and `references/unit-02-and-03-lecture-notes.md` before changing anything.

## What this is
A single-page, browser-only website that helps decide what to do with a task. The user types a task and answers three Yes/No questions — **urgent? important to you? more than 5 minutes?** — and gets one of eight recommendations (plus a "does it happen regularly?" follow-up for urgent + not important + long). Tasks collect into six groups: Do now, Attend to soon, Schedule it, Interruption buffer, After important work, Brief breaks.

Source of the rule: course *Take Charge of Your Time*, Module 1, Unit 2 (see `references/`). The rule lives in `src/lib/triage.ts`; group mapping and storage in `src/lib/tasks.ts`.

## Decisions already made by the owner (don't re-ask)
- It is a **website**, not an installable app/PWA. No service worker.
- **No accounts, no backend, no sync.** The list is saved in `localStorage` (`triage.tasks.v1`) on each device only.
- No hourly time-logging, insights or charts — that earlier product was dropped.
- Exactly 5 minutes counts as short (≤ 5). The definitions of urgent/important are the user's own; never auto-classify tasks.
- No scores, streaks, guilt language or notifications. Calm, Apple-inspired utility look (system fonts, restrained blue `#3567E8`, hairline borders, tokens in `src/index.css`).

## Rules for working here
- Keep `src/lib/` pure and tested; UI in `src/App.tsx` and `src/components/`.
- Before saying something works, run: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e` (first time: `npx playwright install chromium webkit`).
- Check layouts at 320, 390, 768 and 1440 px — no sideways scrolling, tap targets ≥ 44 px.
- **Never deploy or publish without the owner's explicit approval.** Never put secrets in the repo (none are needed).

## Commands
| | |
|---|---|
| `npm install` | install |
| `npm run dev` | local dev server |
| `npm run build` | static build → `dist/` (host anywhere: Vercel, Netlify, Cloudflare Pages, GitHub Pages) |
| `npm run build:standalone` | one self-contained file → `standalone/triage.html` (opens by double-click, no server) |
| `npm test` / `npm run test:e2e` / `npm run screenshots` | unit / browser tests / regenerate `qa/screenshots/` |

## Status at handoff (18 Nov 2026)
Typecheck + lint clean; 26 unit tests and 36 browser tests pass (mobile Chromium, mobile WebKit, desktop Chromium, incl. axe accessibility and the file:// standalone build). Not deployed; not yet tried on a physical phone.
