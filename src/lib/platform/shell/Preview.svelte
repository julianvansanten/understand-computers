<script lang="ts">
	import { untrack } from 'svelte';
	import RunView from './RunView.svelte';
	import Transport from './Transport.svelte';
	import { Run } from '../engine/run.svelte.ts';
	import { currentLocale } from '../i18n/context.ts';
	import { translate, type Translate } from '../i18n/translate.ts';
	import type { AnyValues } from '../engine/parameters.ts';
	import type { AnyVisualization } from '../visualization.ts';

	let { visualization, values }: { visualization: AnyVisualization; values?: AnyValues } = $props();
	const run = untrack(() => new Run(visualization, values));
	const t: Translate = (key, v) => translate(visualization.messages, currentLocale(), key, v);
</script>

<div>
	<RunView {run} translate={t} />
	<Transport {run} compact />
</div>

<style>
	div {
		display: grid;
		gap: var(--space-3);
	}
</style>
