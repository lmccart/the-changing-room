import i18next from 'i18next';
import translationEN from './locales/en/translation.json' assert { type: "json" };
import translationFR from './locales/fr/translation.json' assert { type: "json" };

// requires type: module in package.json

const resources = {
  en: {
    translation: translationEN
  },
  fr: {
    translation: translationFR
  }
};

// i18Init('en');
// translate('Loading');

// i18next.use(Backend).init({
//   lng: 'fr',
//   fallbackLang: 'en',
//   initImmediate: false,
//   resources: {
//     en: {
//       translation: {
//         'loading': 'Loading English...'
//       }
//     },
//     fr: {
//       translation: {
//         'loading': 'Chargement en cours...'
//       }
//     }
//   },
// }
// );

i18next.init({
  lng: 'en',
  preload: ['en', 'fr'],
  fallbackLang: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  initImmediate: false,
  resources
}
);

console.log(i18next.t('loading'));

