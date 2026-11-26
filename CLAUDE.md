# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

At the start of every session, invoke the `ponytail` skill (`.claude/skills/ponytail`) at level `full`,
and keep it active for the whole session unless the user changes the level or says "stop ponytail".
For UI or visual design work, also use the `frontend-design` skill.

## What this is

Interactive computer science visualizations for Dutch secondary school, in Dutch and English. A fully
static SvelteKit 3 site (Svelte 5 runes, TypeScript 6, adapter-static, Node 24+). The docs in `docs/`
explain architecture, design system, hosting and how to add a visualization in more depth.

## Commands

```sh
npm run dev            # development server
npm run build          # static site in build/ (prebuild writes static/theme.css first)
npm run preview        # serves build/ like a static host (not `vite preview`)
npm run check          # svelte-kit sync + svelte-check
npm run lint           # prettier --check, eslint, scripts/verify-source.mjs
npm test               # vitest: models, engine, translations, registry contract
npm run test:build     # every page exists in every language in build/
npm run test:e2e       # Playwright + axe against build/ (installs its Chromium first)
```

- One unit test: `npx vitest run src/lib/subjects/algorithms/sorting` or `npx vitest run -t "name"`.
- One browser test: `npx playwright test -g "name"`.
- Browser tests serve the existing `build/`; rebuild first. `BASE_PATH` must be the same for the build
  and the test run: CI runs everything both with `BASE_PATH=''` and `BASE_PATH=/understand-computers`.
- `CHROMIUM_PATH=/usr/bin/chromium` makes Playwright use an installed Chromium instead of its own.
- Fonts differ per machine (CI has none of the site's fonts), so layout tests can pass locally and fail
  on CI. For a CI-like run:
  `docker run --rm --ipc=host -e BASE_PATH=... -v "$PWD":/work -w /work mcr.microsoft.com/playwright:v<version>-noble npx playwright test`
  (it leaves a root-owned `test-results/`).

## Architecture

Three layers, enforced by ESLint `no-restricted-imports`:

- `src/routes`: thin pages under `[[locale=locale]]/`.
- `src/lib/platform`: engine, shell, design tokens, i18n, primitives. Never imports from subjects, except
  `registry.ts`.
- `src/lib/subjects/<subject>/<visualization>/`: one folder per visualization (`meta.ts`,
  `parameters.ts`, `model.ts`, `Stage.svelte`, optional `Detail.svelte`, `messages.ts`, `index.ts`).
  Imports only its own folder and `#lib/platform`. `registry.ts` discovers folders with
  `import.meta.glob`, so adding a folder needs no other edits; `registry.test.ts` then checks its texts,
  parameters and model automatically.

**A run is parameters + seed + timed actions.** A `Model` is a pure generator of `Frame`s (`t` never
decreases, `explain` is a message key, never text; randomness only via `createRng(seed)`). `Run`
(`engine/run.svelte.ts`) collects all frames up front (limit 20,000), and `Player` moves through them as
index + offset, because several frames may share one `t`. Student actions (e.g. breaking a link) are
appended and the whole run is recomputed. Algorithms count steps in `t`; networks use virtual ms via
`EventQueue`. Stages only draw `frame.state`, interpolating with `progress`/`time`.

`VisualizationShell` renders everything around the stage (parameters, transport, explanation, legend,
stats, pseudocode, presentation mode), so all visualizations look the same.

**Routing and i18n.** Dutch (`defaultLocale`) has no URL prefix, other locales do: `/subjects/…` and
`/en/subjects/…`. Build every internal link with `link()`/`href()` from `i18n/context.ts` (adds locale,
trailing slash and `BASE_PATH`). Texts live in typed `messages.ts` files (`defineMessages` makes a missing
key a compile error). Pages are prerendered, so the query string (`v`, `seed`, parameters) is read in the
browser in `onMount`, and `decode()` treats it as untrusted.

**Design.** Components use only tokens from `design/tokens.css`. The five state names (`idle`,
`candidate`, `active`, `done`, `failed`) mean the same everywhere and are always paired with a
`StateGlyph` shape. Literal colors in `src/lib/subjects` fail `npm run lint`. School colors:
`THEME_COLOR_LIGHT`/`THEME_COLOR_DARK` become `theme.css` (by `scripts/theme.mjs`, or
`docker/40-theme.sh` at container start; keep the two equal, a test compares them), and
`design/school-theme.css` derives the palette with luminance math that guarantees contrast.

**Static only.** No `+server`, `+page.server`, `+layout.server` or remote functions (`verify-source.mjs`
fails on them); `hooks.server.ts` only sets `<html lang>` while prerendering. A future backend (possibly
Rust) gets `/api/v1`; `/login`, `/account` and `/classes` are reserved too.

## Deployment

CI (`.github/workflows/ci.yml`) runs check, lint, unit, build, build check and e2e for both base paths.
`deploy-github-pages.yml` runs only after CI succeeds for a push to `main`, and publishes that commit.
`Dockerfile` + `compose.example.yaml` serve the build with unprivileged nginx (`docker/nginx.conf`).
