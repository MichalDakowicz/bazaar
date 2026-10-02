import { ScrollView, Text, View } from 'react-native';

import { ScreenTop } from '@/components/layout/ScreenTop';
import { Overline } from '@/components/ui/controls';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { usePlannerCopy } from '@/features/planner/copy';
import { PlannerListRow } from '@/features/planner/PlannerListRow';
import type { PlannerListModel } from '@/features/planner/usePlannerList';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { readError } from '@/lib/utils';

/**
 * The list you are filling, at the right of the planner: its name and figures,
 * what you have just put on it, then the shop's sections. Reads only — adding
 * happens in the grid, shopping happens on the phone.
 */
export function PlannerList({
  list,
  loading,
  error,
  onRetry,
  onNewList,
}: {
  list: PlannerListModel | null;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  onNewList: () => void;
}) {
  const { t } = useLang();
  const copy = usePlannerCopy();
  const navBarSpace = useNavBarSpace();

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: navBarSpace }}>
      <ScreenTop extra={0} />
      <View className="px-6">
        {error ? (
          <ErrorState message={readError(error)} onRetry={onRetry} />
        ) : loading ? (
          <LoadingState />
        ) : !list ? (
          <EmptyState title={t.noListsTitle} body={copy.noListsBody} action={{ label: t.newList, onPress: onNewList }} />
        ) : (
          <>
            <Text className="text-xl font-bold text-foreground" numberOfLines={1}>
              {list.name}
            </Text>
            <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={2}>
              {list.meta}
            </Text>

            {list.just.length > 0 && (
              <View className="mt-5">
                <Text className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">{t.justAdded}</Text>
                {list.just.map((line) => (
                  <PlannerListRow key={line.id} line={line} onToggle={list.toggle} />
                ))}
              </View>
            )}

            {list.sections.map((section) => (
              <View key={section.key} className="mt-5">
                <Overline className="mb-1.5">{section.title}</Overline>
                {section.lines.map((line) => (
                  <PlannerListRow key={line.id} line={line} onToggle={list.toggle} />
                ))}
              </View>
            ))}

            {list.total === 0 && <EmptyState title={t.emptyListTitle} body={copy.emptyBody} />}
          </>
        )}
      </View>
    </ScrollView>
  );
}
