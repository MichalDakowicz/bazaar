import { type Href } from 'expo-router';
import { ChartColumn, CircleUserRound, LayoutGrid, ListChecks, Users } from 'lucide-react-native';
import { type ReactNode } from 'react';

import type { Strings } from '@/lib/i18n';

/**
 * The five destinations, in bar order: Lists, Catalog, History, Household, and
 * you — which here is Settings, because the avatar plate is where a person goes
 * to change how the app speaks to them.
 *
 * Tabs 3–5 do not carry the family's names (Stats · Social · Profile): a
 * shopping app has no figures worth a tab, but it has a past (History) and a
 * set of people (Household), and the design settled on those. The shape is the
 * same — three tabs after the two the app is *for*, the last of them yours.
 */
export type NavLabelKey = 'lists' | 'catalog' | 'history' | 'household' | 'settings';

export type NavDestination = {
  href: Href;
  /** English, for accessibility only; the screen prints `t[labelKey]`. */
  label: string;
  labelKey: NavLabelKey & keyof Strings;
  /** Route name in (tabs) — the key the navigator uses. */
  tabName: string;
  icon: (color: string, size: number) => ReactNode;
  /**
   * Route-driven, because the bar also renders on routes pushed *out* of the
   * tabs. Those keep their parent destination lit — you have not left Lists just
   * because you opened one.
   */
  isActive: (pathname: string) => boolean;
};

export const NAV_DESTINATIONS: NavDestination[] = [
  {
    href: '/',
    label: 'Lists',
    labelKey: 'lists',
    tabName: 'index',
    icon: (color, size) => <ListChecks color={color} size={size} />,
    // A list's own page and the add screen are both pushed from here.
    isActive: (pathname) => pathname === '/' || pathname.startsWith('/list/') || pathname.startsWith('/add'),
  },
  {
    href: '/catalog',
    label: 'Catalog',
    labelKey: 'catalog',
    tabName: 'catalog',
    icon: (color, size) => <LayoutGrid color={color} size={size} />,
    // A section's product list is pushed from here.
    isActive: (pathname) => pathname.startsWith('/catalog') || pathname.startsWith('/category/'),
  },
  {
    href: '/history',
    label: 'History',
    labelKey: 'history',
    tabName: 'history',
    icon: (color, size) => <ChartColumn color={color} size={size} />,
    isActive: (pathname) => pathname.startsWith('/history'),
  },
  {
    href: '/household',
    label: 'Household',
    labelKey: 'household',
    tabName: 'household',
    icon: (color, size) => <Users color={color} size={size} />,
    // Marta's live shopping is a page of the household, not a destination.
    isActive: (pathname) => pathname.startsWith('/household') || pathname.startsWith('/live/'),
  },
  {
    href: '/profile',
    label: 'Settings',
    labelKey: 'settings',
    tabName: 'profile',
    icon: (color, size) => <CircleUserRound color={color} size={size} />,
    isActive: (pathname) => pathname.startsWith('/profile'),
  },
];

/** Which destination owns the current route, or null on a route no tab claims. */
export function activeTabFor(pathname: string): string | null {
  return NAV_DESTINATIONS.find((destination) => destination.isActive(pathname))?.tabName ?? null;
}

/**
 * Routes that live *above* a tab rather than in it. They keep their parent
 * destination lit, but the left island becomes Back — which is why no pushed
 * screen in this app draws a back button of its own.
 */
export function isPushedRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/list/') ||
    pathname.startsWith('/add') ||
    pathname.startsWith('/live/') ||
    pathname.startsWith('/category/')
  );
}
