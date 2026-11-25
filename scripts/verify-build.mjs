// Checks that every page exists in every language: with the 404 fallback, the static adapter
// does not report pages it failed to prerender.
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const root = 'src/lib/subjects';
const locales = readFileSync('src/lib/platform/i18n/locales.ts', 'utf8')
	.match(/locales = \[(.*?)\]/)[1]
	.match(/\w+/g);
const [defaultLocale] = readFileSync('src/lib/platform/i18n/locales.ts', 'utf8')
	.match(/defaultLocale: Locale = '(\w+)'/)
	.slice(1);

const folders = (path) =>
	readdirSync(path, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name);
const pages = ['', 'about/', 'subjects/'];
for (const subject of folders(root)) {
	pages.push(`subjects/${subject}/`);
	for (const id of folders(`${root}/${subject}`)) pages.push(`subjects/${subject}/${id}/`);
}

const problems = [];
for (const locale of locales) {
	const prefix = locale === defaultLocale ? '' : `${locale}/`;
	for (const page of pages) {
		const file = `build/${prefix}${page}index.html`;
		if (!existsSync(file)) problems.push(`missing ${file}`);
		else if (!readFileSync(file, 'utf8').includes(`<html lang="${locale}"`)) {
			problems.push(`wrong language in ${file}`);
		}
	}
}
if (!existsSync('build/404.html')) problems.push('missing build/404.html');
else if (readFileSync('build/404.html', 'utf8').includes('%lang%')) {
	problems.push('language placeholder left in build/404.html');
}

if (problems.length) {
	console.error(problems.join('\n'));
	process.exit(1);
}
console.log(`verify-build: ${pages.length} pages in ${locales.length} languages ok`);
