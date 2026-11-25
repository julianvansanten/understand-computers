import type { Frame, Model } from '#lib/platform/engine/model.ts';
import { createRng, randomInt, shuffle, type Rng } from '#lib/platform/engine/rng.ts';
import type { MessageValues } from '#lib/platform/i18n/translate.ts';
import type { CodeLine, StateName } from '#lib/platform/visualization.ts';
import type { SortingValues } from './parameters.ts';

export interface Item {
	/** Identity, so the drawing can follow an item while it moves. */
	id: number;
	value: number;
}
export interface SortingState {
	items: Item[];
	marks: Record<number, StateName>;
	/** The part of the row being worked on, as positions. */
	part: [from: number, to: number] | null;
}

type Step = Frame<SortingState>;

export const model: Model<SortingValues, SortingState> = {
	*run({ params, seed }) {
		const rng = createRng(seed);
		const sorter = new Sorter(initialItems(params, rng));
		yield sorter.frame('start', {}, {});
		switch (params.algorithm) {
			case 'bubble':
				yield* bubble(sorter);
				break;
			case 'insertion':
				yield* insertion(sorter);
				break;
			case 'merge':
				yield* merge(sorter, 0, sorter.items.length - 1);
				break;
			case 'quick':
				yield* quick(sorter, 0, sorter.items.length - 1, params.pivot, rng);
				break;
		}
		sorter.items.forEach((item) => sorter.done.add(item.id));
		yield sorter.frame('sorted', {}, { comparisons: sorter.comparisons, moves: sorter.moves });
	}
};

function initialItems({ size, order }: SortingValues, rng: Rng): Item[] {
	const ascending = Array.from({ length: size }, (_, i) => i + 1);
	let values = ascending;
	if (order === 'random') values = shuffle(ascending, rng);
	if (order === 'reversed') values = ascending.reverse();
	if (order === 'few-unique') {
		values = ascending.map(() => Math.ceil((randomInt(rng, 1, 4) * size) / 4));
	}
	if (order === 'nearly-sorted') {
		values = [...ascending];
		for (let n = 0; n < Math.ceil(size / 10); n++) {
			const i = randomInt(rng, 0, size - 2);
			[values[i], values[i + 1]] = [values[i + 1]!, values[i]!];
		}
	}
	return values.map((value, id) => ({ id, value }));
}

class Sorter {
	comparisons = 0;
	moves = 0;
	done = new Set<number>();
	part: SortingState['part'] = null;
	private t = 0;

	constructor(public items: Item[]) {}

	at = (position: number) => this.items[position]!;

	frame(
		key: string,
		marks: Record<number, StateName>,
		values: MessageValues,
		codeLine?: string
	): Step {
		const all: Record<number, StateName> = {};
		for (const id of this.done) all[id] = 'done';
		return {
			t: this.t++,
			state: { items: this.items, marks: { ...all, ...marks }, part: this.part },
			explain: { key, values },
			codeLine,
			stats: { comparisons: this.comparisons, moves: this.moves }
		};
	}

	/** Compares two positions and explains the outcome. */
	compare(i: number, j: number, codeLine: string, extra: Record<number, StateName> = {}): Step {
		this.comparisons++;
		const [a, b] = [this.at(i), this.at(j)];
		return this.frame(
			a.value > b.value ? 'compare.greater' : 'compare.notGreater',
			{ ...extra, [a.id]: 'active', [b.id]: 'active' },
			{ a: a.value, b: b.value },
			codeLine
		);
	}

	swap(i: number, j: number, codeLine: string, extra: Record<number, StateName> = {}): Step {
		this.moves++;
		const [a, b] = [this.at(i), this.at(j)];
		this.items = this.items.with(i, b).with(j, a);
		return this.frame(
			'swap',
			{ ...extra, [a.id]: 'active', [b.id]: 'active' },
			{ a: a.value, b: b.value },
			codeLine
		);
	}

	/** Moves the item at `from` to the earlier position `to`; everything between shifts up. */
	insert(from: number, to: number): Item {
		const item = this.at(from);
		this.items = [
			...this.items.slice(0, to),
			item,
			...this.items.slice(to, from),
			...this.items.slice(from + 1)
		];
		return item;
	}
}

function* bubble(s: Sorter): Generator<Step> {
	for (let end = s.items.length - 1; end > 0; end--) {
		let swapped = false;
		for (let i = 0; i < end; i++) {
			yield s.compare(i, i + 1, 'compare');
			if (s.at(i).value > s.at(i + 1).value) {
				yield s.swap(i, i + 1, 'swap');
				swapped = true;
			}
		}
		const last = s.at(end);
		s.done.add(last.id);
		yield s.frame('bubble.placed', {}, { a: last.value }, 'placed');
		if (!swapped) {
			yield s.frame('bubble.early', {}, {}, 'early');
			return;
		}
	}
}

