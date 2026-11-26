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

Or with Docker, at <http://localhost:8080>:

```sh
cp compose.example.yaml compose.yaml
docker compose up --detach --build
```

## School colors

The look follows two main colors, one for light and one for dark. Copy `.env.example` to `.env` and set
them, or set them in the environment:

```sh
THEME_COLOR_LIGHT="#b3131b"
THEME_COLOR_DARK="#ffb000"
```

A color that is not set keeps the standard look. See [Hosting](docs/hosting.md#school-colors).

## Commands

| Command              | Does                                                              |
| -------------------- | ----------------------------------------------------------------- |
| `npm run dev`        | Development server                                                |
| `npm run build`      | Static site in `build/`                                           |
| `npm run preview`    | Serves `build/` like a static host                                |
| `npm run check`      | Type check                                                        |
| `npm run lint`       | Formatting, ESLint and project rules                              |
| `npm test`           | Models, engine and translations                                   |
| `npm run test:build` | Every page exists in every language                               |
| `npm run test:e2e`   | Browser tests on `build/`; downloads their browser the first time |

## Documentation

- [Adding a visualization](docs/adding-a-visualization.md)
- [Architecture](docs/architecture.md)
- [Design system](docs/design-system.md)
- [Hosting](docs/hosting.md)

## License

Copyright (C) 2026 Julian van Santen

[GNU Affero General Public License, version 3](LICENSE) (`AGPL-3.0-or-later`). If you put a modified version
online, you must offer its users the source code.
