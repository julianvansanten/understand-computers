// Serves build/ the way a static host does: node scripts/serve-build.mjs [port]
// `vite preview` is not used: it serves SvelteKit's own output, with a server for unknown pages.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const port = Number(process.argv[2] ?? 4173);
const base = process.env.BASE_PATH ?? '';
const types = {
	'.css': 'text/css',
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript',
	'.json': 'application/json',
	'.svg': 'image/svg+xml'
};

createServer((request, response) => {
	const send = (status, file) => {
		const type = types[extname(file)] ?? 'application/octet-stream';
		response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
		createReadStream(file).pipe(response);
	};
	let url, path;
	try {
		url = new URL(request.url, 'http://localhost');
		path = decodeURIComponent(url.pathname);
	} catch {
		return response.writeHead(400).end();
	}
	if (path !== base && !path.startsWith(`${base}/`)) return send(404, 'build/404.html');
	// Normalizing an absolute path removes every "..", so this stays inside build/.
	const file = join('build', normalize(`/${path.slice(base.length)}`));
	if (!existsSync(file)) return send(404, 'build/404.html');
	if (!statSync(file).isDirectory()) return send(200, file);
	if (!existsSync(join(file, 'index.html'))) return send(404, 'build/404.html');
	if (!path.endsWith('/')) {
		return response.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end();
	}
	send(200, join(file, 'index.html'));
}).listen(port, '127.0.0.1', () => console.log(`http://localhost:${port}${base}/`));
