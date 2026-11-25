<script lang="ts">
	import Button from '../ui/Button.svelte';
	import type { Run } from '../engine/run.svelte.ts';
	import { MAX_SEED, type Parameter } from '../engine/parameters.ts';
	import type { Translate } from '../i18n/translate.ts';
	import { n, t } from '../i18n/context.ts';

	let { run, translate, onchange }: { run: Run; translate: Translate; onchange: () => void } =
		$props();
	const id = $props.id();
	const parameters = $derived(
		Object.entries(run.visualization.parameters as Record<string, Parameter>)
	);

	function change(key: string, value: string | number) {
		run.change(key, value);
		onchange();
	}
	function changeSeed(value: number) {
		if (!Number.isInteger(value) || value < 1 || value > MAX_SEED) return;
		run.setup(run.values, value);
		onchange();
	}
</script>

<div class="fields">
	{#each parameters as [key, parameter] (key)}
		{#if !parameter.when || parameter.when(run.values)}
			<div>
				<label for="{id}-{key}">
					<span>{translate(`param.${key}`)}</span>
					{#if parameter.kind === 'range'}
						<output for="{id}-{key}">{n(run.values[key] as number)}{parameter.unit ?? ''}</output>
					{/if}
				</label>
				{#if parameter.kind === 'range'}
					<input
						id="{id}-{key}"
						type="range"
						min={parameter.min}
						max={parameter.max}
						step={parameter.step}
						value={run.values[key]}
						oninput={(event) => change(key, event.currentTarget.valueAsNumber)}
					/>
				{:else}
					<select
						id="{id}-{key}"
						value={run.values[key]}
						onchange={(event) => change(key, event.currentTarget.value)}
					>
						{#each parameter.options as option (option)}
							<option value={option}>{translate(`param.${key}.${option}`)}</option>
						{/each}
					</select>
				{/if}
			</div>
		{/if}
	{/each}
	<div>
		<label for="{id}-seed">{t('shell.seed')}</label>
		<div class="seed">
			<input
				id="{id}-seed"
				type="number"
				min="1"
				max={MAX_SEED}
				value={run.seed}
				onchange={(event) => changeSeed(event.currentTarget.valueAsNumber)}
			/>
			<Button
				onclick={() => {
					run.newSeed();
					onchange();
				}}
			>
				{t('shell.newSeed')}
			</Button>
		</div>
	</div>
</div>

<style>
	.fields {
		display: grid;
		gap: var(--space-3);
	}
	label {
		display: flex;
		justify-content: space-between;
		gap: var(--space-2);
		font-size: var(--text-s);
	}
	output {
		font-variant-numeric: tabular-nums;
	}
	input,
	select {
		width: 100%;
		min-height: var(--target);
		margin: 0;
	}
	select,
	input[type='number'] {
		padding: 0 var(--space-2);
		border: 1.5px solid var(--line-strong);
		border-radius: var(--radius);
		background: var(--paper);
	}
	.seed {
		display: flex;
		gap: var(--space-2);
	}
	.seed input {
		flex: 1;
		min-width: 4.5rem;
	}
</style>
