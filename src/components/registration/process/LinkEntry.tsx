import * as React from 'react';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGetLinkJourney } from '../../../api/apiGetJourney';
import { Loading } from '../../app/Loading';

/**
 * A link of its own (`/l/<slug>`, ADR-039): the registration with the link's
 * process, its topic (when it names exactly one) and its centre. An unknown
 * link opens the normal registration.
 */
export const LinkEntry = () => {
	const { slug = '' } = useParams<{ slug: string }>();
	const navigate = useNavigate();

	useEffect(() => {
		let cancelled = false;
		apiGetLinkJourney(slug).then(({ journey, link }) => {
			if (cancelled) return;
			if (!journey || !link) {
				navigate('/registration', { replace: true });
				return;
			}
			const params = new URLSearchParams({ link: slug });
			if (link.topicIds.length === 1)
				params.set('tid', String(link.topicIds[0]));
			if (link.agencyId) params.set('aid', String(link.agencyId));
			navigate(`/registration?${params.toString()}`, { replace: true });
		});
		return () => {
			cancelled = true;
		};
	}, [slug, navigate]);

	return <Loading />;
};
