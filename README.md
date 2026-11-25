# Understand Computers

Interactive computer science visualizations for secondary school, in Dutch and English.
A static site built with SvelteKit 3 and TypeScript.

Warning: this project is vibe-coded using Claude Code. Use at your own discretion!

## Start

Needs Node 24 or newer (26 is used in CI).

```sh
npm install
npm run dev
```

## Commands

| Command              | Does                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`        | Development server                                                                                                  |
| `npm run build`      | Static site in `build/`                                                                                             |
| `npm run preview`    | Serves `build/` (restart it after each build)                                                                       |
| `npm run check`      | Type check                                                                                                          |
| `npm run lint`       | Formatting, ESLint and project rules                                                                                |
| `npm test`           | Models, engine and translations                                                                                     |
| `npm run test:build` | Every page exists in every language                                                                                 |
| `npm run test:e2e`   | Browser tests on `build/`. First `npx playwright install chromium`, or set `CHROMIUM_PATH` to an installed Chromium |

## Documentation

- [Adding a visualization](docs/adding-a-visualization.md)
- [Architecture](docs/architecture.md)
- [Design system](docs/design-system.md)
- [Hosting](docs/hosting.md)

## License

Copyright (C) 2026 Julian van Santen

[GNU Affero General Public License, version 3](LICENSE) (`AGPL-3.0-or-later`). If you put a modified version
online, you must offer its users the source code.
