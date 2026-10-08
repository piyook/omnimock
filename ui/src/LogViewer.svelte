<script lang="ts">
	import { clearRequestLog, fetchRequestLog, type RequestLog } from './api.js';

	// Whether the server is logging requests now; the log file outlives a
	// restart, so it can hold requests from a run that had logging on
	export let loggingOn = false;

	// What the dialog shows: the logged requests, one block each and one at a
	// time with back/next. `note` follows the source in the header;
	// `clearable` adds the button that empties the log. `texts` is null
	// while loading.
	type View = {
		source: string;
		note?: string;
		clearable?: boolean;
		texts: string[] | null;
		error?: string;
	};

	const loading: View = { source: 'Request log', texts: null };

	let view: View = loading;
	let dialog: HTMLDialogElement;
	// Block shown, and whether the dialog is asking to confirm a clear
	let page = 0;
	let confirmingClear = false;

	$: pages = view.texts?.length ?? 1;
	$: pageable = !!view.clearable && !view.error;

	const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

	function describe({ file, log }: RequestLog): View {
		const entries = Array.isArray(log) ? log : [];
		if (entries.length === 0) {
			return {
				source: file,
				texts: [
					'No request has been logged yet. Set LOG_REQUESTS=ON in .env, add the logger function to an endpoint, restart the server, then send a request.',
				],
			};
		}

		return {
			source: file,
			note: loggingOn
				? 'newest first'
				: 'newest first · logging is off, these were logged earlier',
			clearable: true,
			texts: entries.map((entry) => JSON.stringify(entry, null, 2)),
		};
	}

	// Shows the dialog straight away and fills it once the log arrives
	export async function open() {
		view = loading;
		page = 0;
		confirmingClear = false;
		if (!dialog.open) dialog.showModal();

		view = await fetchRequestLog().then(describe, (e) => ({
			...loading,
			error: message(e),
		}));
	}

	// Empties the request log, then shows the now empty view. A failure is
	// shown in place of the log.
	async function clear() {
		confirmingClear = false;
		const failure = await clearRequestLog().then(() => null, message);
		if (failure === null) return open();
		view = { ...view, error: failure };
	}

	// Moves back or forward, stopping at either end
	function turnPage(step: number) {
		page = Math.min(Math.max(page + step, 0), pages - 1);
	}

	function onKey(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft') turnPage(-1);
		if (event.key === 'ArrowRight') turnPage(1);
	}

	// A click on the backdrop lands on the dialog element itself
	function onClick(event: MouseEvent) {
		if (event.target === dialog) dialog.close();
	}
</script>

<dialog class="viewer" cy-data="viewer" bind:this={dialog} on:click={onClick} on:keydown={onKey}>
	<div class="viewerBody">
		<div class="viewerHeader">
			<div>
				<h2 style="margin: 0;">Last logged requests</h2>
				<div class="muted viewerSource">
					{view.source}{view.note ? ` · ${view.note}` : ''}
				</div>
			</div>
		</div>
		{#if view.error}
			<p class="viewerError">{view.error}</p>
		{:else if view.texts === null}
			<p class="muted">Loading…</p>
		{:else}
			<div class="viewerTexts">
				<pre cy-data="viewer_text">{view.texts[page]}</pre>
			</div>
		{/if}
		<div class="viewerFooter">
			<div class="viewerFooterGroup">
				{#if confirmingClear}
					<span>Clear all logged requests?</span>
					<button class="fileLink danger" cy-data="viewer_clear_confirm" on:click={clear}>
						Yes, clear
					</button>
					<button class="fileLink" on:click={() => (confirmingClear = false)}>Cancel</button>
				{:else if pageable}
					<button class="fileLink" cy-data="viewer_clear" on:click={() => (confirmingClear = true)}>
						Clear logs
					</button>
				{/if}
			</div>
			<div class="viewerFooterGroup">
				{#if pageable}
					<button
						class="fileLink"
						cy-data="viewer_back"
						disabled={page === 0}
						on:click={() => turnPage(-1)}
					>
						Back
					</button>
					<span class="muted" cy-data="viewer_position">{page + 1} of {pages}</span>
					<button
						class="fileLink"
						cy-data="viewer_next"
						disabled={page >= pages - 1}
						on:click={() => turnPage(1)}
					>
						Next
					</button>
				{/if}
				<button class="fileLink" cy-data="viewer_close" on:click={() => dialog.close()}>
					Close
				</button>
			</div>
		</div>
	</div>
</dialog>
