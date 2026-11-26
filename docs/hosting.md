# Hosting

`npm run build` writes plain files to `build/`. Any web server can serve them; no Node or rewrite
rules needed. Set `BASE_PATH=/name` when building only if the site lives below a path, such as
`https://user.github.io/name/`. Provider details were checked in November 2026. None of these setups
has been deployed yet.

|               | Own server / VPS                   | GitHub Pages                                                                                                                    | Cloudflare Pages               |
| ------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Deploy        | Copy `build/`                      | GitHub Actions                                                                                                                  | Connect the repository         |
| `BASE_PATH`   | empty                              | `/<repository>`, or empty with own domain                                                                                       | empty                          |
| Upkeep        | Updates and certificates are yours | None                                                                                                                            | None                           |
| Privacy       | You control logs and location      | [GitHub stores visitors' IP addresses](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) | Visits pass through Cloudflare |
| Backend later | Best: same server and address      | Elsewhere                                                                                                                       | Forward with a Pages Function  |

Advice: use GitHub Pages or Cloudflare Pages for a pilot, and your own server once there is a
backend with student data. Ask your school's privacy officer before using a provider in class.

## School colors

| Variable            | Main color of                                  |
| ------------------- | ---------------------------------------------- |
| `THEME_COLOR_LIGHT` | The light theme, a hex color such as `#b3131b` |
| `THEME_COLOR_DARK`  | The dark theme                                 |

Both are optional and separate. Use three or six hex digits; the `#` may be left out. Keep quotes around
the value in `.env` and YAML files, because `#` can start a comment there. An invalid value is reported
and ignored.

- **Docker:** read when the container starts. After a change: `docker compose up --detach`.
- **Elsewhere:** read by `npm run dev` and `npm run build`, from the environment or `.env`. To change a
  site that is already built, run `node scripts/theme.mjs build/theme.css` with the variables set and
  upload that file.
- **GitHub Pages:** repository variables with these names. **Cloudflare Pages:** build variables.

## Docker

```sh
cp compose.example.yaml compose.yaml
cp .env.example .env    # optional, for the school colors
docker compose up --detach --build
```

The site is on port 8080. The container runs nginx without root, on a read-only file system. It serves
plain HTTP, so put a reverse proxy with HTTPS in front of it. Copying a link needs HTTPS (or localhost).
The site must be at the root of its domain. A backend can later become a second service in the same
compose file.

## Own server / VPS

1. `npm ci && npm run build`
2. `rsync -a --delete build/ user@server:/srv/understand-computers/`

With [Caddy](https://caddyserver.com) (arranges certificates itself):

```
example.nl {
	encode zstd gzip
	root * /srv/understand-computers

	# Later, for the backend:
	# handle /api/* {
	# 	reverse_proxy localhost:8080
	# }

	handle {
		@immutable path /_app/immutable/*
		header @immutable Cache-Control "public, max-age=31536000, immutable"
		file_server
	}

	handle_errors 404 {
		rewrite * /404.html
		file_server
	}
}
```

With nginx (inside a `server` block; use certbot for certificates):

```nginx
root /srv/understand-computers;
error_page 404 /404.html;

location / {
	try_files $uri $uri/ =404;
}
location /_app/immutable/ {
	add_header Cache-Control "public, max-age=31536000, immutable";
}
# Later, for the backend:
# location /api/ { proxy_pass http://127.0.0.1:8080; }
```

Files under `_app/immutable` have a hash in their name, so they may be cached forever. Do not cache
HTML for long, or students keep seeing an old version.

## GitHub Pages

1. In the repository: Settings > Pages > Source: GitHub Actions.
2. Push to `main`. When all CI checks pass, that version is published. If a check fails, the site
   keeps the previous version. To publish again without a push, re-run the CI workflow.

The workflow sets `BASE_PATH` itself.

[Limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits): the
site at most 1 GB and about 100 GB traffic per month (this site is under 1 MB). Pages must not be
used to handle passwords, so a login never belongs here. A backend runs elsewhere, for example on
`api.example.nl`, with CORS. With your own domain on both, cookies stay same-site; on `github.io`
they do not.

## Cloudflare Pages

1. Workers & Pages > Create > Pages > connect the repository.
2. Build command `npm run build`, output directory `build`, no framework preset.

The Node version comes from `.nvmrc`.
[A top-level `404.html`](https://developers.cloudflare.com/pages/configuration/serving-pages/) is used
for unknown pages. Leave caching at its default.

For a backend, add `functions/api/[[path]].js` that forwards requests to your server; the browser
then sees one address. Cloudflare also offers Workers with static assets, which
[has more features](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/);
compare them when you start.

## After each deploy

Open the welcome page, a visualization in both languages, a shared link with parameters, and an
address that does not exist.
