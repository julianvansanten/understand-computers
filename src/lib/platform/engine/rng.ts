export type Rng = () => number;

/** Deterministic random numbers in [0, 1) (mulberry32): the same seed gives the same run everywhere. */
export function createRng(seed: number): Rng {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let x = Math.imul(a ^ (a >>> 15), 1 | a);
		x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
		return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
	};
}

/** Integer in [min, max]. */
export const randomInt = (rng: Rng, min: number, max: number) =>
	min + Math.floor(rng() * (max - min + 1));

export function shuffle<T>(items: T[], rng: Rng): T[] {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = randomInt(rng, 0, i);
		[result[i], result[j]] = [result[j]!, result[i]!];
	}
	return result;
}
