import { usePathname, useRouter } from 'expo-router';
import { Archive, Plus, Settings } from 'lucide-react-native';
import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { LiveCue } from '@/components/layout/LiveCue';
import { activeTabFor, NAV_DESTINATIONS } from '@/components/layout/navDestinations';
import { CategoryGlyph } from '@/components/media/CategoryGlyph';
import { Overline } from '@/components/ui/controls';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useLiveTrips } from '@/features/bazaar/useLiveTrips';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { Avatar } from '@/features/friends/Avatar';
import { MoreButton } from '@/features/manage/MoreButton';
import { useProfile } from '@/hooks/useProfile';
import { SIDEBAR_WIDTH, useHover, webTransition } from '@/hooks/useResponsive';
import { CATEGORY_COUNTS } from '@/lib/catalog';
import { CATEGORIES, categoryAlt, categoryName } from '@/lib/categories';
import { isChecked } from '@/lib/listModel';
import { useBazaarPrefs, useBazaarUi } from '@/store/bazaarPrefs';
import { COLORS } from '@/theme/colors';

/**
 * The desktop shell's navigation: the nav islands, unpacked — and then some.
 *
 * The islands are the phone signature and they earn it there. A mouse has the
 * opposite constraints: 232px of permanent left margin costs nothing on a
 * window this wide, so what the islands compress is spelled out here — your
 * lists, the other pages, the shop's sections — and the planner reads straight
 * off it. A shopping list is the one app in the family where "where am I
 * putting this" is the main question, and the sidebar answers it.
 *
 * It carries navigation and nothing else. The screen's contextual action is
 * *not* here (PING.md §8.6): it lives on the page, beside what it changes.
 */
