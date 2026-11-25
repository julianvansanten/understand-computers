// Project rules that ESLint does not cover. Exits with 1 and a list when one is broken.
import { readdirSync, readFileSync } from 'node:fs';

const problems = [];
const files = readdirSync('src', { recursive: true, withFileTypes: true })
	.filter((entry) => entry.isFile())
	.map((entry) => `${entry.parentPath}/${entry.name}`);

for (const file of files) {
	// The backend will be a separate program, so the frontend must stay static.
	if (/\+(server|page\.server|layout\.server)\.[jt]s$|\.remote\.[jt]s$/.test(file)) {
		problems.push(`${file}: server code is not allowed in the static frontend`);
	}
	if (file.startsWith('src/lib/subjects/') && /\.(svelte|ts)$/.test(file)) {
		readFileSync(file, 'utf8')
			.split('\n')
			.forEach((line, index) => {
				if (/#[0-9a-f]{3,8}\b|\b(rgb|hsl|oklch)a?\(/i.test(line)) {
					problems.push(`${file}:${index + 1}: literal color, use a token such as var(--active)`);
				}
			});
	}
}
if (problems.length) {
	console.error(problems.join('\n'));
	process.exit(1);
}
console.log(`verify-source: ${files.length} files ok`);
