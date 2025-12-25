import i18n from 'i18next';
import { initReactI18next, useTranslation as useI18nTranslation } from 'react-i18next';

import enTranslations from './locales/en.json';
import cnTranslations from './locales/zh.json';

const STORAGE_KEY = 'aviation-language';

const getStoredLanguage = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY) || 'cn';
  }
  return 'cn';
};

const aviationResources = {
  en: { aviation: enTranslations.aviation },
  cn: { aviation: cnTranslations.aviation },
};

let isInitialized = false;

export const initAviationI18n = (): void => {
  if (isInitialized) return;

  if (i18n.isInitialized) {
    // Main app already initialized i18n - just add aviation resources as a new namespace
    Object.entries(aviationResources).forEach(([lng, namespaces]) => {
      Object.entries(namespaces).forEach(([ns, resources]) => {
        i18n.addResourceBundle(lng, ns, resources, true, true);
      });
    });
  } else {
    // Aviation is initializing first - set up with both translation and aviation namespaces
    i18n.use(initReactI18next).init({
      resources: {
        en: { aviation: enTranslations.aviation },
        cn: { aviation: cnTranslations.aviation },
      },
      lng: getStoredLanguage(),
      fallbackLng: 'en',
      ns: ['translation', 'aviation'],
      defaultNS: 'translation',
      interpolation: {
        escapeValue: false,
      },
    });
  }

  isInitialized = true;
};

export const useAviationTranslation = () => {
  const { t, i18n: i18nInstance } = useI18nTranslation('aviation');

  const changeLanguage = (lng: 'en' | 'cn') => {
    i18nInstance.changeLanguage(lng);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lng);
    }
  };

  const currentLanguage = (i18nInstance.language || 'cn') as 'en' | 'cn';

  return {
    t,
    i18n: i18nInstance,
    changeLanguage,
    currentLanguage,
  };
};

export const getAviationI18n = () => i18n;

export { i18n };
