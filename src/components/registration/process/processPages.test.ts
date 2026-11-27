import { describe, expect, it } from 'vite-plus/test';
import type { JourneyStep } from '../../journey/journeyModel';
import {
	processPagesOf,
	withAccountLast,
	type JourneyWithPages
} from './processPages';

const core = (id: string): JourneyStep => ({
	id,
	kind: 'core',
	core: id as JourneyStep['core'],
	title: { de: id },
	description: {}
});

const journey = (pages?: JourneyWithPages['pages']): JourneyWithPages => ({
	id: 'j',
	conversationType: 'AGENCY_COUNSELLING',
	phases: {
		departure: [
			'topic',
			'postcode',
			'agency',
			'username',
			'consent',
			'email'
		].map(core)
	},
	pages
});

const ids = (j: JourneyWithPages) =>
	processPagesOf(j).map((page) => page.steps.map((step) => step.id));

describe('registration process pages', () => {
	it('shows one step per page without stored pages', () => {
		expect(ids(journey())).toEqual([
			['topic'],
			['postcode'],
			['agency'],
			['username'],
			['consent'],
			['email']
		]);
	});

	it('follows the stored pages and keeps the topic choice alone on page 1', () => {
		const grouped = journey([
			{ id: 'a', stepIds: ['topic', 'postcode'] },
			{ id: 'b', stepIds: ['agency'] },
			{
				id: 'c',
				title: { de: 'Zugang' },
				stepIds: ['username', 'email', 'consent']
			}
		]);
		expect(ids(grouped)).toEqual([
			['topic'],
			['postcode'],
			['agency'],
			['username', 'email', 'consent']
		]);
		expect(processPagesOf(grouped)[3].title.de).toBe('Zugang');
	});

	it('puts the page that creates the account last', () => {
		const early = journey([
			{ id: 'a', stepIds: ['topic'] },
			{ id: 'b', stepIds: ['username', 'consent', 'email'] },
			{ id: 'c', stepIds: ['postcode', 'agency'] }
		]);
		expect(
			withAccountLast(processPagesOf(early)).map((page) => page.id)
		).toEqual(['page:topic', 'c', 'b']);
	});

	it('puts username, consent and e-mail on one last page', () => {
		const pages = withAccountLast(processPagesOf(journey()));
		expect(pages.map((page) => page.steps.map((step) => step.id))).toEqual([
			['topic'],
			['postcode'],
			['agency'],
			['username', 'consent', 'email']
		]);
	});
});
