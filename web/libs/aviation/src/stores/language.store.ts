import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type Language = 'en' | 'cn';

const STORAGE_KEY = 'aviation-language';

export const languageAtom = atomWithStorage<Language>(STORAGE_KEY, 'cn');

export const isChineseAtom = atom((get) => get(languageAtom) === 'cn');

export const isEnglishAtom = atom((get) => get(languageAtom) === 'en');
