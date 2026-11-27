import * as React from 'react';
import {
	Dispatch,
	FC,
	SetStateAction,
	useContext,
	useEffect,
	useMemo,
	useState
} from 'react';
import {
	Box,
	Checkbox,
	FormControlLabel,
	FormGroup,
	Radio,
	RadioGroup,
	Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { RegistrationContext, RegistrationData } from '../../../globalState';
import { apiGetTopicsData } from '../../../api/apiGetTopicsData';
import type { TopicsDataInterface } from '../../../globalState/interfaces';
import { OrisoTextField } from '../../form/OrisoTextField';
import { textIn, type JourneyStep } from '../../journey/journeyModel';
import {
	registrationScreenIntroSx,
	registrationScreenTitleSx
} from '../registrationDesign/registrationDesign';

type OnChange = Dispatch<SetStateAction<Partial<RegistrationData>>>;

interface BlockProps {
	step: JourneyStep;
	language: string;
	onChange: OnChange;
}

export const GENDERS = ['MALE', 'FEMALE', 'DIVERS', 'NOT_PROVIDED'] as const;

const MAX_AGE = 120;

export const isAge = (value: string) =>
	/^[0-9]{1,3}$/.test(value) && Number(value) > 0 && Number(value) <= MAX_AGE;

const Heading = ({ step, language }: Omit<BlockProps, 'onChange'>) => (
	<>
		{textIn(step.title, language) && (
			<Typography component="h2" sx={registrationScreenTitleSx}>
				{textIn(step.title, language)}
			</Typography>
		)}
		{textIn(step.description, language) && (
			<Typography sx={registrationScreenIntroSx}>
				{textIn(step.description, language)}
			</Typography>
		)}
	</>
);

const useReady = (ready: boolean) => {
	const { setDisabledNextButton } = useContext(RegistrationContext);
	useEffect(() => {
		setDisabledNextButton?.(!ready);
	}, [ready, setDisabledNextButton]);
};

export const AgeYearsInput: FC<BlockProps> = ({ step, language, onChange }) => {
	const { t } = useTranslation();
	const { registrationData } = useContext(RegistrationContext);
	const [value, setValue] = useState(registrationData?.age ?? '');
	const valid = isAge(value);
	useReady(valid);
	useEffect(() => {
		onChange({ age: valid ? String(Number(value)) : undefined });
	}, [onChange, valid, value]);
	return (
		<Box sx={{ display: 'grid', gap: 1.5 }} data-cy="registration-age">
			<Heading step={step} language={language} />
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
				<OrisoTextField
					value={value}
					onChange={(event) =>
						setValue(
							event.target.value.replace(/\D/g, '').slice(0, 3)
						)
					}
					placeholder={t('registration.ageYears.placeholder')}
					inputProps={{
						'inputMode': 'numeric',
						'aria-label': textIn(step.title, language) || 'age',
						'data-cy': 'registration-age-input'
					}}
					sx={{ width: 120 }}
				/>
				<Typography>{t('registration.ageYears.unit')}</Typography>
			</Box>
		</Box>
	);
};

export const GenderInput: FC<BlockProps> = ({ step, language, onChange }) => {
	const { t } = useTranslation();
	const { registrationData } = useContext(RegistrationContext);
	const [value, setValue] = useState(registrationData?.gender ?? '');
	useReady(value !== '');
	useEffect(() => {
		if (value) onChange({ gender: value });
	}, [onChange, value]);
	return (
		<Box sx={{ display: 'grid', gap: 1 }} data-cy="registration-gender">
			<Heading step={step} language={language} />
			<RadioGroup
				value={value}
				onChange={(event) => setValue(event.target.value)}
			>
				{GENDERS.map((gender) => (
					<FormControlLabel
						key={gender}
						value={gender}
						control={<Radio />}
						label={t(`registration.gender.${gender}`)}
					/>
				))}
			</RadioGroup>
		</Box>
	);
};

const useTopics = () => {
	const [topics, setTopics] = useState<TopicsDataInterface[]>();
	useEffect(() => {
		let cancelled = false;
		apiGetTopicsData()
			.then((loaded) => {
				if (!cancelled) setTopics(loaded ?? []);
			})
			.catch(() => {
				if (!cancelled) setTopics([]);
			});
		return () => {
			cancelled = true;
		};
	}, []);
	return topics;
};

const topicName = (topic: TopicsDataInterface) => topic.name.trim();

/** Every topic that fits, ticked; the topic choice after it offers only these. */
export const TopicsInput: FC<BlockProps> = ({ step, language, onChange }) => {
	const topics = useTopics();
	const { registrationData } = useContext(RegistrationContext);
	const [ticked, setTicked] = useState<number[]>(
		registrationData?.topicIds ?? []
	);
	useReady(ticked.length > 0);
	useEffect(() => {
		onChange({ topicIds: ticked });
	}, [onChange, ticked]);
	const toggle = (id: number) =>
		setTicked((current) =>
			current.includes(id)
				? current.filter((candidate) => candidate !== id)
				: [...current, id]
		);
	return (
		<Box sx={{ display: 'grid', gap: 1 }} data-cy="registration-topics">
			<Heading step={step} language={language} />
			<FormGroup>
				{(topics ?? []).map((topic) => (
					<FormControlLabel
						key={topic.id}
						control={
							<Checkbox
								checked={ticked.includes(topic.id)}
								onChange={() => toggle(topic.id)}
							/>
						}
						label={topicName(topic)}
					/>
				))}
			</FormGroup>
		</Box>
	);
};

/**
 * The topic asked after other blocks (ADR-039): it picks the main topic, from
 * the topics ticked before when there were any.
 */
export const TopicChoice: FC<BlockProps> = ({ step, language, onChange }) => {
	const topics = useTopics();
	const { registrationData } = useContext(RegistrationContext);
	const ticked = registrationData?.topicIds;
	const offered = useMemo(
		() =>
			(topics ?? []).filter(
				(topic) => !ticked?.length || ticked.includes(topic.id)
			),
		[ticked, topics]
	);
	const [value, setValue] = useState<number | undefined>(
		registrationData?.mainTopic?.id
	);
	const chosen = offered.find((topic) => topic.id === value);
	useReady(chosen !== undefined);
	useEffect(() => {
		if (chosen) onChange({ mainTopic: chosen, mainTopicId: chosen.id });
	}, [chosen, onChange]);
	return (
		<Box
			sx={{ display: 'grid', gap: 1 }}
			data-cy="registration-topic-choice"
		>
			<Heading step={step} language={language} />
			<RadioGroup
				value={value ?? ''}
				onChange={(event) => setValue(Number(event.target.value))}
			>
				{offered.map((topic) => (
					<FormControlLabel
						key={topic.id}
						value={topic.id}
						control={<Radio />}
						label={topicName(topic)}
					/>
				))}
			</RadioGroup>
		</Box>
	);
};
