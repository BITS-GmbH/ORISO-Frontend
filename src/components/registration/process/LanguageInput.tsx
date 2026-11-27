import * as React from 'react';
import { Dispatch, FC, SetStateAction, useMemo } from 'react';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import { useTranslation } from 'react-i18next';
import { RegistrationData } from '../../../globalState';
import { DemographicSelectInput } from '../demographicInput/DemographicSelectInput';

export const ANY_LANGUAGE = 'any';

const LANGUAGES = [
	'de',
	'en',
	'tr',
	'ar',
	'ru',
	'uk',
	'fa',
	'fr',
	'es',
	'pl',
	'ro',
	'ti'
];

/** The language of the counselling (ADR-039); "any" keeps every centre. */
export const LanguageInput: FC<{
	onChange: Dispatch<SetStateAction<Partial<RegistrationData>>>;
}> = ({ onChange }) => {
	const { t } = useTranslation();
	const options = useMemo(
		() => [
			{
				value: ANY_LANGUAGE,
				label: t('registration.counsellingLanguage.any')
			},
			...LANGUAGES.map((code) => ({
				value: code,
				label: t(`languages.${code}`)
			}))
		],
		[t]
	);
	return (
		<DemographicSelectInput
			field="counsellingLanguage"
			headlineKey="registration.counsellingLanguage.headline"
			placeholderKey="registration.counsellingLanguage.dropdown"
			Icon={TranslateRoundedIcon}
			options={options}
			onChange={onChange}
		/>
	);
};
