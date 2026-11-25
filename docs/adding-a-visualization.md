# Adding a visualization

Create one folder, `src/lib/subjects/<subject>/<visualization>/`. Use lowercase words and hyphens:
the names become the address. No other file needs to change; the page, the list and the tests pick
it up. The `sorting` folder is a good example to copy.

| File            | Purpose                                                            |
| --------------- | ------------------------------------------------------------------ |
| `meta.ts`       | Title, description, concepts, level, minutes, position in the list |
| `parameters.ts` | What students can change                                           |
| `model.ts`      | The simulation, without any drawing                                |
| `model.test.ts` | Proof that it is correct                                           |
| `Stage.svelte`  | The drawing, without any logic of the simulation                   |
| `Detail.svelte` | Optional extra panel, such as a table                              |
| `messages.ts`   | All texts, in every language                                       |
| `index.ts`      | Ties these together                                                |

A new subject also needs `src/lib/subjects/<subject>/subject.ts`.

## 1. Parameters

```ts
export const parameters = defineParameters({
	algorithm: choice(['linear', 'binary'], 'linear'),
	size: range({ min: 4, max: 64, step: 1, default: 16 })
});
export type SearchValues = ParameterValues<typeof parameters>;
```

Controls, types and the link format follow from this. Add `when: (values) => ...` to hide a
parameter that has no effect. If you later change what a value means, raise `version` in `index.ts`.

## 2. Model

```ts
export const model: Model<SearchValues, SearchState> = {
	*run({ params, seed }) {
		const rng = createRng(seed);
		yield { t: 0, state, explain: { key: 'start' }, stats: { comparisons: 0 } };
		// ... one frame for each thing a student should notice
	}
};
```

- The same input must give the same frames: use `createRng(seed)`, never `Math.random()`.
- Never change a state that was already yielded; make a new one.
- `t` never decreases. Count steps, or use `EventQueue` for virtual time.
- `explain` holds a message key and values, not text.
- `codeLine` is the id of a line from your `pseudocode`, if you have one.
- Keep a run below 20,000 frames, also at the highest settings.

To let students intervene, give the model an action type, and handle `actions` from the input at
their `t`. See `networking/packet-routing`.

## 3. Drawing

`Stage.svelte` receives `frame`, `next`, `progress`, `time`, `params`, `t`, `selection`, `select`
and `dispatch` (see `StageProps`). Draw `frame.state`; use `progress` to move towards `next.state`,
or `time` in continuous time. Start from `<Stage label={t('stage.label')}>` and read
[the design system](design-system.md).

## 4. Texts

Needed keys: `param.<name>`, `param.<name>.<option>`, `stat.<name>`, `legend.<state>`, and
everything your model and drawing use.

## 5. Check

```sh
npm run check && npm run lint && npm test
```

The shared tests check your texts and parameters, and run your model at every option and extreme.
They cannot know whether it is _correct_: prove that in `model.test.ts`. Then look at it in both
languages, both themes, presentation mode and at phone width. Add its path to `visualizations` in
`tests/site.spec.ts` for browser and accessibility tests.
