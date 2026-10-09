import { ScrollView, Text, View } from 'react-native';

import { ScreenFrame } from '@/components/layout/ScreenFrame';
import { ScreenTop } from '@/components/layout/ScreenTop';
import { PickChip } from '@/components/ui/PickChip';
import { CustomItemAction } from '@/features/add/CustomItemAction';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { OptionPanel } from '@/features/planner/OptionPanel';
import { PlannerList } from '@/features/planner/PlannerList';
import { PlannerSearchBar } from '@/features/planner/PlannerSearchBar';
import { ProductGrid } from '@/features/planner/ProductGrid';
import { usePlanner } from '@/features/planner/usePlanner';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { useGutter } from '@/hooks/useResponsive';
import { LIST_COLUMN } from '@/lib/planner';

/**
 * The web is for planning: on a wide window the Lists and Catalog tabs are this
 * one screen. The centre is the search field and the catalogue (the section
 * picked in the sidebar, or what the search found); the right is the list the
 * things are going onto. Everything it knows comes from `usePlanner`.
 */
export function PlannerScreen() {
  const { t } = useLang();
  const gutter = useGutter();
  const navBarSpace = useNavBarSpace();
  const planner = usePlanner();

  return (
    <ScreenFrame>
      <View className="flex-1 flex-row bg-background">
        <ScrollView
          className="min-w-0 flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: navBarSpace }}
        >
          <ScreenTop extra={0} />
          <View className={gutter}>
            <PlannerSearchBar
              inputRef={planner.input}
              value={planner.query}
              onChangeText={planner.setQuery}
              onEscape={planner.clear}
              onSubmit={planner.submit}
              onRecipe={planner.openRecipe}
            />
            {planner.customName !== null && (
              <CustomItemAction label={`${t.addOwn} “${planner.customName}”`} onPress={planner.addTyped} />
            )}

            <View className="mt-6 flex-row items-baseline gap-2.5">
              <Text className="text-2xl font-bold tracking-tight text-foreground" numberOfLines={1}>
                {planner.title}
              </Text>
              <Text className="min-w-0 shrink text-sm text-muted-foreground" numberOfLines={1}>
                {planner.subtitle}
              </Text>
              <Text className="ml-auto pl-3 text-xs text-muted-foreground" numberOfLines={1}>
                {planner.count}
              </Text>
            </View>

            <ProductGrid
              rows={planner.rows}
              cols={planner.cols}
              openId={planner.openId}
              panel={planner.panel ? <OptionPanel panel={planner.panel} /> : null}
              onCell={planner.onCell}
            />

            {planner.more && (
              <View className="mt-4 items-start">
                <PickChip label={planner.more.label} selected={false} onPress={planner.more.onPress} />
              </View>
            )}

            {planner.nothingFor !== null && (
              <View className="items-center gap-1.5 px-8 py-16">
                <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>{`${t.nothing} “${planner.nothingFor}”`}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {planner.showList && (
          <View className="border-l border-border/50" style={{ width: LIST_COLUMN }}>
            <PlannerList
              list={planner.list}
              loading={planner.loading}
              error={planner.error}
              onRetry={planner.refetch}
              onNewList={planner.newList}
            />
          </View>
        )}
      </View>
    </ScreenFrame>
  );
}
