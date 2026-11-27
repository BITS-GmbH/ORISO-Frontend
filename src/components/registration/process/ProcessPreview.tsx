import * as React from 'react';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Box, Button, LinearProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
	LocaleContext,
	RegistrationContext,
	RegistrationData
} from '../../../globalState';
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
	const { t, i18n } = useTranslation();
	const { updateRegistrationData, disabledNextButton } =
		useContext(RegistrationContext);
	const [message, setMessage] = useState<ProcessPreviewMessage>();
	const { setLocale } = useContext(LocaleContext);
	const setLocaleRef = useRef(setLocale);
	setLocaleRef.current = setLocale;

	useEffect(() => {
		const receive = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;
			if (!isPreviewMessage(event.data)) return;
			setMessage(event.data);
			const { language } = event.data;
			if (language) setLocaleRef.current?.(language);
		};
		window.addEventListener('message', receive);
		window.parent?.postMessage(
			{ type: 'oriso:process-preview-ready' },
			window.location.origin
		);
		return () => window.removeEventListener('message', receive);
	}, []);

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

	const goTo = useCallback((page: number) => {
		window.parent?.postMessage(
			{ type: 'oriso:process-preview-page', page },
			window.location.origin
		);
	}, []);

	if (!message) return null;
	const pages = withAccountLast(processPagesOf(message.journey));
	const index = Math.max(0, Math.min(message.page, pages.length - 1));
	const page = pages[index];
	const isLast = index >= pages.length - 1;
	const props = {
		onChange,
		onNextClick: () => !isLast && goTo(index + 1),
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
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mt: 4,
					gap: 2
				}}
			>
				<Button
					variant="text"
					disabled={index === 0}
					onClick={() => goTo(index - 1)}
				>
					{t('registration.back')}
				</Button>
				<Button
					variant="contained"
					disabled={isLast || disabledNextButton}
					onClick={() => goTo(index + 1)}
					sx={{ borderRadius: 20, px: 4 }}
				>
					{isLast
						? t('registration.register')
						: t('registration.next')}
				</Button>
			</Box>
		</Box>
	);
};
