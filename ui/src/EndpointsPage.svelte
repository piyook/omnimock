<script lang="ts">
	import type { UiMeta } from './api.js';

	export let meta: UiMeta | null;

	$: endpointCount = meta?.apiLinks?.length ?? 0;
</script>

<section class="card" cy-data="endpoints">
	<div class="cardHead">
		<h2>API endpoints</h2>
		<span class="countPill" cy-data="endpoint_count" title="Total API endpoints">
			{endpointCount} {endpointCount === 1 ? 'endpoint' : 'endpoints'}
		</span>
	</div>
	<div class="endpoints">
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
