<script lang="ts">
	import { prefersReducedMotion } from 'svelte/motion';
	import type { Run } from '../engine/run.svelte.ts';
	import type { Translate } from '../i18n/translate.ts';
	import type { AnyVisualization } from '../visualization.ts';

	let {
		run,
		translate,
		part = 'Stage',
		selection = $bindable(null)
	}: {
		run: Run;
		translate: Translate;
		part?: 'Stage' | 'Detail';
		selection?: string | null;
	} = $props();

	const player = $derived(run.player);
	const View = $derived((run.visualization as AnyVisualization)[part]);
	const still = $derived(prefersReducedMotion.current);
</script>

{#if View && player.frame}
	<View
		frame={player.frame}
		next={player.next}
		progress={still ? 0 : player.progress}
		time={still ? player.frame.t : player.time}
		params={run.values}
		t={translate}
		{selection}
		select={(id: string | null) => (selection = id)}
		dispatch={(action: unknown) => run.dispatch(action)}
	/>
{/if}
