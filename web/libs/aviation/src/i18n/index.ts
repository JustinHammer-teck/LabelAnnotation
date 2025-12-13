import i18n from 'i18next';
import { initReactI18next, useTranslation as useI18nTranslation } from 'react-i18next';

import enTranslations from './locales/en.json';
import zhTranslations from './locales/zh.json';

const STORAGE_KEY = 'aviation-language';

const getStoredLanguage = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY) || 'zh';
  }
  return 'zh';
};

const aviationResources = {
  en: { aviation: enTranslations.aviation },
  zh: { aviation: zhTranslations.aviation },
};

let isInitialized = false;

export const initAviationI18n = (): void => {
  if (isInitialized) return;

  if (i18n.isInitialized) {
    Object.entries(aviationResources).forEach(([lng, namespaces]) => {
      Object.entries(namespaces).forEach(([ns, resources]) => {
        i18n.addResourceBundle(lng, ns, resources, true, true);
      });
    });
  } else {
    i18n.use(initReactI18next).init({
      resources: {
        en: { aviation: enTranslations.aviation },
        zh: { aviation: zhTranslations.aviation },
      },
      lng: getStoredLanguage(),
      fallbackLng: 'zh',
      ns: ['aviation'],
      defaultNS: 'aviation',
      interpolation: {
        escapeValue: false,
      },
    });
  }

  isInitialized = true;
};

export const useAviationTranslation = () => {
  const { t, i18n: i18nInstance } = useI18nTranslation('aviation');

  const changeLanguage = (lng: 'en' | 'zh') => {
    i18nInstance.changeLanguage(lng);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lng);
    }
  };

  const currentLanguage = (i18nInstance.language || 'zh') as 'en' | 'zh';

  return {
    t,
    i18n: i18nInstance,
    changeLanguage,
    currentLanguage,
  };
};

export const getAviationI18n = () => i18n;

export { i18n };
