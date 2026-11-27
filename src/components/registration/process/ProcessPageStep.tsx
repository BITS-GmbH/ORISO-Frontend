import * as React from 'react';
import {
	ComponentProps,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { RegistrationContext } from '../../../globalState';
import type { RegistrationStep } from '../registrationSteps';
import { TopicSelection } from '../topicSelection/TopicSelection';
import { ZipcodeInput } from '../zipcodeInput/ZipcodeInput';
import { AgencySelection } from '../agencySelection/AgencySelection';
import { AccountData } from '../accountData/AccountData';
import { AgeInput } from '../demographicInput/AgeInput';
import { StateInput } from '../demographicInput/StateInput';
import { JourneyQuestionField } from '../../journey/JourneyQuestionField';
import {
	emptyAnswers,
	isStepComplete,
	textIn,
	type JourneyStep,
	type StepAnswers
} from '../../journey/journeyModel';
import {
	registrationScreenIntroSx,
	registrationScreenTitleSx
} from '../registrationDesign/registrationDesign';
import { isAccountBlock, type ProcessPage } from './processPages';

type StepProps = ComponentProps<RegistrationStep['component']>;

/**
 * Lets several of the registration's own screens share one page: each reports
 * its "Weiter" state here instead of to the registration, and the page's
 * button lights up once every one of them and every required question is ready.
 */
const Slot = ({
	id,
	onDisabled,
	children
}: {
	id: string;
	onDisabled: (id: string, disabled: boolean) => void;
	children: ReactNode;
}) => {
	const context = useContext(RegistrationContext);
	const setDisabledNextButton = useCallback(
		(value: boolean | ((previous: boolean) => boolean)) =>
			onDisabled(id, typeof value === 'function' ? value(true) : value),
		[id, onDisabled]
	);
	const value = useMemo(
		() => ({ ...context, setDisabledNextButton }),
		[context, setDisabledNextButton]
	);
	return (
		<RegistrationContext.Provider value={value}>
			{children}
		</RegistrationContext.Provider>
	);
};

const QuestionBlock = ({
	step,
	answers,
	language,
	onAnswers
}: {
	step: JourneyStep;
	answers: StepAnswers;
	language: string;
	onAnswers: (answers: StepAnswers) => void;
}) => (
	<Box sx={{ display: 'grid', gap: 3 }}>
		{(step.questions ?? []).map((question) => (
			<JourneyQuestionField
				key={question.id}
				question={question}
				answer={answers.questions[question.id]}
				language={language}
				onChange={(answer) =>
					onAnswers({
						...answers,
						questions: {
							...answers.questions,
							[question.id]: answer
						}
					})
				}
			/>
		))}
	</Box>
);

const blockFor = (step: JourneyStep, props: StepProps) => {
	if (step.core === 'topic') return <TopicSelection {...props} />;
	if (step.core === 'postcode') return <ZipcodeInput {...props} />;
	if (step.core === 'agency') return <AgencySelection {...props} />;
	if (step.addon === 'age') return <AgeInput onChange={props.onChange} />;
	if (step.addon === 'state') return <StateInput onChange={props.onChange} />;
	return null;
};

export const ProcessPageView = ({
	page,
	language,
	...props
}: StepProps & { page: ProcessPage; language: string }) => {
	const { registrationData, updateRegistrationData, setDisabledNextButton } =
		useContext(RegistrationContext);
	const [disabled, setDisabled] = useState<Record<string, boolean>>({});
	const latest = useRef(registrationData);
	latest.current = registrationData;
	const { onChange: stepOnChange } = props;
	const shared =
		page.steps.filter((step) => step.kind !== 'question').length > 1;
	/* The registration keeps a step's input until "Weiter". Screens that share a
	   page read each other's input (the centre list needs the postcode), so on
	   such a page every input is taken over at once. */
	const onChange = useCallback(
		(patch: Parameters<StepProps['onChange']>[0]) => {
			stepOnChange(patch);
			if (!shared) return;
			const current = latest.current ?? {};
			const next = typeof patch === 'function' ? patch(current) : patch;
			const changed = Object.entries(next).some(
				([key, value]) => current[key as keyof typeof current] !== value
			);
			if (changed) updateRegistrationData?.(next);
		},
		[stepOnChange, shared, updateRegistrationData]
	);
	const blockProps = { ...props, onChange };
	const onDisabled = useCallback(
		(id: string, value: boolean) =>
			setDisabled((current) =>
				current[id] === value ? current : { ...current, [id]: value }
			),
		[]
	);
	const allAnswers = registrationData?.processAnswers ?? {};
	const answersOf = (step: JourneyStep) =>
		allAnswers[step.id] ?? emptyAnswers();
	const questionsReady = page.steps
		.filter((step) => step.kind === 'question')
		.every((step) => isStepComplete(step, answersOf(step)));
	const accountShown = page.steps.find(isAccountBlock);
	const slots = page.steps.filter(
		(step) =>
			step.kind !== 'question' &&
			!(isAccountBlock(step) && step !== accountShown)
	);
	const blocked =
		!questionsReady ||
		slots.some((step) => disabled[step.id] ?? step.kind !== 'question');

	useEffect(() => {
		setDisabledNextButton?.(blocked);
	}, [blocked, setDisabledNextButton]);

	const title = textIn(page.title, language);
	return (
		<Box sx={{ display: 'grid', gap: 4 }} data-cy="process-page">
			{title && (
				<Typography component="h1" sx={registrationScreenTitleSx}>
					{title}
				</Typography>
			)}
			{page.steps.map((step) => {
				if (step.kind === 'question') {
					return (
						<Box key={step.id} sx={{ display: 'grid', gap: 1 }}>
							{textIn(step.title, language) && (
								<Typography
									component="h2"
									sx={registrationScreenTitleSx}
								>
									{textIn(step.title, language)}
								</Typography>
							)}
							{textIn(step.description, language) && (
								<Typography sx={registrationScreenIntroSx}>
									{textIn(step.description, language)}
								</Typography>
							)}
							<QuestionBlock
								step={step}
								answers={answersOf(step)}
								language={language}
								onAnswers={(answers) =>
									updateRegistrationData?.({
										processAnswers: {
											...allAnswers,
											[step.id]: answers
										}
									})
								}
							/>
						</Box>
					);
				}
				if (isAccountBlock(step)) {
					return step === accountShown ? (
						<Slot
							key={step.id}
							id={step.id}
							onDisabled={onDisabled}
						>
							<AccountData {...blockProps} />
						</Slot>
					) : null;
				}
				const block = blockFor(step, blockProps);
				return block ? (
					<Slot key={step.id} id={step.id} onDisabled={onDisabled}>
						{block}
					</Slot>
				) : null;
			})}
		</Box>
	);
};

const CANONICAL: Partial<Record<string, string>> = {
	topic: 'topic-selection',
	postcode: 'zipcode',
	agency: 'agency-selection',
	age: 'age',
	state: 'state'
};

const MANDATORY: Partial<Record<string, string[]>> = {
	topic: ['mainTopic'],
	postcode: ['zipcode'],
	agency: ['agency'],
	username: ['username', 'password']
};

const stepNameOf = (page: ProcessPage, index: number) => {
	if (page.steps.some(isAccountBlock)) return 'account-data';
	if (page.steps.length === 1) {
		const only = page.steps[0];
		const canonical = CANONICAL[only.core ?? only.addon ?? ''];
		if (canonical) return canonical;
	}
	return `seite-${index + 1}`;
};

/** One page of a process as a step of the registration wizard. */
export const processPageStep = (
	page: ProcessPage,
	index: number,
	language: string,
	label: string
): RegistrationStep & { label?: string } => {
	const Component = (props: StepProps) => (
		<ProcessPageView {...props} page={page} language={language} />
	);
	const name = stepNameOf(page, index);
	return {
		component: Component,
		name,
		label: name.startsWith('seite-') ? label : undefined,
		mandatoryFields: page.steps.flatMap(
			(step) => MANDATORY[step.core ?? ''] ?? []
		)
	};
};

export const useProcessLanguage = () => {
	const { i18n } = useTranslation();
	return i18n.language || 'de';
};
