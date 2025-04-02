import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pt from './locales/pt';
import en from './locales/en';

// Configuração de i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      pt: {
        translation: pt
      },
      en: {
        translation: en
      }
    },
    lng: localStorage.getItem('language') || 'pt',
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false // React já faz o escape por padrão
    }
  });

export default i18n;