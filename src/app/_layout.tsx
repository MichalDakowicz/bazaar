import '@/global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NAV_DESTINATIONS } from '@/components/layout/navDestinations';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { HandoffReplay } from '@/features/auth/HandoffReplay';
import { useSessionRoute } from '@/features/auth/useSessionRoute';
import { BazaarLive } from '@/features/bazaar/BazaarLive';
import { UpdateNotice } from '@/features/updates/UpdateNotice';
import { useIsDesktop } from '@/hooks/useResponsive';
import { useWebShortcuts } from '@/hooks/useWebShortcuts';
import { queryClient } from '@/lib/queryClient';
import { useBazaarUi } from '@/store/bazaarPrefs';
import { ThemeProvider } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  // Above the Stack, so it also covers the screens pushed out of the tabs, where
  // the tabs navigator's own <Redirect> never runs.
  useSessionRoute();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  // Nothing mounts until auth resolves, so no screen ever renders a signed-out
  // shape and then swaps.
  if (loading) return null;

  return (
    <>
      {/* Only while signed in: a channel with no session hears nothing. */}
      {user ? <BazaarLive /> : null}
      {children}
    </>
  );
}

/**
 * Keyboard wiring for the browser build. It has to sit above the navigator so
 * the keys work on every route, not only on the five that are tabs.
 */
function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const requestSearch = useBazaarUi((state) => state.requestSearch);

  const selectTab = useCallback(
    (index: number) => {
      const destination = NAV_DESTINATIONS[index];
      if (destination) router.navigate(destination.href);
    },
    [router],
  );

  // `n` and `/` both mean "let me type a product". In the planner the search
  // field is on the page; on a phone it is the add screen.
  const search = useCallback(() => {
    if (isDesktop) {
      router.navigate('/');
      requestSearch();
    } else {
      router.navigate('/add');
    }
  }, [isDesktop, router, requestSearch]);

  useWebShortcuts({ onSelectTab: selectTab, onCapture: search, onSearch: search });

  return (
    <>
      {children}
      <UpdateNotice />
      <HandoffReplay />
    </>
  );
}

/**
 * The shell, top to bottom. There is no header anywhere in this app — the nav
 * islands (or, on a wide window, the sidebar) are the only chrome, and every
 * screen starts with its own ScreenTop.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider>
              <ToastProvider>
                <AuthGate>
                  <AppShell>
                    <Stack screenOptions={{ headerShown: false }} />
                  </AppShell>
                </AuthGate>
              </ToastProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
