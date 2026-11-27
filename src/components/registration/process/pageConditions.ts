import type { StepAnswers } from '../../journey/journeyModel';

/** One test on something asked on an earlier page. */
export type ConditionRule =
	| { kind: 'topic'; topicIds: number[] }
	| { kind: 'topics'; topicIds: number[] }
	| {
			kind: 'answer';
			stepId: string;
			questionId: string;
			optionIds: string[];
	  };

/**
 * When a page of a registration process is shown (ADR-039): all or any of
 * its rules hold. A page without one is always shown.
 */
export interface PageCondition {
	match: 'all' | 'any';
	rules: ConditionRule[];
}

export interface ConditionData {
	mainTopic?: { id?: number } | null;
	mainTopicId?: number;
	topicIds?: number[];
	processAnswers?: Record<string, StepAnswers>;
}

const mainTopicOf = (data: ConditionData) =>
	data.mainTopic?.id ?? data.mainTopicId;

export const ruleHolds = (rule: ConditionRule, data: ConditionData) => {
	if (rule.kind === 'topic') {
		const topic = mainTopicOf(data);
		return topic !== undefined && rule.topicIds.includes(topic);
	}
	if (rule.kind === 'topics') {
		return (data.topicIds ?? []).some((id) => rule.topicIds.includes(id));
	}
	const chosen =
		data.processAnswers?.[rule.stepId]?.questions?.[rule.questionId]
			?.choices ?? [];
	return chosen.some((id) => rule.optionIds.includes(id));
};

export const conditionHolds = (
	condition: PageCondition | undefined,
	data: ConditionData
): boolean => {
	if (!condition || condition.rules.length === 0) return true;
	return condition.match === 'any'
		? condition.rules.some((rule) => ruleHolds(rule, data))
		: condition.rules.every((rule) => ruleHolds(rule, data));
};

/** The answers of steps the person can still see; a hidden page's are dropped. */
export const answersOfShownSteps = (
	answers: Record<string, StepAnswers> | undefined,
	shownStepIds: Set<string>
): Record<string, StepAnswers> | undefined =>
	answers &&
	Object.fromEntries(
		Object.entries(answers).filter(([stepId]) => shownStepIds.has(stepId))
	);
