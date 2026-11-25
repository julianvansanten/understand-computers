import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

/**
 * @param {string[]} group
 * @param {string} message
 * @returns {import('eslint').Linter.RulesRecord}
 */
const restrict = (group, message) => ({
	'no-restricted-imports': ['error', { patterns: [{ group, message }] }]
});

export default ts.config(
	{ ignores: ['build', '.svelte-kit', 'node_modules', 'test-results', 'playwright-report'] },
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// TypeScript already reports undefined names.
			'no-undef': 'off',
			// All internal links are resolved in one place: i18n/context.ts.
			'svelte/no-navigation-without-resolve': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: { parserOptions: { parser: ts.parser } }
	},
	{
		files: ['src/lib/platform/**'],
		rules: restrict(['**/subjects/**'], 'The platform must not know about subjects.')
	},
	{
		files: ['src/lib/subjects/**'],
		rules: restrict(
			['../*', '#lib/subjects/*'],
			'A visualization uses only its own folder and #lib/platform.'
		)
	}
);
