import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import en from '../translations/en.json';
import vi from '../translations/vi.json';

const LANGUAGE_STORAGE_KEY = '@ai_doorbell_language';

// Define the available languages
export const resources = {
  en: {
    translation: en,
  },
  vi: {
    translation: vi,
  },
};

export const availableLanguages = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
];

export const getLanguageNameByCode = (code: string): string => {
  const language = availableLanguages.find(lang => lang.code === code);
  return language ? language.name : 'English';
};

export const initializeI18n = async () => {
  // Try to get the saved language from AsyncStorage
  let savedLanguage;
  try {
    savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.error('Error loading language from storage:', error);
  }

  // Use the saved language, or device language, or default to English
  const deviceLanguage = Localization.locale.split('-')[0];
  const languageToUse = savedLanguage || 
    (resources[deviceLanguage] ? deviceLanguage : 'en');

  await i18next
    .use(initReactI18next)
    .init({
      resources,
      lng: languageToUse,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v3',
    });

  return i18next;
};

export const changeLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await i18next.changeLanguage(language);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

export default i18next;