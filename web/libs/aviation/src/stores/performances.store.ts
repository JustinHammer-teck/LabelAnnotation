import { atom } from 'jotai';
import type { ResultPerformance } from '../types';

export const performancesAtom = atom<ResultPerformance[]>([]);

export const performancesLoadingAtom = atom<boolean>(false);

export const performancesErrorAtom = atom<string | null>(null);
