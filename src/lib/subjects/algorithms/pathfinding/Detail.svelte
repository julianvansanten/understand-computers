<script lang="ts">
	import type { StageProps } from '#lib/platform/visualization.ts';
	import type { PathfindingState } from './model.ts';
	import type { PathfindingValues } from './parameters.ts';
	let { frame, t }: StageProps<PathfindingState, PathfindingValues> = $props();
</script>

<table>
	<thead>
		<tr>
			<th scope="col">{t('detail.node')}</th>
			<th scope="col">{t('detail.cost')}</th>
			<th scope="col">{t('detail.via')}</th>
		</tr>
	</thead>
	<tbody>
		{#each frame.state.nodes as { id } (id)}
			{@const known = frame.state.known[id]}
			<tr>
				<th scope="row">{id}</th>
				<td>{known?.cost ?? '∞'}</td>
				<td>{known?.via ?? ''}</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-s);
		font-variant-numeric: tabular-nums;
	}
	th,
	td {
		padding: 0 var(--space-2);
		border-bottom: 1px solid var(--line);
		text-align: left;
	}
</style>
