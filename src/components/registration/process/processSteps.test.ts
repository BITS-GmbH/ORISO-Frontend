// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type { JourneyStep } from '../../journey/journeyModel';
import type { RegistrationStep } from '../registrationSteps';
import type { JourneyWithPages } from './processPages';
import { processSteps } from './processSteps';

const step = (id: string, extra: Partial<JourneyStep> = {}): JourneyStep => ({
	id,
	kind: 'core',
	core: id as JourneyStep['core'],
	title: { de: id },
	description: {},
	...extra
});

const journey: JourneyWithPages = {
	id: 'j',
	conversationType: 'AGENCY_COUNSELLING',
	phases: {
		departure: [
			step('topic'),
			step('postcode'),
			step('language'),
			step('agency'),
			step('username'),
			step('consent')
		]
	},
	pages: [
		{ id: 'p1', stepIds: ['topic'] },
		{ id: 'p2', stepIds: ['postcode', 'language', 'agency'] },
		{ id: 'p3', stepIds: ['username', 'consent'] }
	]
};

const platform: RegistrationStep[] = [
	'topic-selection',
	'zipcode',
	'agency-selection',
	'account-data'
].map((name) => ({ name, component: () => null }));

describe('registration process steps', () => {
	it('keeps the same component per page when the steps are built again', () => {
		const first = processSteps(journey, platform, 'de');
		const second = processSteps(journey, [...platform], 'de');
		expect(first.map((s) => s.name)).toEqual([
			'topic-selection',
			'seite-2',
			'account-data'
		]);
		expect(second.map((s) => s.component)).toEqual(
			first.map((s) => s.component)
		);
	});

	it('leaves out the centre a link already chose', () => {
		const withoutAgency = platform.filter(
			(s) => s.name !== 'agency-selection'
		);
		const steps = processSteps(journey, withoutAgency, 'de');
		expect(steps.map((s) => s.name)).toEqual([
			'topic-selection',
			'seite-2',
			'account-data'
		]);
	});

	it('names a page the same when a link skips the topic choice', () => {
		const withoutTopic = platform.filter(
			(s) => s.name !== 'topic-selection'
		);
		const full = processSteps(journey, platform, 'de');
		const skipped = processSteps(journey, withoutTopic, 'de');
		expect(skipped.map((s) => s.name)).toEqual(['seite-2', 'account-data']);
		expect(skipped[0].component).toBe(full[1].component);
	});

	it('asks for the topic on its own page after the questions before it', () => {
		const later: JourneyWithPages = {
			...journey,
			id: 'later',
			phases: {
				departure: [
					step('age'),
					step('topics'),
					step('topic'),
					step('postcode'),
					step('agency'),
					step('username'),
					step('consent')
				]
			},
			pages: [
				{ id: 'p1', stepIds: ['age', 'topics', 'topic'] },
				{ id: 'p2', stepIds: ['postcode', 'agency'] },
				{ id: 'p3', stepIds: ['username', 'consent'] }
			]
		};
		const steps = processSteps(later, platform, 'de');
		expect(steps.map((s) => s.name)).toEqual([
			'seite-1',
			'seite-2',
			'account-data'
		]);
		expect(steps[0].mandatoryFields).toContain('mainTopic');
	});
});
