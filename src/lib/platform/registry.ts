import type { AnyVisualization, SubjectInfo, VisualizationMeta } from './visualization.ts';

// The one place where the platform looks into subjects/. Adding a folder there is enough.
const subjectFiles = import.meta.glob<SubjectInfo>('../subjects/*/subject.ts', {
	eager: true,
	import: 'default'
});
const metaFiles = import.meta.glob<VisualizationMeta>('../subjects/*/*/meta.ts', {
	eager: true,
	import: 'default'
});
const loaders = import.meta.glob<AnyVisualization>('../subjects/*/*/index.ts', {
	import: 'default'
});

export interface VisualizationEntry extends VisualizationMeta {
	id: string;
}
export interface Subject extends SubjectInfo {
	id: string;
	visualizations: VisualizationEntry[];
}

const byOrder = (a: { order: number; id: string }, b: { order: number; id: string }) =>
	a.order - b.order || a.id.localeCompare(b.id);

export const subjects: Subject[] = Object.entries(subjectFiles)
	.map(([file, info]) => {
		const id = file.split('/').at(-2)!;
		const prefix = `../subjects/${id}/`;
		const visualizations = Object.entries(metaFiles)
			.filter(([metaFile]) => metaFile.startsWith(prefix))
			.map(([metaFile, meta]) => ({ ...meta, id: metaFile.split('/').at(-2)! }))
			.sort(byOrder);
		return { ...info, id, visualizations };
	})
	.sort(byOrder);

export const findSubject = (id: string) => subjects.find((subject) => subject.id === id);

export const loadVisualization = async (subject: string, id: string) =>
	loaders[`../subjects/${subject}/${id}/index.ts`]?.();

export const visualizationFiles = { meta: Object.keys(metaFiles), index: Object.keys(loaders) };
