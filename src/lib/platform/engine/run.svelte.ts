import type { AnyVisualization } from '../visualization.ts';
import { collectFrames, type TimedAction } from './model.ts';
import { defaults, MAX_SEED, type AnyValues } from './parameters.ts';
import { Player } from './player.svelte.ts';

/** One run of a visualization: parameters + seed + actions, and the player that shows it. */
export class Run {
	values = $state.raw<AnyValues>({});
	seed = $state(1);
	truncated = $state(false);
	readonly player: Player<unknown>;
	private actions: TimedAction<unknown>[] = [];

	constructor(
		readonly visualization: AnyVisualization,
		values: AnyValues = {}
	) {
		this.player = new Player(visualization.pace);
		this.setup({ ...defaults(visualization.parameters), ...values }, this.seed);
	}

	/** Starts a new run from the beginning. */
	setup(values: AnyValues, seed: number) {
		this.values = values;
		this.seed = seed;
		this.actions = [];
		this.player.playing = false;
		this.compute();
	}

	change(key: string, value: string | number) {
		this.setup({ ...this.values, [key]: value }, this.seed);
	}

	newSeed() {
		this.setup(this.values, (this.seed % MAX_SEED) + 1);
	}

	reset() {
		this.setup(this.values, this.seed);
	}

	/** A student intervenes now. Later actions from before a rewind are dropped. */
	dispatch(action: unknown) {
		const t = this.player.time;
		this.actions = [...this.actions.filter((earlier) => earlier.t <= t), { t, action }];
		this.compute(t);
	}

	private compute(at?: number) {
		const { frames, truncated } = collectFrames(this.visualization.model, {
			params: this.values,
			seed: this.seed,
			actions: this.actions
		});
		this.truncated = truncated;
		this.player.load(frames, at);
	}
}
