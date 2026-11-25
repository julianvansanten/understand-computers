# Design system

Light is a squared notebook with a blue pen; dark is a chalkboard. All values are in
`src/lib/platform/design/tokens.css`. Every visualization uses the same shell, so an author never
places controls, legends or explanations.

## States

A state has the same meaning, color and shape everywhere.

| State       | Meaning                                     | Shape      |
| ----------- | ------------------------------------------- | ---------- |
| `idle`      | Nothing is happening to it                  | none       |
| `candidate` | May be next: in a queue, chosen, waiting    | diamond    |
| `active`    | Happening now: compared, moving, on the way | triangle   |
| `done`      | Finished: sorted, visited, delivered        | check mark |
| `failed`    | Lost, broken, rejected                      | cross      |

Use `var(--active)` to fill, `var(--active-edge)` for outlines and `var(--active-text)` for text on
that fill. Literal colors in `src/lib/subjects` fail `npm run lint`. Color never stands alone: draw
`StateGlyph` as well.

## Rules

- Drawings are 960 × 440 units in `<Stage>`. Text is at least 14 units.
- Anything that can be pressed works by touch and keyboard, and its spoken name contains its visible
  text. `GraphView` does this for nodes and links. Nothing may depend on hovering.
- With reduced motion, `progress` is always 0 and `time` is that of the frame.
- Presentation mode enlarges everything sized in `rem`; use `rem`, not `px`, outside drawings.
- A subject chooses one accent (`blue`, `green`, `purple`, `orange`) and one icon. Nothing else.
