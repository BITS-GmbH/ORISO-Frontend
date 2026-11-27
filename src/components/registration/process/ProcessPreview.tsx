import * as React from 'react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { RegistrationContext, RegistrationData } from '../../../globalState';
import { TopicSelection } from '../topicSelection/TopicSelection';
import { registrationMd3 as md3 } from '../registrationDesign/registrationDesign';
import { ProcessPageView } from './ProcessPageStep';
import {
	processPagesOf,
	withAccountLast,
	type JourneyWithPages
} from './processPages';

/** What the Admin's builder sends into the preview frame (same origin only). */
export interface ProcessPreviewMessage {
	type: 'oriso:process-preview';
	journey: JourneyWithPages;
	page: number;
	/** The Admin's language, so the preview reads as the admin edits it. */
	language?: string;
}

const isPreviewMessage = (data: unknown): data is ProcessPreviewMessage =>
	typeof data === 'object' &&
	data !== null &&
	(data as ProcessPreviewMessage).type === 'oriso:process-preview';

/**
 * The real pages of a registration process, for the Admin's preview: the same
 * screens the registration shows, fed with the draft the admin is editing.
 * Nothing is sent: there is no "Weiter" that registers.
 */
export const ProcessPreview = () => {
	const { i18n } = useTranslation();
	const { updateRegistrationData } = useContext(RegistrationContext);
	const [message, setMessage] = useState<ProcessPreviewMessage>();

	useEffect(() => {
		const receive = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;
			if (!isPreviewMessage(event.data)) return;
			setMessage(event.data);
			const { language } = event.data;
			if (language && language !== i18n.language) {
				i18n.changeLanguage(language);
			}
		};
		window.addEventListener('message', receive);
		window.parent?.postMessage(
			{ type: 'oriso:process-preview-ready' },
			window.location.origin
		);
		return () => window.removeEventListener('message', receive);
	}, [i18n]);

	const onChange = useCallback(
		(
			patch:
				| Partial<RegistrationData>
				| ((
						previous: Partial<RegistrationData>
				  ) => Partial<RegistrationData>)
		) => {
			if (typeof patch !== 'function') updateRegistrationData?.(patch);
		},
		[updateRegistrationData]
	);

	if (!message) return null;
	const pages = withAccountLast(processPagesOf(message.journey));
	const index = Math.max(0, Math.min(message.page, pages.length - 1));
	const page = pages[index];
	const props = {
		onChange,
		onNextClick: () => undefined,
		nextStepUrl: null,
		prevStepUrl: null
	};
	const isTopic = page?.steps.length === 1 && page.steps[0].core === 'topic';

	return (
		<Box
			data-cy="process-preview"
			sx={{
				maxWidth: 780,
				mx: 'auto',
				px: { xs: 2, sm: 3 },
				py: 3,
				boxSizing: 'border-box'
			}}
		>
			<LinearProgress
				variant="determinate"
				value={((index + 1) / Math.max(pages.length, 1)) * 100}
				aria-hidden
				sx={{
					'height': 6,
					'borderRadius': 3,
					'mb': 3,
					'backgroundColor': md3.surfaceContainerHigh,
					'& .MuiLinearProgress-bar': { backgroundColor: md3.primary }
				}}
			/>
			<Typography
				sx={{ fontSize: 14, color: md3.onSurfaceVariant, mb: 2 }}
			>
				{index + 1} / {pages.length}
			</Typography>
			{page &&
				(isTopic ? (
					<TopicSelection {...props} />
				) : (
					<ProcessPageView
						key={page.id}
						{...props}
						page={page}
						language={i18n.language || 'de'}
					/>
				))}
		</Box>
	);
};
