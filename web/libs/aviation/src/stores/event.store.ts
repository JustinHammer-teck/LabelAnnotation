import { atom } from 'jotai';
import type { AviationEvent } from '../types';

export const currentEventAtom = atom<AviationEvent | null>(null);

export const eventLoadingAtom = atom<boolean>(false);

export const eventErrorAtom = atom<string | null>(null);