function* insertion(s: Sorter): Generator<Step> {
	for (let i = 1; i < s.items.length; i++) {
		s.part = [0, i];
		const item = s.at(i);
		yield s.frame('insertion.take', { [item.id]: 'candidate' }, { a: item.value }, 'take');
		for (let j = i; j > 0; j--) {
			yield s.compare(j - 1, j, 'compare');
			if (s.at(j - 1).value <= s.at(j).value) break;
			yield s.swap(j - 1, j, 'swap');
		}
	}
	s.part = null;
}

function* merge(s: Sorter, from: number, to: number): Generator<Step> {
	if (from >= to) return;
	const middle = Math.floor((from + to) / 2);
	s.part = [from, to];
	yield s.frame('merge.split', {}, { from: from + 1, to: to + 1 }, 'split');
	yield* merge(s, from, middle);
	yield* merge(s, middle + 1, to);

	s.part = [from, to];
	let left = from;
	let right = middle + 1;
	// Items left of `left` are already merged; the right half starts at `right`.
	while (left < right && right <= to) {
		yield s.compare(left, right, 'compare');
		if (s.at(left).value > s.at(right).value) {
			const item = s.insert(right, left);
			right++;
			s.moves++;
			yield s.frame('merge.place', { [item.id]: 'candidate' }, { a: item.value }, 'place');
		} else {
			s.moves++;
			const item = s.at(left);
			yield s.frame('merge.place', { [item.id]: 'candidate' }, { a: item.value }, 'place');
		}
		left++;
	}
	yield s.frame('merge.merged', {}, { from: from + 1, to: to + 1 }, 'rest');
	s.part = null;
}

function* quick(
	s: Sorter,
	from: number,
	to: number,
	choice: SortingValues['pivot'],
	rng: Rng
): Generator<Step> {
	if (from > to) return;
	if (from === to) {
		s.done.add(s.at(from).id);
		return;
	}
	s.part = [from, to];
	const chosen =
		choice === 'last'
			? to
			: choice === 'middle'
				? Math.floor((from + to) / 2)
				: randomInt(rng, from, to);
	const pivot = s.at(chosen);
	const mark = { [pivot.id]: 'candidate' as const };
	yield s.frame('quick.pivot', mark, { a: pivot.value }, 'pivot');
	if (chosen !== to) yield s.swap(chosen, to, 'pivot', mark);

	let boundary = from;
	for (let i = from; i < to; i++) {
		s.comparisons++;
		const item = s.at(i);
		const smaller = item.value < pivot.value;
		yield s.frame(
			smaller ? 'quick.smaller' : 'quick.notSmaller',
			{ ...mark, [item.id]: 'active' },
			{ a: item.value, b: pivot.value },
			'compare'
		);
		if (smaller) {
			if (i !== boundary) yield s.swap(i, boundary, 'swap', mark);
			boundary++;
		}
	}
	if (boundary !== to) yield s.swap(boundary, to, 'placed', mark);
	s.done.add(pivot.id);
	yield s.frame('quick.placed', {}, { a: pivot.value }, 'placed');
	yield* quick(s, from, boundary - 1, choice, rng);
	yield* quick(s, boundary + 1, to, choice, rng);
	s.part = null;
}

const code: Record<SortingValues['algorithm'], Record<string, string>> = {
	bubble: {
		outer: 'for end from n-1 down to 1:',
		inner: '  for i from 0 to end-1:',
		compare: '    if a[i] > a[i+1]:',
		swap: '      swap a[i], a[i+1]',
		placed: '  a[end] is in place',
		early: '  if nothing swapped: stop'
	},
	insertion: {
		take: 'for i from 1 to n-1:',
		loop: '  for j from i down to 1:',
		compare: '    if a[j-1] <= a[j]: stop',
		swap: '    swap a[j-1], a[j]'
	},
	merge: {
		base: 'sort(from, to):',
		split: '  split in two halves',
		halves: '  sort(left), sort(right)',
		compare: '  compare the first of each half',
		place: '    place the smallest next',
		rest: '  the rest is already in order'
	},
	quick: {
		base: 'sort(from, to):',
		pivot: '  choose pivot, move it to the end',
		compare: '  for each x: if x < pivot:',
		swap: '      move x to the left part',
		placed: '  put pivot between the parts',
		halves: '  sort(left), sort(right)'
	}
};

export const pseudocode = ({ algorithm }: SortingValues): CodeLine[] =>
	Object.entries(code[algorithm]).map(([id, text]) => ({ id, text }));
