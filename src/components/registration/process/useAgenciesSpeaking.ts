import { useEffect, useMemo, useRef, useState } from 'react';
import { apiAgencyLanguages } from '../../../api/apiAgencyLanguages';
import type { AgencyDataInterface } from '../../../globalState/interfaces';
import { useAppConfig } from '../../../hooks/useAppConfig';
import { ANY_LANGUAGE } from './LanguageInput';

/**
 * The centres with a counsellor who speaks `language` (ADR-039). When none
 * does, all of them, with `matched` false, so the person is never left
 * without a centre. Each centre's languages are asked for once: the list
 * re-renders often, and only its centres decide what to ask.
 */
export const useAgenciesSpeaking = (
	agencies: AgencyDataInterface[] | undefined,
	language: string | undefined
) => {
	const singleDomain = Boolean(
		useAppConfig()?.multitenancyWithSingleDomainEnabled
	);
	const known = useRef(new Map<number, Promise<string[]>>());
	const [speaking, setSpeaking] = useState<{ key: string; ids: number[] }>();
	const filtering = Boolean(language && language !== ANY_LANGUAGE);
	const ids = (agencies ?? [])
		.map((agency) => agency.id)
		.filter((id) => id > 0);
	const key = `${language}|${ids.join(',')}`;

	useEffect(() => {
		if (!filtering || ids.length === 0) return undefined;
		let cancelled = false;
		const languagesOf = (id: number) => {
			if (!known.current.has(id)) {
				known.current.set(
					id,
					apiAgencyLanguages(id, singleDomain)
						.then((answer) => answer?.languages ?? [])
						.catch(() => [])
				);
			}
			return known.current.get(id) as Promise<string[]>;
		};
		Promise.all(
			ids.map((id) =>
				languagesOf(id).then((languages) =>
					languages.includes(language as string) ? id : null
				)
			)
		).then((found) => {
			if (!cancelled) {
				setSpeaking({
					key,
					ids: found.filter((id): id is number => id !== null)
				});
			}
		});
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- `key` names the ids and the language
	}, [filtering, key, singleDomain]);

	return useMemo(() => {
		if (!filtering || !agencies || speaking?.key !== key) {
			return { agencies, matched: true };
		}
		const filtered = agencies.filter((agency) =>
			speaking.ids.includes(agency.id)
		);
		return filtered.length > 0
			? { agencies: filtered, matched: true }
			: { agencies, matched: false };
	}, [agencies, filtering, key, speaking]);
};
