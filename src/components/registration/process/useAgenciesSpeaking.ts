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

	const agencyKey = agencies?.map((agency) => agency.id).join(',') ?? '';
	const [checked, setChecked] = useState<string>();
	const request = `${language}|${agencyKey}`;

	useEffect(() => {
		if (!active || agencyKey === '') return undefined;
		let cancelled = false;
		Promise.all(
			agencyKey.split(',').map((id) =>
				apiAgencyLanguages(Number(id), singleDomain)
					.then((answer) =>
						answer?.languages?.includes(language as string)
							? Number(id)
							: null
					)
					.catch(() => null)
			)
		).then((ids) => {
			if (cancelled) return;
			setSpeaking(ids.filter((id): id is number => id !== null));
			setChecked(request);
		});
		return () => {
			cancelled = true;
		};
	}, [active, agencyKey, language, singleDomain, request]);

	if (!active || !agencies || speaking === null || checked !== request) {
		return {
			agencies,
			matched: true,
			checking: active && checked !== request
		};
	}
	const filtered = agencies.filter((agency) => speaking.includes(agency.id));
	return filtered.length > 0
		? { agencies: filtered, matched: true, checking: false }
		: { agencies, matched: false, checking: false };
};
