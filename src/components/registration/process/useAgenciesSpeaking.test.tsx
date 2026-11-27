// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAgenciesSpeaking } from './useAgenciesSpeaking';
import { apiAgencyLanguages } from '../../../api/apiAgencyLanguages';

vi.mock('../../../api/apiAgencyLanguages', () => ({
	apiAgencyLanguages: vi.fn()
}));
vi.mock('../../../hooks/useAppConfig', () => ({ useAppConfig: () => null }));

const agency = (id: number) => ({ id }) as never;

describe('useAgenciesSpeaking', () => {
	beforeEach(() => {
		vi.mocked(apiAgencyLanguages).mockReset();
		vi.mocked(apiAgencyLanguages).mockImplementation(
			async (id: number) => ({
				languages: id === 4 ? ['de', 'tr'] : ['de']
			})
		);
	});

	it('keeps the centres with a counsellor in the language, asking once per centre', async () => {
		const { result, rerender } = renderHook(
			({ list }) => useAgenciesSpeaking(list, 'tr'),
			{ initialProps: { list: [agency(4), agency(6)] } }
		);
		await waitFor(() => expect(result.current.checking).toBe(false));
		rerender({ list: [agency(4), agency(6)] });
		rerender({ list: [agency(4), agency(6)] });
		expect(
			result.current.agencies?.map((a) => (a as { id: number }).id)
		).toEqual([4]);
		expect(result.current.matched).toBe(true);
		expect(apiAgencyLanguages).toHaveBeenCalledTimes(2);
	});

	it('falls back to every centre when nobody speaks the language', async () => {
		const { result } = renderHook(() =>
			useAgenciesSpeaking([agency(6)], 'ar')
		);
		await waitFor(() => expect(result.current.checking).toBe(false));
		expect(result.current.matched).toBe(false);
		expect(result.current.agencies).toHaveLength(1);
	});

	it('does not filter for any language', () => {
		const { result } = renderHook(() =>
			useAgenciesSpeaking([agency(6)], 'any')
		);
		expect(result.current.checking).toBe(false);
		expect(apiAgencyLanguages).not.toHaveBeenCalled();
	});
});
