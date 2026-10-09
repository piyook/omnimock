import './styles.css';

import { mount } from 'svelte';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) {
	throw new Error('Missing #app element');
}

// Replace the "Loading dashboard…" placeholder from index.html, and drop its
// padding so the sidebar reaches the edge of the window
target.innerHTML = '';
target.removeAttribute('style');

mount(App, {
	target,
});
