import type { MessageRef } from '../i18n/translate.ts';

export interface Frame<S> {
	/** Step number for algorithms, virtual milliseconds for networks. Never decreases. */
	t: number;
	/** Snapshot; never mutated after it is yielded. */
	state: S;
	explain: MessageRef;
	/** Id of the pseudocode line to highlight. */
	codeLine?: string;
	stats?: Record<string, number>;
}

export interface TimedAction<A> {
	t: number;
	action: A;
}

export interface RunInput<P, A> {
	params: P;
	seed: number;
	actions: TimedAction<A>[];
}

/** Pure: the same input always yields the same frames. That makes rewinding and sharing possible. */
export interface Model<P, S, A = never> {
	run(input: RunInput<P, A>): Iterable<Frame<S>>;
}

export const FRAME_LIMIT = 20_000;

export function collectFrames<P, S, A>(
	model: Model<P, S, A>,
	input: RunInput<P, A>,
	limit = FRAME_LIMIT
): { frames: Frame<S>[]; truncated: boolean } {
	const frames: Frame<S>[] = [];
	for (const frame of model.run(input)) {
		if (frames.length === limit) return { frames, truncated: true };
		frames.push(frame);
	}
	return { frames, truncated: false };
}

/** Index of the last frame with frame.t <= t. */
export function frameIndexAt(frames: { t: number }[], t: number): number {
	let low = 0;
	let high = frames.length - 1;
	while (low < high) {
		const middle = Math.ceil((low + high) / 2);
		if (frames[middle]!.t <= t) low = middle;
		else high = middle - 1;
	}
	return Math.max(0, low);
}
