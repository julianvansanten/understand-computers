// Writes the school colors from the environment to a stylesheet: node scripts/theme.mjs <file>
// docker/40-theme.sh does the same in a container, where there is no Node. Keep them equal; a test
// compares them.
import { writeFileSync } from 'node:fs';

let css = '';
for (const mode of ['light', 'dark']) {
	const name = `THEME_COLOR_${mode.toUpperCase()}`;
	const value = process.env[name] ?? '';
	if (value === '') continue;
	const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value)?.[1];
	if (hex) css += `:root{--theme-${mode}:#${hex}}\n`;
	else console.warn(`${name} is ignored: "${value}" is not a hex color such as #1d3fbb`);
}
writeFileSync(process.argv[2], css);
