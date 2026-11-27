import { endpoints } from '../resources/scripts/endpoints';
import type { LangMap } from '../components/journey/journeyModel';
import { fetchData, FETCH_ERRORS, FETCH_METHODS } from './fetchData';

/** One answered question of a registration process, frozen when it was given (ADR-039). */
export interface RegistrationAnswer {
	questionId: string;
	version: number;
	question: LangMap;
	choices: LangMap[];
	text?: string;
}

export interface RegistrationAnswers {
	journeyName?: string;
	answers: RegistrationAnswer[];
}

/** The answers of a conversation for its counsellors; none where nothing was asked. */
export const apiGetRegistrationAnswers = (
	sessionId: number
): Promise<RegistrationAnswers | null> =>
	fetchData({
		url: endpoints.registrationAnswers(sessionId),
		method: FETCH_METHODS.GET,
		responseHandling: [FETCH_ERRORS.FORBIDDEN, FETCH_ERRORS.CATCH_ALL]
	})
		.then((answer: RegistrationAnswers | Record<string, never>) =>
			answer && Array.isArray((answer as RegistrationAnswers).answers)
				? (answer as RegistrationAnswers)
				: null
		)
		.catch(() => null);
