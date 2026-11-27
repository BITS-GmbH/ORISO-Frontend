import { useMemo, useRef } from 'react';
import type { RegistrationStep } from '../registrationSteps';
import { conditionHolds, type ConditionData } from './pageConditions';

/**
 * The steps whose page condition holds for `data`. The list keeps its identity
 * while the same steps stay shown: the registration re-renders on every key
 * stroke, and a new list each time would rerun everything that depends on it.
 */
export const useShownSteps = (
	steps: RegistrationStep[] | undefined,
	data: ConditionData
): RegistrationStep[] => {
	const previous = useRef<RegistrationStep[]>([]);
	const shown = (steps ?? []).filter((step) =>
		conditionHolds(step.processPage?.when, data)
	);
	const key = shown.map((step) => step.name).join('|');
	return useMemo(() => {
		const same =
			previous.current.length === shown.length &&
			previous.current.every((step, index) => step === shown[index]);
		if (!same) previous.current = shown;
		return previous.current;
		// eslint-disable-next-line react-hooks/exhaustive-deps -- `key` names the shown steps; `steps` brings new components
	}, [key, steps]);
};

/** Where a link to a page no longer shown leads: the next page that is. */
export const nextShownStepName = (
	allSteps: RegistrationStep[] | undefined,
	shown: RegistrationStep[],
	name: string | undefined
) => {
	const order = (allSteps ?? []).map((step) => step.name);
	const at = name ? order.indexOf(name) : -1;
	if (at < 0) return undefined;
	const shownNames = new Set(shown.map((step) => step.name));
	return order.slice(at + 1).find((candidate) => shownNames.has(candidate));
};
