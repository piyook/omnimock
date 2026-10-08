<script lang="ts">
	import type { UiMeta } from './api.js';

	export let meta: UiMeta | null;

	// How often a call fails: "Every call", "Every 3 calls" or "Random, 1 in 3"
	function chaosFrequencyLabel(m: UiMeta): string {
		if (m.chaosFrequency <= 1) return 'Every call';
		return m.chaosMode === 'random'
			? `Random, 1 in ${m.chaosFrequency}`
			: `Every ${m.chaosFrequency} calls`;
	}
</script>

<section class="card" cy-data="chaos">
	<h2>Chaos</h2>
	<div class="grid">
		<div class="kv">
			<span class="muted">Chaos</span>
			<span class="badge" cy-data="chaos_status">{meta?.chaosStatus ?? 'DISABLED'}</span>
		</div>
		{#if meta?.chaosStatus === 'ENABLED'}
			<div class="kv">
				<span class="muted">Error Frequency</span>
				<span class="badge" cy-data="chaos_frequency">{chaosFrequencyLabel(meta)}</span>
			</div>
			<div class="kv">
				<span class="muted">Error Status</span>
				<span class="badge" cy-data="chaos_error_status">{meta.chaosErrorStatus}</span>
			</div>
			<div class="kv">
				<span class="muted">Errors Injected</span>
				<span class="badge" cy-data="chaos_injected">{meta.chaosInjected}</span>
			</div>
		{/if}
	</div>
	<p class="muted cardNote" cy-data="chaos_note">
		Chaos answers some calls to the endpoints above with an HTTP error in place of
		their reply. Set <code>CHAOS_ENABLED</code>, <code>CHAOS_FREQUENCY</code>,
		<code>CHAOS_MODE</code> and <code>CHAOS_STATUS</code> in <code>.env</code>.
	</p>
</section>
