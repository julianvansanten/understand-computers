<script lang="ts">
	import { onMount } from 'svelte';
	import Button from './Button.svelte';
	import { t } from '../i18n/context.ts';

	let dark = $state(false);
	onMount(() => {
		const chosen = document.documentElement.dataset.theme;
		dark = chosen ? chosen === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
	});

	function toggle() {
		dark = !dark;
		const theme = dark ? 'dark' : 'light';
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('theme', theme);
		} catch {
			// Storage can be blocked on school devices; the choice then lasts for this page.
		}
	}
</script>

<Button onclick={toggle}>{dark ? t('theme.toLight') : t('theme.toDark')}</Button>
