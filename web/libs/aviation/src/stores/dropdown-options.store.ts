import { atom } from 'jotai';
import type { DropdownOptionsState } from '../types';

export const dropdownOptionsAtom = atom<DropdownOptionsState>({});

export const dropdownLoadingAtom = atom<boolean>(false);
