<script lang="ts">
	import type { UiMeta } from './api.js';
	import { chaosFrequencyLabel } from './labels.js';

	export let meta: UiMeta | null;
	// Opens the request log viewer
	export let viewLog: () => void;

	$: endpointCount = meta?.apiLinks?.length ?? 0;
	$: maxLogged = meta?.maxLoggedRequests ?? 10;
	$: loggingOn = meta?.logRequests === 'ON';
	$: chaosOn = meta?.chaosStatus === 'ENABLED';
	$: chaosLabel = meta && chaosOn ? chaosFrequencyLabel(meta) : '';
	$: injected = meta?.chaosInjected ?? 0;
	$: saved = meta?.dbPersist === 'ON';
	$: prefix = meta?.urlPrefix ? `/${meta.urlPrefix}` : '';

	// The figures across the top; each leads to its page
	$: tiles = [
		{
			id: 'endpoints',
			href: '#/endpoints',
			label: 'Endpoints',
			value: endpointCount,
			note: prefix ? `Under ${prefix}` : 'No URL prefix',
		},
		{
			id: 'chaos',
			href: '#/settings',
			label: 'Chaos',
			value: chaosLabel || 'Off',
			note: `${injected} ${injected === 1 ? 'error' : 'errors'} injected`,
		},
		{
			id: 'request_log',
			href: '#/settings',
			label: 'Request log',
			value: loggingOn ? 'On' : 'Off',
			note: `Keeps the last ${maxLogged}`,
		},
		{
			id: 'database',
			href: '#/settings',
			label: 'Database',
			value: saved ? 'Saved' : 'In memory',
			note: saved ? 'Kept on disk between starts' : 'Reset at every start',
		},
	];

	// What is on or off, with a word on how each is set
	$: features = [
		{ name: 'Chaos', on: chaosOn, detail: chaosLabel },
		{ name: 'Request log', on: loggingOn, detail: `last ${maxLogged}` },
		{ name: 'Database persistence', on: saved, detail: '' },
		{ name: 'URL prefix', on: prefix !== '', detail: prefix },
	];
</script>

<div class="tiles">
	{#each tiles as tile (tile.id)}
		<a class="tile" href={tile.href} cy-data="tile_{tile.id}">
			<span class="tileLabel">{tile.label}</span>
			<span class="tileValue">{tile.value}</span>
			<span class="tileNote">{tile.note}</span>
		</a>
	{/each}
</div>

<div class="columns">
	<div class="column">
		<section class="card" cy-data="connect">
			<h2>Connect</h2>
			<div class="grid">
				<div class="kv kvWide">
					<span class="muted">Base URL</span>
					<span class="badge" cy-data="base_url">
						http://localhost:{meta?.serverPort ?? ''}{prefix}
					</span>
				</div>
			</div>
			<p class="muted cardNote">
				Each folder in <code>src/api</code> is an endpoint under this address.
			</p>
			<div class="cardActions">
				<a class="fileLink" href="#/endpoints" cy-data="all_endpoints_link">
					View endpoints ({endpointCount})
				</a>
				<a class="fileLink" href="/api">List as JSON</a>
			</div>
		</section>

		<section class="card" cy-data="request_log">
			<h2>Request log</h2>
			<p class="muted cardLead">
				{#if loggingOn}
					Requests to endpoints that call the <code>logger</code> function are being
					logged, newest first.
				{:else}
					Requests are not being logged. Set <code>LOG_REQUESTS=ON</code> in
					<code>.env</code> to log them.
				{/if}
			</p>
			<div class="cardActions">
				<button
					class="fileLink"
					cy-data="request_log_link"
					title={`View the last ${maxLogged} logged requests`}
					on:click={viewLog}
				>
					View request log
				</button>
				<a class="fileLink" href="#/settings">Logging settings</a>
			</div>
		</section>
	</div>

	<div class="column">
		<section class="card" cy-data="features">
			<div class="cardHead">
				<h2>At a glance</h2>
				<a class="fileLink" href="#/settings">Settings</a>
			</div>
			<div class="featureList">
				{#each features as feature (feature.name)}
					<div class="kv" cy-data="feature">
						<span class="muted">{feature.name}</span>
						<span class="kvValue">
							{#if feature.detail}<span class="muted">{feature.detail}</span>{/if}
							<span class="state" class:on={feature.on}>{feature.on ? 'On' : 'Off'}</span>
						</span>
					</div>
				{/each}
			</div>
		</section>
	</div>
</div>
