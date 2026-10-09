import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { setListMode } from '@/features/bazaar/listModeApi';
import { useBazaarSettings, useLang } from '@/features/bazaar/useBazaarSettings';
import { bazaarKeys } from '@/features/bazaar/useWorkspace';
import { readError } from '@/lib/utils';
import type { BazaarSettings } from '@/types/bazaar';

export function useListMode() {
  const { user } = useAuth();
  const { settings, loading, error, refetch } = useBazaarSettings();
  const { t } = useLang();
  const client = useQueryClient();
  const { say } = useToast();
  const key = bazaarKeys.settings(user?.id);
  const mutationKey = ['bazaar', 'listMode', user?.id];
  const busy = useIsMutating({ mutationKey }) > 0;
  const mutation = useMutation({
    mutationKey,
    mutationFn: (enabled: boolean) => setListMode(enabled, t.generalList, settings),
    onSuccess: async (id, enabled) => {
      // Publish the prepared ID only after the transaction commits.
      client.setQueryData<BazaarSettings>(key, (previous) => ({
        ...(previous ?? settings), generalList: enabled, generalListId: id,
      }));
      await Promise.all([
        client.invalidateQueries({ queryKey: bazaarKeys.lists(user?.id) }),
        client.invalidateQueries({ queryKey: key }),
      ]);
    },
    onError: (failure) => say(readError(failure)),
  });

  return {
    settings, loading, error, busy, refetch,
    change: async (enabled: boolean): Promise<boolean> => {
      if (!user || busy || loading || error) return false;
      try {
        await mutation.mutateAsync(enabled);
        return true;
      } catch {
        return false;
      }
    },
  };
}
