import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useBazaarUi } from '@/store/bazaarPrefs';

/**
 * Esc from anywhere on the page, not only from inside the search field.
 *
 * The field handles its own keys (react-native-web stops them bubbling), so this
 * only ever sees Esc pressed after a click landed somewhere else — on a product,
 * on an option — which is exactly when a keyboard user reaches for it. It stands
 * down while a sheet is open: Esc then belongs to the sheet.
 */
export function usePlannerShortcuts(onEscape: () => void) {
  const sheetOpen = useBazaarUi((state) => state.sheet !== null);
  const latest = useRef(onEscape);

  useEffect(() => {
    latest.current = onEscape;
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || sheetOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) latest.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sheetOpen]);
}
