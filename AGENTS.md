# Repository Guidelines

## Project Structure & Module Organization
The dashboard runs on Vite, React, and TypeScript. Feature code lives in `src/` with `components/` (reusable shadcn exports in `components/ui`), `features/` for page flows, `services/` for API adapters plus specs in `services/__tests__`, and shared constants/types in `shared/`. Bootstrapping config sits in `config/`. Supabase edge functions are versioned under `supabase/functions`. Static assets live in `public/`, Playwright specs in `e2e/` with artefacts in `e2e-results/`, and CI artefacts in `qa-logs/`.

## Build, Test, and Development Commands
- `npm run dev` starts the Vite dev server with hot reload.
- `npm run build` generates the production bundle in `dist/`; use `npm run build:dev` for readable output.
- `npm run preview` serves the built assets locally.
- `npm run lint` runs ESLint with the shared config.
- `npm run test` executes Vitest headlessly; `npm run test:ui` opens the watcher UI.
- `npm run coverage` collects V8 coverage reports.
- `npm run test:e2e` runs Playwright (install browsers once via `npm run test:install`).

## Coding Style & Naming Conventions
Stick to TypeScript-first patterns with 2-space indentation. Use `PascalCase` for React components in `*.tsx`, `camelCase` for functions and variables, and `kebab-case` for non-component filenames. Keep Tailwind utility classes close to the JSX they style; extract repeated logic into helpers under `src/shared/utils`. Avoid `any`; prefer `zod` schemas or generated types. Console logs should stay limited to `console.error` or `console.warn` to satisfy lint rules.

## Testing Guidelines
Vitest plus React Testing Library is preconfigured in `vitest.setup.ts`. Co-locate new specs or place them in module `__tests__` directories named `*.spec.ts[x]`. Run `npm run coverage` before submitting to keep service layers covered. For e2e flows, start `npm run dev` in one terminal and `npm run test:e2e` in another; store supporting traces or screenshots in `e2e-results/` when troubleshooting.

## Commit & Pull Request Guidelines
Follow the imperative prefix style seen in history (`Fix: ...`, `Feat: ...`, `Chore: ...`). Keep summaries under roughly 60 characters and expand on rationale in the body when useful. Pull requests should outline scope, list the commands you ran (`npm run lint`, `npm run test`, etc.), and link the relevant issue. Attach UI screenshots or recordings when front-end changes affect agents, and request review from a codeowner when touching Supabase functions or shared components.