export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const { t, productLang } = useLang();
  const { lists, archived, items } = useWorkspace();
  const [showArchived, setShowArchived] = useState(false);
  const { count: liveCount } = useLiveTrips();
  const currentListId = useBazaarPrefs((state) => state.listId);
  const setList = useBazaarPrefs((state) => state.setList);
  const catalogCat = useBazaarPrefs((state) => state.catalogCat);
  const setCatalogCat = useBazaarPrefs((state) => state.setCatalogCat);
  const openSheet = useBazaarUi((state) => state.open);

  const activeTab = activeTabFor(pathname);
  const onPlanner = activeTab === 'index' || activeTab === 'catalog';
  const current = lists.find((list) => list.id === currentListId) ?? lists[0] ?? null;
  const history = NAV_DESTINATIONS[2];
  const household = NAV_DESTINATIONS[3];

  const leftOf = (listId: string) => items.filter((item) => item.listId === listId && !isChecked(item)).length;

  return (
    <View
      className="absolute bottom-0 left-0 top-0 border-r border-border/60 bg-background"
      style={{ width: SIDEBAR_WIDTH }}
    >
      <ScrollView contentContainerStyle={{ paddingVertical: 22 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center gap-2 px-5">
          <Text className="text-lg font-bold tracking-tight text-foreground">Bazaar</Text>
          <View className="h-[7px] w-[7px] rounded-full bg-primary" />
        </View>

        <View className="mt-5 gap-0.5 px-2">
          {lists.map((list, index) => (
            <Row
              key={list.id}
              label={list.name}
              active={onPlanner && current?.id === list.id}
              meta={String(leftOf(list.id))}
              shortcut={index === 0 ? '1' : ''}
              icon={NAV_DESTINATIONS[0].icon(onPlanner && current?.id === list.id ? COLORS.foreground : COLORS.muted, 17)}
              onPress={() => {
                setList(list.id);
                router.navigate('/');
              }}
              onLongPress={() => openSheet({ kind: 'editList', listId: list.id })}
              onMore={() => openSheet({ kind: 'editList', listId: list.id })}
              moreLabel={t.moreFor(list.name)}
            />
          ))}
          <Row
            label={t.newList}
            active={false}
            muted
            icon={<Plus color={COLORS.muted} size={17} />}
            onPress={() => openSheet({ kind: 'newList' })}
          />
          {archived.length > 0 && (
            <Row
              label={t.archivedHeading(archived.length)}
              active={false}
              muted
              icon={<Archive color={COLORS.muted} size={17} />}
              onPress={() => setShowArchived((open) => !open)}
            />
          )}
          {showArchived &&
            archived.map((list) => (
              <Row
                key={list.id}
                label={list.name}
                active={false}
                muted
                meta={t.restore}
                icon={<Archive color={COLORS.muted} size={17} />}
                onPress={() => openSheet({ kind: 'editList', listId: list.id })}
              />
            ))}
        </View>

        <View className="mt-1 gap-0.5 px-2">
          <Row
            label={t.history}
            active={activeTab === history.tabName}
            shortcut="3"
            icon={history.icon(activeTab === history.tabName ? COLORS.foreground : COLORS.muted, 17)}
            onPress={() => router.navigate(history.href)}
          />
          <Row
            label={t.household}
            active={activeTab === household.tabName}
            meta={liveCount > 0 ? t.live : ''}
            metaTone={liveCount > 0 ? 'live' : 'muted'}
            shortcut="4"
            icon={household.icon(activeTab === household.tabName ? COLORS.foreground : COLORS.muted, 17)}
            onPress={() => router.navigate(household.href)}
          />
        </View>

        <View className="mt-6 flex-row items-baseline gap-2 px-5 pb-2">
          <Overline className="flex-1">{t.catalog}</Overline>
          <Text className="text-xs text-muted-foreground">
            {Object.values(CATEGORY_COUNTS).reduce((sum, n) => sum + n, 0).toLocaleString('en')}
          </Text>
        </View>
        <View className="gap-0.5 px-2">
          {CATEGORIES.map((category) => {
            const active = onPlanner && catalogCat === category.key;
            return (
              <Row
                key={category.key}
                label={categoryName(category.key, productLang)}
                sub={categoryAlt(category.key, productLang)}
                meta={String(CATEGORY_COUNTS[category.key] ?? 0)}
                active={active}
                icon={<CategoryGlyph glyph={category.glyph} size={16} color={active ? COLORS.foreground : COLORS.muted} />}
                onPress={() => {
                  setCatalogCat(category.key);
                  router.navigate('/');
                }}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* A statement about the whole window, not about a route. */}
      <View className="items-start px-3">
        <LiveCue />
      </View>

      {/* Two Pressables side by side, never one inside the other: on web a
          Pressable is a <button>, and a button inside a button is invalid DOM. */}
      <View className="flex-row items-center gap-1 border-t border-border/60 px-3 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.settings}
          onPress={() => router.navigate('/profile')}
          className="min-w-0 flex-1 flex-row items-center gap-2.5 rounded-lg px-1 py-1.5 active:opacity-80"
          style={activeTab === 'profile' ? { backgroundColor: COLORS.islandPlate } : undefined}
        >
          <Avatar profile={profile} size={32} />
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
              {profile?.displayName || profile?.username || ' '}
            </Text>
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {t.settings}
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.settings}
          hitSlop={8}
          onPress={() => router.navigate('/profile')}
          className="rounded-full p-1.5 active:opacity-70"
        >
          <Settings size={15} color={COLORS.muted} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

/** One row: glyph, name (and its other-language twin), a figure, the key that gets you there. */
function Row({
  label,
  sub,
  meta,
  metaTone = 'muted',
  shortcut,
  icon,
  active,
  muted,
  onPress,
  onLongPress,
  onMore,
  moreLabel,
}: {
  label: string;
  sub?: string;
  meta?: string;
  metaTone?: 'muted' | 'live';
  shortcut?: string;
  icon: ReactNode;
  active: boolean;
  muted?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  /** The row's own menu, shown on hover or when the row is the current one. */
  onMore?: () => void;
  moreLabel?: string;
}) {
  const { hovered, bind } = useHover();

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      {...bind}
      style={[
        webTransition('background-color'),
        active ? { backgroundColor: COLORS.islandPlate } : hovered ? { backgroundColor: COLORS.chipGround } : null,
      ]}
      className="flex-row items-center gap-3 rounded-lg px-3 py-2"
    >
      {icon}
      <View className="min-w-0 flex-1">
        <Text
          className={['text-sm', active ? 'font-semibold text-foreground' : muted ? 'text-muted-foreground' : 'font-semibold text-muted-foreground'].join(' ')}
          numberOfLines={1}
        >
          {label}
        </Text>
        {!!sub && (
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {sub}
          </Text>
        )}
      </View>
      {!!meta && (
        <Text className="text-xs" style={{ color: metaTone === 'live' ? COLORS.live : COLORS.muted }}>
          {meta}
        </Text>
      )}
      {!!onMore && (hovered || active) && <MoreButton label={moreLabel ?? label} onPress={onMore} size={16} />}
      {/* The shortcut prints itself, so the keyboard is discoverable. */}
      {!!shortcut && <Text className="text-[10px] font-semibold text-muted-foreground opacity-60">{shortcut}</Text>}
    </Pressable>
  );
}
