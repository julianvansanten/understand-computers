export type TokenKind = 'keyword' | 'number' | 'call' | 'plain';

// shortcut: a fixed word list, so these words are also marked inside prose lines; enough for pseudocode.
const pattern =
	/\b(for|each|from|down|to|while|if|else|return|not|and|or|stop|done)\b|\b(\d+)\b|\b([a-z_]\w*)(?=\()/gi;

/** Splits a line of pseudocode into parts to color. Joined, they give the line back. */
export function highlight(text: string): { text: string; kind: TokenKind }[] {
	const tokens: { text: string; kind: TokenKind }[] = [];
	let last = 0;
	for (const match of text.matchAll(pattern)) {
		if (match.index > last) tokens.push({ text: text.slice(last, match.index), kind: 'plain' });
		const kind = match[1] ? 'keyword' : match[2] ? 'number' : 'call';
		tokens.push({ text: match[0], kind });
		last = match.index + match[0].length;
	}
	if (last < text.length) tokens.push({ text: text.slice(last), kind: 'plain' });
	return tokens;
}
