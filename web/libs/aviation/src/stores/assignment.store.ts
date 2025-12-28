import { atom } from 'jotai';
import type { AviationProjectAssignment } from '../types/assignment.types';

/**
 * Atom holding project assignment data.
 * Stores the list of users and their assignment status for an aviation project.
 */
export const assignmentsAtom = atom<AviationProjectAssignment[]>([]);

/**
 * Atom tracking loading state for assignments.
 * True when fetching assignments from the API.
 */
export const assignmentsLoadingAtom = atom<boolean>(false);

/**
 * Atom tracking error state for assignments.
 * Contains error message string if an error occurred, null otherwise.
 */
export const assignmentsErrorAtom = atom<string | null>(null);

/**
 * Atom tracking toggling state (during assignment updates).
 * True when an assignment toggle operation is in progress.
 */
export const assignmentsTogglingAtom = atom<boolean>(false);
