import { Redirect, Tabs } from 'expo-router';

import { AppChrome } from '@/components/layout/AppChrome';
import { useAuth } from '@/features/auth/AuthProvider';
import { BazaarSheets } from '@/features/sheets/BazaarSheets';

/**
 * The tab shell. Navigation is the app's only chrome and it comes in two shapes
 * — the floating islands on a phone, the sidebar on desktop web
 * (components/layout/AppChrome) — both of which drive themselves off the route
 * rather than off this navigator, so they can also render on screens pushed out
 * of the tabs.
 *
 * `index` is Lists: on a phone the lists you have, on a wide window the planner
 * for the one you are filling. It is the home route because looking at the list
 * is what you open a shopping app to do.
 */
export default function TabsLayout() {
  const { user } = useAuth();

  if (!user) return <Redirect href="/login" />;

  return (
    <>
      <Tabs
        tabBar={() => <AppChrome />}
        // No scene animation: react-navigation cross-fades over the navigator's
        // own background, which flashes white on every swap. The movement that
        // makes a tab change feel smooth lives in the bar, where the marker
        // slides between destinations.
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'hsl(0 0% 3.9%)' } }}
      >
        <Tabs.Screen name="index" options={{ title: 'Lists' }} />
        <Tabs.Screen name="catalog" options={{ title: 'Catalog' }} />
        <Tabs.Screen name="history" options={{ title: 'History' }} />
        <Tabs.Screen name="household" options={{ title: 'Household' }} />
        <Tabs.Screen name="profile" options={{ title: 'Settings' }} />
      </Tabs>
      {/* One instance of each sheet for the whole app, so the sidebar's New list
          and a row's own button open the same one (PING.md §9.8). */}
      <BazaarSheets />
    </>
  );
}
