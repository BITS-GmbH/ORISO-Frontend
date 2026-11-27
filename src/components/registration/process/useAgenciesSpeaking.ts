import { useEffect, useState } from 'react';
import { apiAgencyLanguages } from '../../../api/apiAgencyLanguages';
import type { AgencyDataInterface } from '../../../globalState/interfaces';
import { useAppConfig } from '../../../hooks/useAppConfig';
import { ANY_LANGUAGE } from './LanguageInput';

/**
 * The centres with a counsellor who speaks `language` (ADR-039). When none
 * does, all of them, with `matched` false, so the person is never left
 * without a centre.
 */
export const useAgenciesSpeaking = (
	agencies: AgencyDataInterface[] | undefined,
	language: string | undefined
) => {
	const singleDomain = Boolean(
		useAppConfig()?.multitenancyWithSingleDomainEnabled
	);
	const [speaking, setSpeaking] = useState<number[] | null>(null);
	const active = Boolean(
		language && language !== ANY_LANGUAGE && agencies?.length
	);

	useEffect(() => {
		if (!active || !agencies) {
			setSpeaking(null);
			return undefined;
		}
		let cancelled = false;
		Promise.all(
			agencies.map((agency) =>
				apiAgencyLanguages(agency.id, singleDomain)
					.then((answer) =>
						answer?.languages?.includes(language as string)
							? agency.id
							: null
					)
					.catch(() => null)
			)
		).then((ids) => {
			if (!cancelled)
				setSpeaking(ids.filter((id): id is number => id !== null));
		});
		return () => {
			cancelled = true;
		};
	}, [active, agencies, language, singleDomain]);

	if (!active || !agencies || speaking === null) {
		return {
			agencies,
			matched: true,
			checking: active && speaking === null
		};
	}
	const filtered = agencies.filter((agency) => speaking.includes(agency.id));
	return filtered.length > 0
		? { agencies: filtered, matched: true, checking: false }
		: { agencies, matched: false, checking: false };
};
