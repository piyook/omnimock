<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { fetchPing, fetchUiMeta, type UiMeta } from './api.js';
	import EndpointsPage from './EndpointsPage.svelte';
	import LogViewer from './LogViewer.svelte';
	import OverviewPage from './OverviewPage.svelte';
	import SettingsPage from './SettingsPage.svelte';
	import ThemeSwitch from './ThemeSwitch.svelte';

	// The pages of the dashboard, in the order the sidebar lists them. Each is
	// reached by its hash (`#/settings`); anything else shows the overview.
	const pages = [
		{
			id: 'overview',
			title: 'Overview',
			icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
		},
		{
			id: 'endpoints',
			title: 'Endpoints',
			icon: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
		},
		{
			id: 'settings',
			title: 'Settings',
			icon: 'M4 7h9m4 0h3M4 17h3m4 0h9M15 5v4M9 15v4',
		},
	] as const;
	type Route = (typeof pages)[number]['id'];

	function routeFromHash(): Route {
		const id = window.location.hash.replace(/^#\/?/, '');
		return pages.find((item) => item.id === id)?.id ?? 'overview';
	}

	let route: Route = routeFromHash();

	// A new page starts from its top
	function showRoute() {
		route = routeFromHash();
		window.scrollTo(0, 0);
	}

	let meta: UiMeta | null = null;
	let online: boolean | null = null;
	let error: string | null = null;
	let timer: number | null = null;
	let logViewer: LogViewer;

	$: endpointCount = meta?.apiLinks?.length ?? 0;
	$: status = online === null ? 'Checking…' : online ? 'Running' : 'Not Running';

	const viewLog = () => logViewer.open();

	async function refresh() {
		try {
			const [m, p] = await Promise.all([fetchUiMeta(), fetchPing()]);
			meta = m;
			online = p;
			// Cleared only on success, so the message doesn't blink on every
			// retry while the server is down
			error = null;
		} catch (e) {
			online = false;
			error = e instanceof Error ? e.message : String(e);
		}
	}

	onMount(() => {
		void refresh();
		timer = window.setInterval(() => void refresh(), 2000);
	});

	onDestroy(() => {
		if (timer) window.clearInterval(timer);
	});
</script>

<svelte:window on:hashchange={showRoute} />

<div class="shell">
	<aside class="sidebar">
		<a class="brand" href="#/">
			<img src="/favicon.svg" alt="" width="28" height="28" />
			<span>OmniMock</span>
		</a>

		<nav class="nav" aria-label="Pages">
			{#each pages as item (item.id)}
				<a
					class="navLink"
					class:active={route === item.id}
					href={item.id === 'overview' ? '#/' : `#/${item.id}`}
					aria-current={route === item.id ? 'page' : undefined}
					cy-data="nav_{item.id}"
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d={item.icon} /></svg>
					<span>{item.title}</span>
					{#if item.id === 'endpoints'}
						<span class="navCount">{endpointCount}</span>
					{/if}
				</a>
			{/each}
		</nav>

		<p class="navGroup">Server</p>
		<dl class="facts" cy-data="server_facts">
			<div class="fact">
				<dt>Port</dt>
				<dd>{meta?.serverPort ?? '–'}</dd>
			</div>
			<div class="fact">
				<dt>Prefix</dt>
				<dd>{meta?.urlPrefix ? `/${meta.urlPrefix}` : '–'}</dd>
			</div>
		</dl>

		<ThemeSwitch serverTheme={meta?.uiTheme} />
		<p class="sidebarFoot muted">Refreshes every 2 seconds</p>
	</aside>

	<main>
		<header class="pageHeader">
			<div class="titleRow">
				<h1>{pages.find((item) => item.id === route)?.title}</h1>
				<div class="titleGroup">
					{#if meta?.version}
						<span class="versionPill" cy-data="server_version" title="omnimock version">
							v{meta.version}
						</span>
					{/if}
					<div
						class="statusPill"
						class:statusOnline={online}
						class:statusOffline={!online}
						cy-data="server_status"
					>
						{status}
					</div>
				</div>
			</div>
			<p class="errorLine muted">{error ?? ''}</p>
		</header>

		{#if route === 'overview'}
			<OverviewPage {meta} {viewLog} />
		{:else if route === 'endpoints'}
			<EndpointsPage {meta} />
		{:else}
			<SettingsPage {meta} {viewLog} />
		{/if}
	</main>
</div>

<LogViewer bind:this={logViewer} loggingOn={meta?.logRequests === 'ON'} />
