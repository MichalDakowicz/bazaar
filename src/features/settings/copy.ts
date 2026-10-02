import { useLang } from '@/features/bazaar/useBazaarSettings';

const en = {
  themeDark: 'Dark',
  themeLight: 'Light',
  themeSystem: 'System',
  themeNote: 'Shared with every Ping app — picking light here picks light there.',
  aboutNote:
    'One account across Radar, Lidar, Sonar, Pulsar, Cellar and Bazaar. Your lists are visible only to the people you put on them. Signing out asks whether to leave just Bazaar or every Ping app.',
  homeAdd: 'Add something you never need to buy',
  homeEmpty: 'Nothing here — a pasted recipe will list salt and water like anything else.',
  homeRemove: (name: string) => `Remove ${name}`,
  english: 'English',
  polish: 'Polski',
  noName: 'You',
};

const pl: typeof en = {
  themeDark: 'Ciemny',
  themeLight: 'Jasny',
  themeSystem: 'Systemowy',
  themeNote: 'Wspólny dla wszystkich aplikacji Ping — jasny tutaj to jasny wszędzie.',
  aboutNote:
    'Jedno konto w Radarze, Lidarze, Sonarze, Pulsarze, Cellarze i Bazaarze. Twoje listy widzą tylko osoby, które na nie dodasz. Wylogowanie pyta, czy opuścić tylko Bazaar, czy wszystkie aplikacje Ping.',
  homeAdd: 'Dodaj coś, czego nigdy nie trzeba kupować',
  homeEmpty: 'Pusto — wklejony przepis wypisze sól i wodę jak każdy inny składnik.',
  homeRemove: (name) => `Usuń: ${name}`,
  english: 'English',
  polish: 'Polski',
  noName: 'Ty',
};

export function useSettingsCopy() {
  return useLang().appLang === 'pl' ? pl : en;
}
