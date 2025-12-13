import { createContext, useContext } from 'react';
import type { AviationApiClient } from './api-client';

export const AviationApiContext = createContext<AviationApiClient | null>(null);

export const AviationApiProvider = AviationApiContext.Provider;

export const useAviationApi = (): AviationApiClient => {
  const api = useContext(AviationApiContext);
  if (!api) {
    throw new Error('AviationApiContext not provided');
  }
  return api;
};
