import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type Language = 'en' | 'zh';

const STORAGE_KEY = 'aviation-language';

export const languageAtom = atomWithStorage<Language>(STORAGE_KEY, 'zh');

export const isChineseAtom = atom((get) => get(languageAtom) === 'zh');

export const isEnglishAtom = atom((get) => get(languageAtom) === 'en');
