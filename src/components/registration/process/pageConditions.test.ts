import { describe, expect, it } from 'vitest';
import {
	answersOfShownSteps,
	conditionHolds,
	type ConditionRule
} from './pageConditions';

const answered = (choices: string[]) => ({
	processAnswers: {
		s1: { questions: { q1: { choices } }, ratings: {} }
	}
});

const one = (rule: ConditionRule) => ({ match: 'all' as const, rules: [rule] });

describe('page conditions', () => {
	it('always shows a page without one', () => {
		expect(conditionHolds(undefined, {})).toBe(true);
		expect(conditionHolds({ match: 'all', rules: [] }, {})).toBe(true);
	});

	it('reads the main topic, from the topic or its id', () => {
		const condition = one({ kind: 'topic', topicIds: [21, 24] });
		expect(conditionHolds(condition, { mainTopic: { id: 24 } })).toBe(true);
		expect(conditionHolds(condition, { mainTopicId: 21 })).toBe(true);
		expect(conditionHolds(condition, { mainTopic: { id: 31 } })).toBe(
			false
		);
		expect(conditionHolds(condition, {})).toBe(false);
	});

	it('reads the ticked topics', () => {
		const condition = one({ kind: 'topics', topicIds: [31] });
		expect(conditionHolds(condition, { topicIds: [21, 31] })).toBe(true);
		expect(conditionHolds(condition, { topicIds: [21] })).toBe(false);
	});

	it('reads the chosen options of an earlier question', () => {
		const condition = one({
			kind: 'answer',
			stepId: 's1',
			questionId: 'q1',
			optionIds: ['o2', 'o3']
		});
		expect(conditionHolds(condition, answered(['o2']))).toBe(true);
		expect(conditionHolds(condition, answered(['o1']))).toBe(false);
		expect(conditionHolds(condition, {})).toBe(false);
	});

	it('needs all rules or any rule, as the page says', () => {
		const rules: ConditionRule[] = [
			{ kind: 'topic', topicIds: [21] },
			{
				kind: 'answer',
				stepId: 's1',
				questionId: 'q1',
				optionIds: ['o2']
			}
		];
		const data = { mainTopicId: 21, ...answered(['o1']) };
		expect(conditionHolds({ match: 'all', rules }, data)).toBe(false);
		expect(conditionHolds({ match: 'any', rules }, data)).toBe(true);
	});

	it('drops the answers of hidden steps', () => {
		const answers = {
			shown: { questions: {}, ratings: {} },
			hidden: { questions: {}, ratings: {} }
		};
		expect(
			Object.keys(answersOfShownSteps(answers, new Set(['shown'])) ?? {})
		).toEqual(['shown']);
	});
});
