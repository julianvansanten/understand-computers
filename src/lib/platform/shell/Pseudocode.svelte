<script lang="ts">
	import type { CodeLine } from '../visualization.ts';
	import { highlight } from './highlight.ts';
	let { lines, current }: { lines: CodeLine[]; current: string | undefined } = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (scrolls sideways, so must be reachable by keyboard) -->
<ol tabindex="0">
	{#each lines as line, index (line.id)}
		<li aria-current={line.id === current ? 'step' : undefined}>
			<!-- The list already tells screen readers the line number. -->
			<span class="gutter" aria-hidden="true">{index + 1}</span>
			<code>
				{#each highlight(line.text) as token, i (i)}{#if token.kind === 'plain'}{token.text}{:else}<span
							class={token.kind}
						>
							{token.text}
						</span>{/if}{/each}
			</code>
		</li>
	{/each}
</ol>

<style>
	ol {
		margin: 0;
		padding: 0;
		overflow-x: auto;
		list-style: none;
		font-family: var(--font-code);
		font-size: var(--text-s);
		line-height: 1.7;
	}
	li {
		display: grid;
		grid-template-columns: 3.5ch 1fr;
		width: max-content;
		min-width: 100%;
		border-left: 4px solid transparent;
	}
	/* The gutter: line numbers, then the line where every line of code starts. */
	.gutter {
		padding-right: 1ch;
		border-right: 1.5px solid var(--line);
		color: var(--ink-soft);
		text-align: right;
		user-select: none;
	}
	code {
		padding: 0 var(--space-3) 0 1.5ch;
		font-family: inherit;
		white-space: pre;
	}
	.keyword {
		color: var(--pen);
		font-weight: 700;
	}
	.number {
		color: var(--accent-purple);
	}
	.call {
		font-weight: 700;
	}
	li[aria-current] {
		border-color: var(--active-edge);
		background: var(--active);
		color: var(--active-text);
	}
	/* On the highlighted line, colors give way to that line's own text color, which is always readable. */
	li[aria-current] span {
		color: inherit;
	}
	li[aria-current] .gutter {
		font-weight: 700;
		border-color: var(--active-edge);
	}
</style>
