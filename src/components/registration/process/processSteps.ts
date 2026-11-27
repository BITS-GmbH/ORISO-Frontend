import type { RegistrationStep } from '../registrationSteps';
import { textIn } from '../../journey/journeyModel';
import {
	processPagesOf,
	withAccountLast,
	type JourneyWithPages,
	type ProcessPage
} from './processPages';
import { processPageStep, stepNameOf } from './ProcessPageStep';

const BLOCK_STEP: Partial<Record<string, string>> = {
	topic: 'topic-selection',
	postcode: 'zipcode',
	agency: 'agency-selection'
};

/**
 * The registration's steps for a journey: its topic choice stays the
 * platform's own step, every other page becomes one step. A block whose
 * platform step a direct link already answered (its topic, centre or
 * postcode) is left out, and a page left empty by that goes.
 */
export const processSteps = (
	journey: JourneyWithPages,
	platformSteps: RegistrationStep[],
	language: string
): RegistrationStep[] => {
	const present = new Set(platformSteps.map((step) => step.name));
	const kept = (page: ProcessPage): ProcessPage => ({
		...page,
		steps: page.steps.filter((step) => {
			const platform = BLOCK_STEP[step.core ?? ''];
			return !platform || present.has(platform);
		})
	});
	// Names come from the whole process, before a link takes pages away, so a
	// page keeps its name (and with it its address) however it is reached.
	const named = withAccountLast(processPagesOf(journey)).map(
		(page, index) => ({
			page: kept(page),
			name: stepNameOf(page, index)
		})
	);
	return named
		.filter(({ page }) => page.steps.length > 0)
		.map(({ page, name }) => {
			if (page.steps.length === 1 && page.steps[0].core === 'topic') {
				return platformSteps.find(
					(step) => step.name === 'topic-selection'
				) as RegistrationStep;
			}
			const label =
				textIn(page.title, language) ||
				textIn(page.steps[0]?.title, language);
			return processPageStep(page, name, journey.id, language, label);
		});
};
