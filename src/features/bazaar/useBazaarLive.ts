import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { useBazaarSettings } from '@/features/bazaar/useBazaarSettings';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { productName } from '@/lib/search';
import { strings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useLiveStatus } from '@/store/liveStatus';

/**
 * The lists, pushed rather than polled.
 *
 * This is the app: a list that does not move on the phone when somebody adds to
 * it on the web is a note, not a shared list. Postgres replicates the five
 * `bazaar_*` tables the screens read; row-level security decides which events a
 * given session may hear, so there is no filter to forget here. An event does
 * not carry the change — it says which query is now a lie, and the refetch is
 * the source of truth.
 *
 * It also speaks, once, when somebody else does something while the app is open
 * and the setting is on: "Marta added Sour cream, Dill" as a toast. That is the
 * whole of the notification promise today — there is no push channel for Bazaar
 * (see docs/shared-database.md), so a closed app learns on its next open.
 */

type Scope = 'lists' | 'items' | 'trips' | 'activity' | 'history' | 'people';

/** One burst of events becomes one set of reads. */
const COALESCE_MS = 250;
/** Items added in the same breath are announced together. */
const ANNOUNCE_MS = 1500;

const TABLE_SCOPES: Record<string, Scope[]> = {
  bazaar_lists: ['lists'],
  bazaar_list_members: ['lists', 'people', 'activity'],
  bazaar_items: ['items', 'activity', 'history'],
  bazaar_trips: ['trips', 'activity', 'items'],
  bazaar_activity: ['activity'],
};

const ALL_SCOPES: Scope[] = ['lists', 'items', 'trips', 'activity', 'history', 'people'];

export function useBazaarLive() {
  const { user } = useAuth();
  const client = useQueryClient();
  const { say } = useToast();
  const setStatus = useLiveStatus((state) => state.setStatus);
  const { settings } = useBazaarSettings();
  const { people } = useWorkspace();

  // The handlers close over the channel for its whole life, so what they read
  // must be live, not captured at subscribe time.
  const latest = useRef({ settings, people, say });
  useEffect(() => {
    latest.current = { settings, people, say };
  });

  const pending = useRef(new Set<Scope>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announce = useRef<{ names: string[]; actor: string | null; timer: ReturnType<typeof setTimeout> | null }>({
    names: [],
    actor: null,
    timer: null,
  });

  const flush = useCallback(() => {
    timer.current = null;
    const scopes = [...pending.current];
    pending.current.clear();
    for (const scope of scopes) void client.invalidateQueries({ queryKey: ['bazaar', scope] });
  }, [client]);

  const touch = useCallback(
    (scopes: Scope[]) => {
      scopes.forEach((scope) => pending.current.add(scope));
      // The first event in a burst starts the clock; the rest join it.
      if (timer.current === null) timer.current = setTimeout(flush, COALESCE_MS);
    },
    [flush],
  );

  const refreshAll = useCallback(() => touch(ALL_SCOPES), [touch]);

  const nameOf = useCallback((id: string | null | undefined) => {
    const person = id ? latest.current.people.get(id) : null;
    return person?.displayName ?? null;
  }, []);

  const queueAnnouncement = useCallback(
    (actorId: string | null, name: string) => {
      const box = announce.current;
      box.actor = actorId;
      box.names.push(name);
      if (box.timer) return;
      box.timer = setTimeout(() => {
        const { names, actor } = box;
        box.names = [];
        box.timer = null;
        const { settings: current, say: speak } = latest.current;
        const t = strings(current.appLang);
        speak(t.addedItems(nameOf(actor) ?? t.someone, [...new Set(names)].join(', ')));
      }, ANNOUNCE_MS);
    },
    [nameOf],
  );

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
      const box = announce.current;
      if (box.timer) clearTimeout(box.timer);
      box.timer = null;
      box.names = [];
    },
    [],
  );

  useEffect(() => {
    if (!user?.id) {
      setStatus('connecting');
      return;
    }
    const me = user.id;
    let alive = true;
    let joined = false;
    // Suffixed so a fast refresh that mounts the replacement before the old
    // channel is torn down does not leave two of one name on a socket.
    const channel = supabase.channel(`bazaar:${me}:${Math.random().toString(36).slice(2)}`);

    for (const table of Object.keys(TABLE_SCOPES)) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        touch(TABLE_SCOPES[table]);

        const row = (payload.new ?? {}) as Record<string, unknown>;
        const { settings: current, say: speak } = latest.current;
        if (payload.eventType !== 'INSERT') return;

        if (table === 'bazaar_items' && current.notifyAdds && typeof row.added_by === 'string' && row.added_by !== me) {
          const name = productName(
            { en: String(row.name_en ?? ''), pl: String(row.name_pl ?? '') },
            current.productLang,
          );
          if (name) queueAnnouncement(row.added_by, name);
        }
        if (table === 'bazaar_trips' && current.notifyShopping && typeof row.shopper_id === 'string' && row.shopper_id !== me) {
          const t = strings(current.appLang);
          speak(t.isShopping(nameOf(row.shopper_id) ?? t.someone));
        }
      });
    }

    channel.subscribe((status) => {
      if (!alive) return;
      if (status === 'SUBSCRIBED') {
        setStatus('live');
        // A *re*join: the socket was away, its events went nowhere, and the
        // cache has a hole of unknown size. The first join needs nothing.
        if (joined) refreshAll();
        joined = true;
        return;
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setStatus('down');
    });

    return () => {
      alive = false;
      setStatus('connecting');
      void supabase.removeChannel(channel);
    };
  }, [user?.id, touch, refreshAll, setStatus, queueAnnouncement, nameOf]);

  // A phone that slept and a browser tab that did are the same case: the socket
  // may have died without reporting it, so coming back is the trigger.
  useEffect(() => {
    if (!user?.id) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshAll();
    });
    return () => subscription.remove();
  }, [user?.id, refreshAll]);
}
