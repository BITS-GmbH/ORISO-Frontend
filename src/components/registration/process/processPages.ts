import type { Journey, JourneyStep, LangMap } from '../../journey/journeyModel';

/**
 * The check-in of a Mailberatung journey as the admin grouped it into pages
 * (ADR-039). Asked first, the topic choice is page 1 and nothing else; the
 * process that runs every topic may ask for it later. A journey without stored
 * pages shows each check-in step on a page of its own.
 */
export interface ProcessPage {
	id: string;
	title: LangMap;
	steps: JourneyStep[];
}

interface StoredPage {
	id: string;
	title?: LangMap;
	stepIds: string[];
}

export type JourneyWithPages = Journey & { pages?: StoredPage[] };

const checkIn = (journey: Journey) => journey.phases.departure ?? [];

export const processPagesOf = (journey: JourneyWithPages): ProcessPage[] => {
	const steps = checkIn(journey);
	const byId = new Map(steps.map((step) => [step.id, step]));
	const seen = new Set<string>();
	const stored = (journey.pages ?? []).map((page) => ({
		id: page.id,
		title: page.title ?? {},
		steps: page.stepIds
			.filter((id) => byId.has(id) && !seen.has(id) && seen.add(id))
			.map((id) => byId.get(id) as JourneyStep)
	}));
	const loose = steps
		.filter((step) => !seen.has(step.id))
		.map((step) => ({ id: `page:${step.id}`, title: {}, steps: [step] }));
	const pages = [...stored, ...loose];
	const topic = steps.find((step) => step.core === 'topic');
	const first = pages.find((page) => page.steps.length > 0);
	if (!topic || first?.steps[0]?.id !== topic.id)
		return pages.filter((page) => page.steps.length > 0);
	const rest = pages
		.map((page) => ({
			...page,
			steps: page.steps.filter((step) => step.id !== topic.id)
		}))
		.filter((page) => page.steps.length > 0);
	return [{ id: 'page:topic', title: {}, steps: [topic] }, ...rest];
};

export const isAccountBlock = (step: JourneyStep) =>
	step.core === 'username' ||
	step.core === 'consent' ||
	step.core === 'email';

/**
 * Username, consent and e-mail are one screen in the registration, so they
 * form one page, and it comes last: its button registers.
 */
export const withAccountLast = (pages: ProcessPage[]): ProcessPage[] => {
	const account = pages.flatMap((page) => page.steps.filter(isAccountBlock));
	if (account.length === 0) return pages;
	const home = pages.find((page) => page.steps.some(isAccountBlock));
	const rest = pages
		.map((page) => ({
			...page,
			steps: page.steps.filter((step) => !isAccountBlock(step))
		}))
		.filter((page) => page.steps.length > 0);
	return [
		...rest,
		{
			id: home?.id ?? 'page:account',
			title: home?.title ?? {},
			steps: account
		}
	];
};
