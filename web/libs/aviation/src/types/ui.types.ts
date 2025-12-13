export interface SaveStatus {
  state: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  error: string | null;
}
