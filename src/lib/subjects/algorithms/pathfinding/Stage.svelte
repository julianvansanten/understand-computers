<script lang="ts">
	import GraphView from '#lib/platform/primitives/GraphView.svelte';
	import Stage from '#lib/platform/primitives/Stage.svelte';
	import type { StageProps, StateName } from '#lib/platform/visualization.ts';
	import type { PathfindingState } from './model.ts';
	import type { PathfindingValues } from './parameters.ts';

	let { frame, params, t }: StageProps<PathfindingState, PathfindingValues> = $props();
	const s = $derived(frame.state);

	function nodeState(id: PathfindingState['nodes'][number]['id']): StateName {
		if (s.path.includes(id) || s.current === id) return 'active';
		if (s.visited.includes(id)) return 'done';
		if (s.frontier.includes(id)) return 'candidate';
		return 'idle';
	}
	function inPath(a: string, b: string) {
		return s.path.some((id, i) => {
			const following = s.path[i + 1];
			return (id === a && following === b) || (id === b && following === a);
		});
	}
	function role(id: string) {
		if (id === params.start) return t('start.badge');
		if (id === params.goal) return t('goal.badge');
		return '';
	}

	const nodes = $derived(
		s.nodes.map((node) => {
			const cost = s.known[node.id]?.cost;
			return {
				...node,
				state: nodeState(node.id),
				square: node.id === params.start || node.id === params.goal,
				badge: [role(node.id), cost === undefined ? '' : t('cost.badge', { cost })]
					.filter(Boolean)
					.join(' ')
			};
		})
	);
	const edges = $derived(
		s.edges.map((edge) => {
			const path = inPath(edge.a, edge.b);
			let state: StateName = path ? 'active' : 'idle';
			if (s.looking?.edge === edge.id) state = s.looking.useful ? 'active' : 'failed';
			return { ...edge, label: String(edge.weight), state, strong: path };
		})
	);
</script>

<Stage label={t('stage.label')}>
	<GraphView {nodes} {edges} />
</Stage>
