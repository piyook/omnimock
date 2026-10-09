<script lang="ts">
	import type { UiMeta } from './api.js';

	type Theme = UiMeta['uiTheme'];

	// The server's theme (UI_THEME), once /ui-meta has answered. The server
	// also names it on the page it serves; this covers the dashboard run on
	// its own with `npm run ui-dev`.
	export let serverTheme: Theme | undefined = undefined;

	// Also read by the script in index.html, before the page is drawn
	const THEME_KEY = 'omnimock-theme';

	// The theme picked with the switch, kept by the browser; null until one
	// is picked, or if the browser keeps nothing
	function pickedTheme(): Theme | null {
		try {
			const picked = window.localStorage.getItem(THEME_KEY);
			return picked === 'light' || picked === 'dark' ? picked : null;
		} catch {
			return null;
		}
	}

	const pageTheme = (): Theme =>
		document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

	let picked = pickedTheme();
	// The theme in view: the one picked here, otherwise the server's
	let theme: Theme;
	$: theme = picked ?? serverTheme ?? pageTheme();
	$: document.documentElement.dataset.theme = theme;

	function switchTheme() {
		picked = theme === 'dark' ? 'light' : 'dark';
		try {
			window.localStorage.setItem(THEME_KEY, picked);
		} catch {
			// Not kept, so the next visit starts from the server's theme
		}
	}
</script>

<button
	class="themeSwitch"
	role="switch"
	aria-checked={theme === 'dark'}
	cy-data="theme_switch"
	title="Kept by this browser. The server's own theme is set with UI_THEME"
	on:click={switchTheme}
>
	<svg viewBox="0 0 24 24" aria-hidden="true">
		<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
	</svg>
	<span>Dark theme</span>
	<span class="toggle" aria-hidden="true"><span class="toggleKnob"></span></span>
</button>
