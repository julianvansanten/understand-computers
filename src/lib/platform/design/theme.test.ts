import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const directory = mkdtempSync(join(tmpdir(), 'theme-'));

function write(command: string, script: string, light: string, dark: string) {
	const file = join(directory, 'theme.css');
	execFileSync(command, [script, file], {
		env: { PATH: process.env.PATH, THEME_COLOR_LIGHT: light, THEME_COLOR_DARK: dark },
		stdio: 'ignore'
	});
	return readFileSync(file, 'utf8');
}

const both = ':root{--theme-light:#1d3fbb}\n:root{--theme-dark:#FB0}\n';
const cases: [light: string, dark: string, css: string][] = [
	['', '', ''],
	['#1d3fbb', '#FB0', both],
	['1d3fbb', 'FB0', both],
	['', '#FB0', ':root{--theme-dark:#FB0}\n'],
	// Anything else is ignored; it must never end up in the stylesheet.
	['red', '#12345', ''],
	['#1d3fbb}body{display:none', '#fff;', ''],
	['#1d3fbb\n', ' #fff', ''],
	['##fff', '#', '']
];

it.each(cases)('theme.mjs: light %j, dark %j', (light, dark, css) => {
	expect(write(process.execPath, 'scripts/theme.mjs', light, dark)).toBe(css);
});
// Needs a POSIX shell, which Windows does not have.
it.skipIf(process.platform === 'win32').each(cases)(
	'40-theme.sh: light %j, dark %j',
	(light, dark, css) => {
		expect(write('sh', 'docker/40-theme.sh', light, dark)).toBe(css);
	}
);
