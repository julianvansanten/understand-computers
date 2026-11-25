import type { Component } from 'svelte';
import type { Frame, Model } from './engine/model.ts';
import type { Parameters, ParameterValues } from './engine/parameters.ts';
import type { Locale } from './i18n/locales.ts';
import type { Dictionary, Translate } from './i18n/translate.ts';

/** The only states a drawing may use, so a color means the same in every visualization. */
export const stateNames = ['idle', 'candidate', 'active', 'done', 'failed'] as const;
export type StateName = (typeof stateNames)[number];

export type Accent = 'blue' | 'green' | 'purple' | 'orange';

export interface SubjectInfo {
	order: number;
	accent: Accent;
	/** SVG path data in a 24x24 box, drawn as an outline. */
	icon: string;
	text: Record<Locale, { title: string; description: string }>;
}

export interface VisualizationMeta {
	order: number;
	level: 1 | 2 | 3;
	minutes: number;
	/** Curriculum domains, e.g. "informatica-2019:B". Never used for routes or navigation. */
	curriculum: string[];
	text: Record<Locale, { title: string; description: string; concepts: string[] }>;
}

/** What a Stage or Detail component receives. */
export interface StageProps<S, V, A = never> {
	frame: Frame<S>;
	next: Frame<S> | undefined;
	/** 0..1 between frame and next. Always 0 with reduced motion. */
	progress: number;
	time: number;
	params: V;
	t: Translate;
	selection: string | null;
	select: (id: string | null) => void;
	dispatch: (action: A) => void;
}

export interface CodeLine {
	id: string;
	text: string;
}

export interface Visualization<P extends Parameters, S, A = never> {
	/** Raise when the meaning of a parameter changes, so old links can be recognised. */
	version: number;
	/** Units of t per second at normal speed. */
	pace: number;
	parameters: P;
	model: Model<ParameterValues<P>, S, A>;
	Stage: Component<StageProps<S, ParameterValues<P>, A>>;
	Detail?: Component<StageProps<S, ParameterValues<P>, A>>;
	/** Needs: param.<name>, param.<name>.<option>, stat.<name>, legend.<state>, and what the model explains. */
	messages: Dictionary;
	legend: StateName[];
	stats: string[];
	pseudocode?: (values: ParameterValues<P>) => CodeLine[];
}

// The registry holds visualizations of many types; each is checked by defineVisualization.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyVisualization = Visualization<any, any, any>;

export const defineVisualization = <P extends Parameters, S, A = never>(
	visualization: Visualization<P, S, A>
): AnyVisualization => visualization;
