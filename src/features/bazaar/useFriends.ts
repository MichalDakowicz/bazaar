import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthProvider';
import { fetchFriends } from '@/features/bazaar/bazaarApi';
import { bazaarKeys } from '@/features/bazaar/useWorkspace';
import type { Person } from '@/types/bazaar';

const NONE: Person[] = [];

/**
 * My friends — Radar's `friendships`, read-only here. Bazaar never writes the
 * friend list; it only lets you put someone already on it onto a list.
 */
export function useFriends() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: bazaarKeys.friends(user?.id),
    queryFn: () => fetchFriends(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  return { friends: query.data ?? NONE, loading: query.isLoading };
}
