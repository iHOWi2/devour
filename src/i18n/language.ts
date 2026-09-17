/** The languages Devour ships. Adding one is a dictionary plus a plural rule. */
export const LANGUAGES = ['en', 'ru'] as const;

export type Language = (typeof LANGUAGES)[number];
