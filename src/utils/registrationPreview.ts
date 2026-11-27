/**
 * The Admin frames /registration-preview on the same host. There the app must
 * behave as a stranger: no token from the Admin's cookies, no cookie removed,
 * no language stored, so the Admin around it keeps its session and its words.
 */
export const isRegistrationPreview = () =>
	typeof window !== 'undefined' &&
	window.location.pathname.startsWith('/registration-preview');
