<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import Button from '../ui/Button.svelte';
	import Panel from '../ui/Panel.svelte';
	import Legend from './Legend.svelte';
	import ParameterPanel from './ParameterPanel.svelte';
	import Pseudocode from './Pseudocode.svelte';
	import RunView from './RunView.svelte';
	import Transport from './Transport.svelte';
	import { FRAME_LIMIT } from '../engine/model.ts';
	import { decode, encode } from '../engine/parameters.ts';
	import { Run } from '../engine/run.svelte.ts';
	import { currentLocale, n, t } from '../i18n/context.ts';
	import { translate as translateWith, type Translate } from '../i18n/translate.ts';
	import type { AnyVisualization, VisualizationMeta } from '../visualization.ts';

	let { visualization, meta }: { visualization: AnyVisualization; meta: VisualizationMeta } =
		$props();

	const run = untrack(() => new Run(visualization));
	const player = run.player;
	const text = $derived(meta.text[currentLocale()]);
	const translate: Translate = (key, values) =>
		translateWith(visualization.messages, currentLocale(), key, values);
	const explanation = $derived(
		player.frame ? translate(player.frame.explain.key, player.frame.explain.values) : ''
	);

	let selection = $state<string | null>(null);
	let presenting = $state(false);
	let panelHidden = $state(false);
	let shareStatus = $state('');
	let urlTimer: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		// The query string is only known in the browser: pages are prerendered without it.
		if (location.search) {
			const { values, seed } = decode(
				visualization.parameters,
				new URLSearchParams(location.search)
			);
			run.setup(values, seed);
		}
		return () => {
			clearTimeout(urlTimer);
			setPresenting(false);
		};
	});

	function shareUrl() {
		// Built anew on each call, so it need not be reactive.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const url = new URL(location.href);
		url.search = encode(run.values, run.seed, visualization.version).toString();
		return url;
	}
	function updateUrl() {
		shareStatus = '';
		clearTimeout(urlTimer);
		// Waits until a slider rests; browsers limit how often the address may change.
		urlTimer = setTimeout(() => goto(shareUrl(), { shallow: true, replace: true }), 300);
	}
	async function share() {
		try {
			await navigator.clipboard.writeText(shareUrl().href);
			shareStatus = t('shell.shared');
		} catch {
			// Clipboard needs https or permission; the address bar always works.
			await goto(shareUrl(), { shallow: true, replace: true });
			shareStatus = t('shell.shareFailed');
		}
	}

	function setPresenting(on: boolean) {
		if (on === presenting) return;
		presenting = on;
		panelHidden = on;
		document.documentElement.toggleAttribute('data-present', on);
		// Fullscreen may be refused; presenting still works in the window.
		if (on) document.documentElement.requestFullscreen?.().catch(() => {});
		else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
	}

	const shortcuts: Record<string, () => void> = {
		' ': () => player.toggle(),
		ArrowRight: () => player.step(1),
		ArrowLeft: () => player.step(-1)
	};
	// Presenter clickers send these; outside presenting they must keep scrolling the page.
	const clicker: Record<string, () => void> = {
		PageDown: () => player.step(1),
		PageUp: () => player.step(-1)
	};

	function onkeydown(event: KeyboardEvent) {
		if (event.ctrlKey || event.metaKey || event.altKey) return;
		const target = event.target as Element;
		const action = presenting ? clicker[event.key] : undefined;
		if (action) {
			event.preventDefault();
			return action();
		}
		if (target.closest('input, select, textarea, [tabindex="0"], a')) return;
		if (event.key === ' ' && target.closest('button')) return;
		const shortcut = shortcuts[event.key];
		if (!shortcut) return;
		event.preventDefault();
		shortcut();
	}
	function onShellKeydown(event: KeyboardEvent) {
		// A single-letter shortcut may only work with focus inside (WCAG 2.1.4).
		if (event.ctrlKey || event.metaKey || event.altKey) return;
		if ((event.target as Element).closest('input[type="number"], select')) return;
		if (event.key.toLowerCase() === 'p') setPresenting(!presenting);
	}
</script>

