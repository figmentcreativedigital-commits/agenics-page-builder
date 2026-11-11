// Slots added after a page was saved, which it doesn't have yet (see lib/upgrade): the hero and
// call-to-action lines from October 2026, and the table's intro, notes and button from November.
export const MODULES_HIDDEN_BY_DEFAULT = { hero: ["body"], cta: ["assure"], compare: ["intro", "notes", "cta"] };
