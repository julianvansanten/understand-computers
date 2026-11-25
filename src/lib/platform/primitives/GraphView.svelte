<script lang="ts" module>
	import type { StateName } from '../visualization.ts';
	export interface GraphNode {
		id: string;
		x: number;
		y: number;
		state: StateName;
		/** Small text under the node. */
		badge?: string;
		square?: boolean;
	}
	export interface GraphEdge {
		id: string;
		a: string;
		b: string;
		state: StateName;
		label?: string;
		broken?: boolean;
		strong?: boolean;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import StateGlyph from './StateGlyph.svelte';

	let {
		nodes,
		edges,
		selected = null,
		onnode,
		onedge,
		nodeLabel,
		edgeLabel,
		children
	}: {
		nodes: GraphNode[];
		edges: GraphEdge[];
		selected?: string | null;
		onnode?: (id: string) => void;
		onedge?: (id: string) => void;
		/** Spoken names; required when nodes or edges can be pressed. */
		nodeLabel?: (id: string) => string;
		edgeLabel?: (id: string) => string;
		/** Drawn over the edges and under the nodes. */
		children?: Snippet;
	} = $props();

	const byId = $derived(new Map(nodes.map((node) => [node.id, node])));
	const R = 24;

	// Makes a drawn element behave like a button, for mouse, touch and keyboard.
	function press(action: (() => void) | undefined, label: string | undefined) {
		if (!action) return {};
		return {
			role: 'button',
			tabindex: 0,
			'aria-label': label,
			onclick: action,
			onkeydown: (event: KeyboardEvent) => {
				if (event.key !== 'Enter' && event.key !== ' ') return;
				event.preventDefault();
				event.stopPropagation();
				action();
			}
		};
	}
</script>

{#each edges as edge (edge.id)}
	{@const a = byId.get(edge.a)!}
	{@const b = byId.get(edge.b)!}
	<g
		class="edge"
		class:pressable={onedge}
		{...press(onedge && (() => onedge(edge.id)), edgeLabel?.(edge.id))}
	>
		<line class="hit" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
		<line
			class="wire"
			class:broken={edge.broken}
			x1={a.x}
			y1={a.y}
			x2={b.x}
			y2={b.y}
			style="stroke: var(--{edge.state === 'idle' ? 'line-strong' : `${edge.state}-edge`})"
			stroke-width={edge.strong ? 8 : edge.state === 'idle' ? 2.5 : 5}
		/>
		{#if edge.broken}
			<StateGlyph state="failed" x={(a.x + b.x) / 2} y={(a.y + b.y) / 2} size={3} />
		{:else if edge.label}
			<text class="edge-label" x={(a.x + b.x) / 2} y={(a.y + b.y) / 2}>{edge.label}</text>
		{/if}
	</g>
{/each}
{@render children?.()}
{#each nodes as node (node.id)}
	<g
		class="node"
		class:pressable={onnode}
		class:selected={selected === node.id}
		{...press(onnode && (() => onnode(node.id)), nodeLabel?.(node.id))}
		aria-pressed={onnode ? selected === node.id : undefined}
	>
		<rect
			x={node.x - R}
			y={node.y - R}
			width={2 * R}
			height={2 * R}
			rx={node.square ? 4 : R}
			style="fill: var(--{node.state}); stroke: var(--{node.state}-edge)"
		/>
		<text x={node.x} y={node.y} class="name" style="fill: var(--{node.state}-text)">{node.id}</text>
		<StateGlyph state={node.state} x={node.x + R} y={node.y - R} size={1.6} />
		{#if node.badge}
			<!-- The space keeps name and badge apart as words; it is not drawn. -->
			<text class="badge" x={node.x} y={node.y + R + 14}>{` ${node.badge}`}</text>
		{/if}
	</g>
{/each}

<style>
	.hit {
		stroke: transparent;
		stroke-width: 34;
	}
	.broken {
		stroke-dasharray: 6 10;
	}
	.pressable {
		cursor: pointer;
	}
	.edge.pressable:hover .wire,
	.node.pressable:hover rect {
		stroke: var(--pen);
	}
	.edge:focus-visible,
	.node:focus-visible {
		outline: none;
	}
	.edge:focus-visible .hit {
		stroke: var(--pen);
		stroke-opacity: 0.35;
	}
	.node:focus-visible rect,
	.selected rect {
		stroke: var(--pen) !important;
		stroke-width: 6;
	}
	rect {
		stroke-width: 2.5;
	}
	.name {
		font-size: 18px;
		font-weight: 600;
	}
	.badge,
	.edge-label {
		font-size: 16px;
		paint-order: stroke;
		stroke: var(--paper);
		stroke-width: 6px;
	}
</style>