{#snippet code(pseudocode: NonNullable<AnyVisualization['pseudocode']>)}
	<Panel title={t('shell.pseudocode')}>
		<Pseudocode lines={pseudocode(run.values)} current={player.frame?.codeLine} />
	</Panel>
{/snippet}

<svelte:window {onkeydown} />
<svelte:document
	onfullscreenchange={() => {
		if (!document.fullscreenElement) setPresenting(false);
	}}
/>

<!-- svelte-ignore a11y_no_static_element_interactions (shortcut only; the button does the same) -->
<div class="shell" class:presenting class:panelHidden onkeydown={onShellKeydown}>
	<header>
		<div>
			<h1>{text.title}</h1>
			{#if !presenting}<p>{text.description}</p>{/if}
		</div>
		<div class="actions">
			<Button onclick={share}>{t('shell.share')}</Button>
			{#if presenting}
				<Button onclick={() => (panelHidden = !panelHidden)}>
					{panelHidden ? t('shell.panelShow') : t('shell.panelHide')}
				</Button>
			{/if}
			<Button onclick={() => setPresenting(!presenting)}>
				{presenting ? t('shell.presentStop') : t('shell.present')}
			</Button>
			<span role="status">{shareStatus}</span>
		</div>
	</header>

	<!-- Pinned while scrolling the settings, unless pseudocode below it must be reachable. -->
	<div class="main" class:sticky={!visualization.pseudocode || presenting}>
		<div class="stage">
			<RunView {run} {translate} bind:selection />
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions (Escape closes it, also from inside) -->
			<details
				class="legend"
				onkeydown={(event) => {
					if (event.key !== 'Escape') return;
					event.currentTarget.open = false;
					event.currentTarget.querySelector('summary')?.focus();
				}}
			>
				<summary>{t('shell.legend')}</summary>
				<div class="legend-content">
					<Legend states={visualization.legend} {translate} />
				</div>
			</details>
		</div>
		{#if run.truncated}
			<p class="notice" role="alert">{t('shell.truncated', { count: FRAME_LIMIT })}</p>
		{/if}
		<section class="explanation" aria-label={t('shell.explanation')}>
			<p aria-live={player.playing ? 'off' : 'polite'}>{explanation}</p>
			<span class="position">
				{t('player.position', { step: player.index + 1, total: player.frames.length })}
			</span>
		</section>
		<div class="controls"><Transport {run} /></div>
		{#if visualization.pseudocode && !presenting}
			{@render code(visualization.pseudocode)}
		{/if}
	</div>

	{#if !panelHidden}
		<aside aria-label={t('shell.parameters')}>
			<Panel title={t('shell.parameters')}>
				<ParameterPanel {run} {translate} onchange={updateUrl} />
			</Panel>
			{#if visualization.Detail}
				<Panel title={t('shell.detail')}>
					<RunView {run} {translate} part="Detail" bind:selection />
				</Panel>
			{/if}
			{#if visualization.pseudocode && presenting}
				{@render code(visualization.pseudocode)}
			{/if}
			<Panel title={t('shell.stats')}>
				<dl>
					{#each visualization.stats as stat (stat)}
						<div>
							<dt>{translate(`stat.${stat}`)}</dt>
							<dd>{n(player.frame?.stats?.[stat] ?? 0)}</dd>
						</div>
					{/each}
				</dl>
			</Panel>
		</aside>
	{/if}
</div>

<style>
	.shell {
		/* Leaves room for the explanation and controls without scrolling on a 768px high laptop. */
		--stage-height: max(16rem, 100dvh - 24.5rem);
		display: grid;
		grid-template-columns: minmax(0, 1fr) 20rem;
		gap: var(--space-4);
		align-items: start;
	}
	.panelHidden {
		grid-template-columns: minmax(0, 1fr);
	}
	header {
		grid-column: 1 / -1;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: end;
		gap: var(--space-3);
	}
	header p {
		max-width: 100ch;
		color: var(--ink-soft);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}
	/* Present but empty until something is announced: must not take up a gap. */
	[role='status']:empty {
		margin-left: calc(-1 * var(--space-2));
	}
	.main,
	aside {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--space-3);
		min-width: 0;
	}
	.sticky {
		position: sticky;
		top: var(--space-3);
	}
	.stage {
		position: relative;
	}
	/* Over the paper's top-left corner, opaque so the drawing does not show through. */
	.legend {
		position: absolute;
		top: var(--space-2);
		left: var(--space-2);
		z-index: 1;
	}
	summary {
		display: inline-flex;
		align-items: center;
		min-height: var(--target);
		padding: 0 var(--space-3);
		border: 1.5px solid var(--line-strong);
		border-radius: var(--radius);
		background: var(--paper);
		cursor: pointer;
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary:hover,
	.legend[open] summary {
		border-color: var(--pen);
	}
	.legend-content {
		margin-top: var(--space-1);
		padding: var(--space-3);
		background: var(--paper);
		border: 1.5px solid var(--line-strong);
		border-radius: var(--radius);
	}
	.explanation {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
		/* Two lines reserved: the controls must not jump while stepping. */
		min-height: calc(3em + 2 * var(--space-1));
		padding: var(--space-1) var(--space-4);
		border-left: 6px solid var(--active-edge);
		background: var(--paper);
		font-size: var(--text-l);
		line-height: 1.5;
	}
	.position {
		flex: none;
		color: var(--ink-soft);
		font-size: var(--text-s);
		font-variant-numeric: tabular-nums;
	}
	.notice {
		padding: var(--space-3) var(--space-4);
		background: var(--candidate);
		color: var(--candidate-text);
	}
	dl {
		display: grid;
		gap: var(--space-1);
		margin: 0;
	}
	dl div {
		display: flex;
		justify-content: space-between;
		gap: var(--space-3);
	}
	dd {
		margin: 0;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.presenting {
		--stage-height: 66dvh;
		gap: var(--space-2);
	}
	.presenting aside {
		max-height: 86dvh;
		overflow-y: auto;
	}
	@media (max-width: 60rem) {
		.shell {
			grid-template-columns: minmax(0, 1fr);
		}
		.sticky {
			position: static;
		}
	}
</style>
