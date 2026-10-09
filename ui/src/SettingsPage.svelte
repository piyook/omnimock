<script lang="ts">
	import type { UiMeta } from './api.js';
	import ChaosCard from './ChaosCard.svelte';

	export let meta: UiMeta | null;
	// Opens the request log viewer
	export let viewLog: () => void;

	$: maxLogged = meta?.maxLoggedRequests ?? 10;
</script>

<div class="columns">
	<div class="column">
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
						on:click={viewLog}
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
	</div>

	<div class="column">
		<ChaosCard {meta} />
	</div>
</div>

<div class="footerNote">
	Change settings in <code>.env</code> and restart the server.
</div>
