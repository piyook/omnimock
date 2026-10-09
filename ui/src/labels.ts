import type { UiMeta } from './api.js';

// How often a call fails: "Every call", "Every 3 calls" or "Random, 1 in 3"
export function chaosFrequencyLabel(m: UiMeta): string {
	if (m.chaosFrequency <= 1) return 'Every call';
	return m.chaosMode === 'random'
		? `Random, 1 in ${m.chaosFrequency}`
		: `Every ${m.chaosFrequency} calls`;
}
