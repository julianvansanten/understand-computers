<script lang="ts">
	import GraphView from '#lib/platform/primitives/GraphView.svelte';
	import Packet from '#lib/platform/primitives/Packet.svelte';
	import Stage from '#lib/platform/primitives/Stage.svelte';
	import type { StageProps } from '#lib/platform/visualization.ts';
	import { AFTERGLOW, type PacketState, type RoutingState, type ToggleLink } from './model.ts';
	import type { RoutingValues } from './parameters.ts';

	let {
		frame,
		time,
		params,
		t,
		selection,
		select,
		dispatch
	}: StageProps<RoutingState, RoutingValues, ToggleLink> = $props();
	const s = $derived(frame.state);

	const position = $derived(new Map(s.topology.nodes.map((node) => [node.id, node])));

	/** Where a packet is drawn, or null when it is no longer (or not yet) visible. */
	function place(packet: PacketState, waitingBefore: number) {
		const from = position.get(packet.at)!;
		const ended = packet.status === 'dropped' || packet.status === 'delivered';
		if (ended && time - packet.endedAt > AFTERGLOW) return null;
		if (packet.status === 'waiting' && packet.to) {
			return { x: from.x - 20 + waitingBefore * 14, y: from.y - 46 };
		}
		// A lost packet stays where it was; only one that had left is drawn on the link.
		const to = packet.to && position.get(packet.to);
		const moment = packet.status === 'dropped' ? packet.endedAt : time;
		if (to && packet.arrive > packet.depart && packet.status !== 'delivered') {
			const part = Math.min(
				1,
				Math.max(0, (moment - packet.depart) / (packet.arrive - packet.depart))
			);
			return { x: from.x + (to.x - from.x) * part, y: from.y + (to.y - from.y) * part };
		}
		return { x: from.x, y: from.y - 46 };
	}

	const states = {
		waiting: 'candidate',
		flying: 'active',
		delivered: 'done',
		dropped: 'failed'
	} as const;

	const packets = $derived.by(() => {
		// Local to this calculation, so it need not be reactive.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const waiting = new Map<string, number>();
		return s.packets.flatMap((packet) => {
			const key = `${packet.at} ${packet.to}`;
			const before = waiting.get(key) ?? 0;
			if (packet.status === 'waiting') waiting.set(key, before + 1);
			const at = place(packet, before);
			return at ? [{ ...at, id: packet.id, state: states[packet.status] }] : [];
		});
	});
	const nodes = $derived(
		s.topology.nodes.map((node) => ({
			...node,
			state: 'idle' as const,
			square: node.host,
			badge: node.host ? t(`host.${node.id}`) : undefined
		}))
	);
	const edges = $derived(
		s.topology.links.map((link) => {
			const broken = s.down.includes(link.id);
			return {
				...link,
				broken,
				state: broken ? ('failed' as const) : ('idle' as const),
				label:
					params.metric === 'latency' ? t('link.latency', { latency: link.latency }) : undefined
			};
		})
	);
	function nodeLabel(id: string) {
		const host = position.get(id)!.host;
		return t('node.select', { node: host ? `${id} ${t(`host.${id}`)}` : id });
	}
	function edgeLabel(id: string) {
		const link = s.topology.links.find((l) => l.id === id)!;
		return t(s.down.includes(id) ? 'link.restore' : 'link.break', {
			a: link.a,
			b: link.b,
			latency: link.latency
		});
	}
</script>

<Stage label={t('stage.label')}>
	<GraphView
		{nodes}
		{edges}
		selected={selection}
		onnode={(id) => select(selection === id ? null : id)}
		onedge={(id) => dispatch({ toggle: id })}
		{nodeLabel}
		{edgeLabel}
	/>
	<!-- Packets must not catch clicks meant for a link. -->
	<g style="pointer-events: none">
		{#each packets as packet (packet.id)}
			<Packet x={packet.x} y={packet.y} label={String(packet.id)} state={packet.state} />
		{/each}
	</g>
</Stage>
