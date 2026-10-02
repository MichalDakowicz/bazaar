import { useBazaarLive } from '@/features/bazaar/useBazaarLive';

/**
 * Renders nothing. Mounted once from the tabs layout so the subscription
 * outlives any one screen — a channel opened by the Lists tab would close the
 * moment you walked to History, which is exactly when someone adds to the list.
 */
export function BazaarLive() {
  useBazaarLive();
  return null;
}
