<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { fetchPing, fetchUiMeta, type UiMeta } from './api.js';
	import ChaosCard from './ChaosCard.svelte';
	import LogViewer from './LogViewer.svelte';

	let meta: UiMeta | null = null;
	let online: boolean | null = null;
	let error: string | null = null;
	let timer: number | null = null;
	let logViewer: LogViewer;

	// A list longer than this scrolls inside a fixed height window
	const SCROLL_AFTER = 6;
	$: endpointCount = meta?.apiLinks?.length ?? 0;
	$: maxLogged = meta?.maxLoggedRequests ?? 10;
	$: status = online === null ? 'Checking…' : online ? 'Running' : 'Not Running';

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

<main>
	<header class="pageHeader">
		<section class="card">
			<div class="titleRow">
				<div class="titleGroup">
					<h1>OmniMock</h1>
					{#if meta?.version}
						<span class="versionPill" cy-data="server_version" title="omnimock version">
							v{meta.version}
						</span>
					{/if}
				</div>
				<div
					class="statusPill"
					class:statusOnline={online}
					class:statusOffline={!online}
					cy-data="server_status"
				>
					{status}
				</div>
			</div>
			<p class="errorLine muted">{error ?? ''}</p>
		</section>
	</header>

	<section class="card" cy-data="server">
		<h2>Server</h2>
		<div class="grid">
			<div class="kv">
				<span class="muted">Server Address</span>
				<span class="badge" cy-data="server_address">localhost</span>
			</div>
			<div class="kv">
				<span class="muted">Server Port</span>
				<span class="badge" cy-data="server_port">{meta?.serverPort ?? ''}</span>
			</div>
			<div class="kv">
				<span class="muted">Server URL Prefix</span>
				<span class="badge" cy-data="url_prefix">{meta?.urlPrefix || 'None'}</span>
			</div>
			<div class="kv">
				<span class="muted">Project</span>
				<span class="badge" cy-data="project_name">{meta?.projectName ?? ''}</span>
			</div>
			<div class="kv">
				<span class="muted">Database Persistence</span>
				<span class="badge" cy-data="db_persist">{meta?.dbPersist ?? 'OFF'}</span>
			</div>
		</div>
	</section>

	<section class="card" cy-data="endpoints">
		<div class="titleGroup" style="margin: 0 0 12px 0;">
			<h2 style="margin: 0;">API endpoints</h2>
			<span class="countPill" cy-data="endpoint_count" title="Total API endpoints">
				{endpointCount} {endpointCount === 1 ? 'endpoint' : 'endpoints'}
			</span>
		</div>
		<div class="endpoints" class:scrollList={endpointCount > SCROLL_AFTER}>
			{#each meta?.apiLinks ?? [] as link (link.href)}
				<a class="endpointLink" cy-data="endpoint" href={link.href}>{link.label}</a>
			{/each}
		</div>
		<p class="muted cardNote">
			Each folder in <code>src/api</code> is an endpoint. A link opens its GET reply;
			an endpoint may answer other methods and paths below it.
			<a class="textLink" href="/api">List as JSON</a>
		</p>
	</section>

	<ChaosCard {meta} />

	<section class="card" cy-data="diagnostics">
		<h2>Request log</h2>
		<div class="grid">
			<div class="kv">
				<span class="muted">Request Log</span>
				<span class="badge" cy-data="log_requests">{meta?.logRequests ?? 'OFF'}</span>
			</div>
			<div class="kv">
				<span class="muted">Max Logged Requests</span>
				<span class="badge" cy-data="max_logged_requests">
					{maxLogged}
				</span>
			</div>
			<div class="kv kvWide">
				<span class="muted">Last Logged Requests</span>
				<button
					class="fileLink"
					cy-data="request_log_link"
					title={`View the last ${maxLogged} logged requests`}
					on:click={() => logViewer.open()}
				>
					View request log
				</button>
			</div>
		</div>
		<p class="muted cardNote" cy-data="max_logged_requests_note">
			The log keeps the last {maxLogged} requests made to endpoints
			that call the <code>logger</code> function. To change this, set
			<code>MAX_LOGGED_REQUESTS</code> (1 to 100) in <code>.env</code>.
		</p>
	</section>

	<div class="footerNote">
		Change settings in <code>.env</code> and restart the server.
	</div>
</main>

<LogViewer bind:this={logViewer} loggingOn={meta?.logRequests === 'ON'} />
