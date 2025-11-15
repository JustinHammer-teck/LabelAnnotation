import { atom } from 'jotai';

export type ActiveTab = 'projects' | 'files';

export interface FilesFilter {
  fileType: string | null;
  status: string | null;
}

export interface FilesPagination {
  page: number;
  pageSize: number;
  total: number;
}

export const activeTabAtom = atom<ActiveTab>('projects');

export const filesPaginationAtom = atom<FilesPagination>({
  page: 1,
  pageSize: 30,
  total: 0,
});

export const filesFiltersAtom = atom<FilesFilter>({
  fileType: null,
  status: null,
});

export const filesLoadingAtom = atom<boolean>(false);

export const selectedProjectAtom = atom<number | null>(null);
