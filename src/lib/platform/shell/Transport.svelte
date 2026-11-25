<script lang="ts">
	import Button from '../ui/Button.svelte';
	import Icon, { icons } from '../ui/Icon.svelte';
	import type { Run } from '../engine/run.svelte.ts';
	import { n, t } from '../i18n/context.ts';

	let { run, compact = false }: { run: Run; compact?: boolean } = $props();
	const player = $derived(run.player);
	const speeds = [0.25, 0.5, 1, 2, 4, 8];

	$effect(() => {
		if (!player.playing) return;
		let last = performance.now();
		let handle = requestAnimationFrame(function tick(now) {
			// A background tab resumes where it was instead of jumping ahead.
			player.advance(Math.min(0.1, Math.max(0, now - last) / 1000));
			last = now;
			handle = requestAnimationFrame(tick);
		});
		return () => cancelAnimationFrame(handle);
	});
</script>

<div class="transport" role="group" aria-label={t('player.controls')}>
	{#if !compact}
		<Button aria-label={t('player.start')} title={t('player.start')} onclick={() => player.start()}>
			<Icon path={icons.start} />
		</Button>
	{/if}
	<Button
		aria-label={t('player.back')}
		title={t('player.back')}
		disabled={player.index === 0 && player.offset === 0}
		onclick={() => player.step(-1)}
	>
		<Icon path={icons.back} />
	</Button>
	<Button
		primary
		aria-label={player.playing ? t('player.pause') : t('player.play')}
		title={player.playing ? t('player.pause') : t('player.play')}
		onclick={() => player.toggle()}
	>
		<Icon path={player.playing ? icons.pause : icons.play} filled />
	</Button>
	<Button
		aria-label={t('player.forward')}
		title={t('player.forward')}
		disabled={player.atEnd}
		onclick={() => player.step(1)}
	>
		<Icon path={icons.forward} />
	</Button>
	<input
		class="timeline"
		type="range"
		min="0"
		max={player.duration}
		step="any"
		value={player.time}
		aria-label={t('player.timeline')}
		aria-valuetext={t('player.position', { step: player.index + 1, total: player.frames.length })}
		oninput={(event) => {
			player.playing = false;
			const moment = event.currentTarget.valueAsNumber;
			if (moment > 0) player.seek(moment);
			else player.start();
		}}
	/>
	{#if !compact}
		<label class="speed">
			<span>{t('player.speed')}</span>
			<select bind:value={player.speed}>
				{#each speeds as speed (speed)}
					<option value={speed}>{n(speed)}×</option>
				{/each}
			</select>
		</label>
		<Button onclick={() => run.reset()}><Icon path={icons.reset} />{t('player.reset')}</Button>
	{/if}
</div>

<style>
	.transport {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}
	.timeline {
		flex: 1 1 10rem;
		min-width: 8rem;
		height: var(--target);
	}
	.speed {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	select {
		min-height: var(--target);
		padding: 0 var(--space-2);
		border: 1.5px solid var(--line-strong);
		border-radius: var(--radius);
		background: var(--paper);
	}
</style>
