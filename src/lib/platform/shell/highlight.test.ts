import { expect, it } from 'vitest';
import { highlight } from './highlight.ts';

const show = (text: string) =>
	highlight(text)
		.map((t) => (t.kind === 'plain' ? t.text : `[${t.kind}:${t.text}]`))
		.join('');

it('marks keywords, numbers and calls', () => {
	expect(show('  for i from 0 to end-1:')).toBe(
		'  [keyword:for] i [keyword:from] [number:0] [keyword:to] end-[number:1]:'
	);
	expect(show('sort(left), sort(right)')).toBe('[call:sort](left), [call:sort](right)');
	expect(show('if a[i+1] > a[i]: stop')).toBe(
		'[keyword:if] a[i+[number:1]] > a[i]: [keyword:stop]'
	);
});

it('leaves words that only contain a keyword alone', () => {
	expect(show('format fore iffy 2x')).toBe('format fore iffy 2x');
});

it('always gives the line back', () => {
	for (const line of ['', '   ', 'x', 'while frontier is not empty:', 'a(b(c(1)))']) {
		expect(
			highlight(line)
				.map((t) => t.text)
				.join('')
		).toBe(line);
	}
});
