import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from '../locales/en/translation.json';
import cnTranslations from '../locales/cn/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      cn: { translation: cnTranslations },
    },
    lng: 'en',
    fallbackLng: 'en',
  });

export default i18n;
