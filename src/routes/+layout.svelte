<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
    import '../style.css';
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
    import { dev } from '$app/environment';

	let { children } = $props();

    onMount(() => {
        if ('serviceWorker' in navigator && !dev) {
            navigator.serviceWorker.register(`${base}/service-worker.js`)
                .then(reg => console.log('Service Worker registered', reg))
                .catch(err => console.error('Service Worker registration failed', err));
        }
    });
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<h1>FinDash</h1>

{@render children()}
