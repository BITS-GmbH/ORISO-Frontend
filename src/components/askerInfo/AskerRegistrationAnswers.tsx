import * as React from 'react';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActiveSessionContext } from '../../globalState';
import {
	apiGetRegistrationAnswers,
	type RegistrationAnswers
} from '../../api/apiGetRegistrationAnswers';
import { textIn } from '../journey/journeyModel';
import { Text } from '../text/Text';

/**
 * What the person answered in the registration process (ADR-039), in the
 * counsellor's language where it was translated, otherwise in German.
 */
export const AskerRegistrationAnswers = () => {
	const { t, i18n } = useTranslation();
	const { activeSession } = useContext(ActiveSessionContext);
	const sessionId = activeSession?.item?.id;
	const [data, setData] = useState<RegistrationAnswers | null>(null);

	useEffect(() => {
		if (!sessionId || activeSession?.isGroup) return undefined;
		let cancelled = false;
		apiGetRegistrationAnswers(sessionId).then((answers) => {
			if (!cancelled) setData(answers);
		});
		return () => {
			cancelled = true;
		};
	}, [sessionId, activeSession?.isGroup]);

	if (!data || data.answers.length === 0) return null;
	const language = i18n.language || 'de';

	return (
		<div data-cy="asker-registration-answers">
			<Text
				text={t('userProfile.registrationAnswers.title')}
				type="divider"
			/>
			{data.answers.map((answer) => (
				<div className="askerInfo__data__item" key={answer.questionId}>
					<p className="askerInfo__data__label">
						{textIn(answer.question, language)}
					</p>
					<p className="askerInfo__data__content">
						{[
							...answer.choices.map((choice) =>
								textIn(choice, language)
							),
							...(answer.text ? [answer.text] : [])
						].join(', ')}
					</p>
				</div>
			))}
		</div>
	);
};
