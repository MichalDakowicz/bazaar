import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Platform } from 'react-native';

/**
 * A tap under the thumb for the one moment that happens without looking: an item
 * landing in the basket. Nothing else buzzes — a phone that answers every chip is
 * a phone you turn this off on.
 *
 * Off on the web, where there is nothing to vibrate. Every call swallows its own
 * failure: a haptic engine that is busy or missing must never be why a tick
 * looked like it failed.
 */
export function useHaptics() {
  return useMemo(
    () => ({
      tick: () => {
        if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      },
    }),
    [],
  );
}
