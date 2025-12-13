import { atom } from 'jotai';
import type { LabelingItem } from '../types';

export const labelingItemsAtom = atom<LabelingItem[]>([]);

export const currentItemIndexAtom = atom<number>(0);

export const itemsDirtyAtom = atom<boolean>(false);

export const itemsLoadingAtom = atom<boolean>(false);
