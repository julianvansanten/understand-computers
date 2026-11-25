import { loadVisualization } from '#lib/platform/registry.ts';

export const load = async () => ({ demo: await loadVisualization('algorithms', 'sorting') });
