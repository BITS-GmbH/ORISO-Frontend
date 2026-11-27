// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { RegistrationStep } from '../registrationSteps';
import { nextShownStepName, useShownSteps } from './useShownSteps';

const page = (name: string, topicIds?: number[]): RegistrationStep => ({
	name,
	component: () => null,
	processPage: {
		stepIds: [name],
		when: topicIds
			? { match: 'all', rules: [{ kind: 'topic', topicIds }] }
			: undefined
	}
});

const steps = [page('seite-1'), page('seite-2', [31]), page('seite-3')];

describe('shown registration steps', () => {
	it('shows a conditional page only while its condition holds', () => {
		const { result, rerender } = renderHook(
			({ topic }) => useShownSteps(steps, { mainTopicId: topic }),
			{ initialProps: { topic: 21 } }
		);
		expect(result.current.map((s) => s.name)).toEqual([
			'seite-1',
			'seite-3'
		]);
		const first = result.current;
		rerender({ topic: 22 });
		expect(result.current).toBe(first);
		rerender({ topic: 31 });
		expect(result.current.map((s) => s.name)).toEqual([
			'seite-1',
			'seite-2',
			'seite-3'
		]);
	});

	it('leads from a page no longer shown to the next one that is', () => {
		const shown = [steps[0], steps[2]];
		expect(nextShownStepName(steps, shown, 'seite-2')).toBe('seite-3');
		expect(nextShownStepName(steps, shown, 'unknown')).toBeUndefined();
	});
});
