import { atom } from 'jotai';
import type { AviationProject } from '../types';

export const projectsAtom = atom<AviationProject[]>([]);

export const projectsLoadingAtom = atom<boolean>(false);

export const projectsErrorAtom = atom<string | null>(null);

export const currentProjectAtom = atom<AviationProject | null>(null);
