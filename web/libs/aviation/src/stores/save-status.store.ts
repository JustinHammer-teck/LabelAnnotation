import { atom } from 'jotai';
import type { SaveStatus } from '../types';

export const saveStatusAtom = atom<SaveStatus>({
  state: 'idle',
  lastSaved: null,
  error: null,
});
