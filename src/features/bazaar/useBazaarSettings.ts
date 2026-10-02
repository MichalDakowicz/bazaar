import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';
import { fetchSettings, saveSettings } from '@/features/bazaar/bazaarApi';
import { bazaarKeys } from '@/features/bazaar/useWorkspace';
import { defaultSettings } from '@/lib/normalize';
import { strings, type Strings } from '@/lib/i18n';
import type { Lang } from '@/lib/categories';
import type { BazaarSettings } from '@/types/bazaar';

/** The device's own locale, for the first run only. Hermes and browsers both expose it through Intl. */
function deviceLocale(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || null;
  } catch {
    return null;
  }
}

const LOCALE = Platform.OS === 'web' && typeof navigator !== 'undefined' ? (navigator.language ?? deviceLocale()) : deviceLocale();

/**
 * `public.bazaar_settings` — Bazaar's own row, not `user_settings`: that one is
 * Radar's, and a sibling may write exactly two of its columns. The language you
 * shop in is an account fact (the web build should open in it too), which is why
 * it is here and not in MMKV.
 *
 * Optimistic, so a toggle answers the tap instead of the round trip.
 */
export function useBazaarSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = bazaarKeys.settings(user?.id);

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchSettings(user!.id, LOCALE),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: (patch: Partial<BazaarSettings>) => saveSettings(user!.id, patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<BazaarSettings>(key);
      queryClient.setQueryData<BazaarSettings>(key, { ...(previous ?? defaultSettings(LOCALE)), ...patch });
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const settings = query.data ?? defaultSettings(LOCALE);
  return {
    settings,
    loading: query.isLoading,
    update: (patch: Partial<BazaarSettings>) => mutation.mutateAsync(patch),
  };
}

/** The two languages and the dictionary for the interface one. */
export function useLang(): { appLang: Lang; productLang: Lang; t: Strings } {
  const { settings } = useBazaarSettings();
  return useMemo(
    () => ({ appLang: settings.appLang, productLang: settings.productLang, t: strings(settings.appLang) }),
    [settings.appLang, settings.productLang],
  );
}
