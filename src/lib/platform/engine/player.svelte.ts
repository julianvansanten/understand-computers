import { frameIndexAt, type Frame } from './model.ts';

/** Moves through frames. Position is (index, offset) so frames at the same moment can still be stepped. */
export class Player<S> {
	frames = $state.raw<Frame<S>[]>([]);
	index = $state(0);
	offset = $state(0);
	playing = $state(false);
	speed = $state(1);

	frame = $derived(this.frames[this.index]);
	next = $derived(this.frames[this.index + 1]);
	time = $derived((this.frame?.t ?? 0) + this.offset);
	duration = $derived(this.frames.at(-1)?.t ?? 0);
	atEnd = $derived(this.index >= this.frames.length - 1);
	progress = $derived.by(() => {
		const span = (this.next?.t ?? 0) - (this.frame?.t ?? 0);
		return span > 0 ? this.offset / span : 0;
	});

	/** @param pace units of t per real second at speed 1 */
	constructor(private readonly pace: number) {}

	/** Without a moment, starts at the very first frame, also if more frames share its moment. */
	load(frames: Frame<S>[], at?: number) {
		this.frames = frames;
		this.index = 0;
		this.offset = 0;
		if (at !== undefined) this.seek(at);
	}

	seek(t: number) {
		const clamped = Math.min(Math.max(0, t), this.frames.at(-1)?.t ?? 0);
		this.index = frameIndexAt(this.frames, clamped);
		this.offset = Math.max(0, clamped - (this.frames[this.index]?.t ?? 0));
	}

	step(direction: 1 | -1) {
		this.playing = false;
		// Stepping back from halfway between two frames first returns to the frame itself.
		if (direction === -1 && this.offset > 0) this.offset = 0;
		else {
			this.index = Math.min(Math.max(0, this.index + direction), this.frames.length - 1);
			this.offset = 0;
		}
	}

	start() {
		this.playing = false;
		this.index = 0;
		this.offset = 0;
	}

	toggle() {
		if (!this.playing && this.atEnd) this.start();
		this.playing = !this.playing;
	}

	advance(seconds: number) {
		let offset = this.offset + seconds * this.pace * this.speed;
		let index = this.index;
		while (index < this.frames.length - 1) {
			const span = this.frames[index + 1]!.t - this.frames[index]!.t;
			if (offset < span) break;
			offset -= span;
			index++;
		}
		const ended = index >= this.frames.length - 1;
		this.index = index;
		this.offset = ended ? 0 : offset;
		if (ended) this.playing = false;
	}
}
