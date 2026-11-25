# Architecture

## Layers

| Folder             | Contains                            | May use                                   |
| ------------------ | ----------------------------------- | ----------------------------------------- |
| `src/routes`       | Thin pages                          | platform                                  |
| `src/lib/platform` | Engine, shell, design, translations | only itself; `registry.ts` finds subjects |
| `src/lib/subjects` | Subjects and their visualizations   | its own folder and the platform           |

ESLint enforces the last two rows.

## A run

A run is fully determined by **parameters + seed + timed actions**. A model turns these into a list
of frames; nothing else may influence it (no `Math.random`, no clock). So:

- stepping back is showing an earlier frame;
- a link with parameters and seed gives everyone the same situation;
- an action, such as breaking a link, recomputes the run with that action added. Whatever happened
  before it stays the same, because the model is deterministic.

All frames are computed at once when a run starts, up to 20,000. That gives the timeline a known
length. `Player` keeps its place as frame index + offset, because several frames may share a moment.

The same model serves algorithms (`t` counts steps) and networks (`t` is virtual milliseconds, see
`EventQueue`).

## Routes

| Route                                        | Page                    |
| -------------------------------------------- | ----------------------- |
| `/`                                          | Welcome                 |
| `/subjects/`                                 | Grid of subjects        |
| `/subjects/<subject>/`                       | Table of visualizations |
| `/subjects/<subject>/<visualization>/`       | Visualization           |
| `/about/`                                    | About                   |
| `/en/...`                                    | The same in English     |
| `/api/v1/`, `/login`, `/account`, `/classes` | Reserved, do not use    |

Dutch has no prefix (`defaultLocale` in `i18n/locales.ts`). Links are made with `link()` from
`i18n/context.ts`, which adds the language and the hosting sub-path.

The query string holds `v` (version of the parameters), `seed`, and each parameter. It is read in
the browser, since pages are prerendered. Links are untrusted input: `decode()` clamps and falls back.

## Languages

Texts live in `messages.ts` files next to the code that uses them. A missing key does not compile;
tests check placeholders and the keys that parameters, statistics and legends need. Models emit
message keys, never text.

To add a language: add it to `locales` and `localeNames`, then translate what the compiler reports.

## Curriculum

`meta.ts` has a `curriculum` list, for example `informatica-2019:B`. It is only a tag. Never let
routes, folders or navigation depend on it. The new Dutch programme only means changing tags.
Nothing displays the tags yet. The current ones are a first guess, to be reviewed by a teacher.

## A backend, later

- Visualizations stay here; a backend owns data (accounts, classes, saved setups, progress).
- Key: `<subject>/<visualization>` plus the parameter version. A saved setup is the same data as a
  shared link.
- REST/JSON under `/api/v1`, described with OpenAPI, from which frontend types are generated. With
  Rust: `utoipa` to describe, `openapi-typescript` to generate.
- Same origin with an HttpOnly session cookie; no tokens in browser storage.
- No SvelteKit server files (`+server`, `+page.server`, remote functions). `npm run lint` fails on
  them. `hooks.server.ts` is the exception: it only sets the language while prerendering.
- The site keeps working without login or when the backend is down.
