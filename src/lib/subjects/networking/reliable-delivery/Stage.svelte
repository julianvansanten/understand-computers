<script lang="ts">
	import Packet from '#lib/platform/primitives/Packet.svelte';
	import Stage from '#lib/platform/primitives/Stage.svelte';
	import type { StageProps, StateName } from '#lib/platform/visualization.ts';
	import type { DeliveryState, Message } from './model.ts';
	import type { DeliveryValues } from './parameters.ts';

	let { frame, time, t }: StageProps<DeliveryState, DeliveryValues> = $props();
	const s = $derived(frame.state);

	const SENDER = 300;
	const RECEIVER = 760;
	const TOP = 130;
	const BOTTOM = 425;

	// The present stays at three quarters of the height; history scrolls up.
	const from = $derived(Math.max(0, time - s.span * 0.75));
	const y = (moment: number) => TOP + ((moment - from) / s.span) * (BOTTOM - TOP);

	function at(message: Message, moment: number) {
		const part = (moment - message.sentAt) / (message.arrivesAt - message.sentAt);
		const [start, end] = message.kind === 'data' ? [SENDER, RECEIVER] : [RECEIVER, SENDER];
		return { x: start + (end - start) * part, y: y(moment) };
	}
	const arrows = $derived(
		s.messages
			.filter((message) => message.sentAt <= time)
			.map((message) => {
				const lost = message.lostAt !== null && time >= message.lostAt;
				const arrived = !lost && time >= message.arrivesAt;
				const now = lost ? message.lostAt! : Math.min(time, message.arrivesAt);
				const state: StateName = lost ? 'failed' : arrived ? 'done' : 'active';
				return {
					message,
					state,
					arrived,
					start: at(message, message.sentAt),
					end: at(message, now)
				};
			})
	);

	const box = $derived(Math.min(34, 840 / s.total));
	const boxX = (number: number) => 90 + number * box;
	const numbers = $derived(Array.from({ length: s.total }, (_, i) => i));
	const senderState = (number: number): StateName =>
		number < s.base ? 'done' : number < s.highest ? 'candidate' : 'idle';
	const receiverState = (number: number): StateName =>
		number < s.delivered.length ? 'done' : 'idle';
	const waiting = $derived(s.timerEndsAt === null ? 0 : Math.max(0, s.timerEndsAt - time));
</script>

{#snippet row(top: number, label: string, state: (number: number) => StateName)}
	<text x="50" y={top + 15} font-size="15" style="text-anchor: start" class="label">{label}</text>
	{#each numbers as number (number)}
		<rect
			x={boxX(number) + 46}
			y={top}
			width={box - 4}
			height="30"
			style="fill: var(--{state(number)}); stroke: var(--{state(number)}-edge)"
			stroke-width="1.5"
		/>
		<text
			x={boxX(number) + 46 + (box - 4) / 2}
			y={top + 15}
			font-size="14"
			style="fill: var(--{state(number)}-text)"
		>
			{number}
		</text>
	{/each}
{/snippet}

<Stage label={t('stage.label')}>
	{#each arrows as { message, state, start, end, arrived } (message.id)}
		<line
			x1={start.x}
			y1={start.y}
			x2={end.x}
			y2={end.y}
			style="stroke: var(--{state}-edge)"
			stroke-width="2"
			stroke-dasharray={message.kind === 'ack' ? '6 5' : undefined}
		/>
		{#if !arrived}
			<Packet
				x={end.x}
				y={end.y}
				{state}
				label={message.kind === 'ack' ? `A${message.number}` : String(message.number)}
			/>
		{:else}
			<text class="label" x={end.x + (message.kind === 'ack' ? -26 : 26)} y={end.y} font-size="14">
				{message.kind === 'ack' ? `A${message.number}` : message.number}
			</text>
		{/if}
	{/each}
	<!-- Covers history that scrolled out of the diagram. -->
	<rect class="header" x="-960" y="-100" width="2880" height={TOP + 78} />
	{@render row(8, t('row.sender'), senderState)}
	{@render row(54, t('row.receiver'), receiverState)}
	<path
		class="window"
		d="M{boxX(s.base) + 44} 5V42H{boxX(Math.min(s.base + s.window, s.total)) + 44}V5"
	/>
	<line class="side" x1={SENDER} y1={TOP - 22} x2={SENDER} y2={BOTTOM} />
	<line class="side" x1={RECEIVER} y1={TOP - 22} x2={RECEIVER} y2={BOTTOM} />
	<line class="now" x1={SENDER - 30} y1={y(time)} x2={RECEIVER + 30} y2={y(time)} />
	<text class="label" x={SENDER - 120} y={TOP} font-size="16">{t('row.sender')}</text>
	<text class="label" x={RECEIVER + 100} y={TOP} font-size="16">{t('row.receiver')}</text>
	{#if waiting > 0}
		<text class="label" x={SENDER - 130} y={y(time)} font-size="16">
			{t('timer', { left: Math.round(waiting) })}
		</text>
	{/if}
</Stage>

<style>
	.header {
		fill: var(--paper);
	}
	.window {
		fill: none;
		stroke: var(--active-edge);
		stroke-width: 3;
	}
	.side {
		stroke: var(--ink);
		stroke-width: 3;
	}
	.now {
		stroke: var(--ink-soft);
		stroke-dasharray: 3 5;
	}
	.label {
		paint-order: stroke;
		stroke: var(--paper);
		stroke-width: 5px;
	}
</style>
