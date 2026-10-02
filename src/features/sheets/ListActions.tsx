import { Pressable, Text, View } from 'react-native';

import { useLang } from '@/features/bazaar/useBazaarSettings';

type ListActionsProps = {
  /** The list is archived: offer Restore where Archive would be. */
  archived: boolean;
  /** Owners archive and clear the feed; anyone on the list may empty it. */
  isOwner: boolean;
  hasItems: boolean;
  onArchive: () => void;
  onRestore: () => void;
  onEmpty: () => void;
  onClearActivity: () => void;
};

/**
 * The quiet ways to tidy a list that stop short of deleting it: out of the way
 * (archive, and back), emptied, or with its feed wiped. Words rather than
 * buttons, under the fields — a sheet that offers four buttons is a sheet that
 * gets the wrong one tapped.
 */
export function ListActions({ archived, isOwner, hasItems, onArchive, onRestore, onEmpty, onClearActivity }: ListActionsProps) {
  const { t } = useLang();

  const links: { label: string; onPress: () => void }[] = [];
  if (isOwner) links.push(archived ? { label: t.restoreList, onPress: onRestore } : { label: t.archive, onPress: onArchive });
  if (hasItems) links.push({ label: t.emptyList, onPress: onEmpty });
  if (isOwner) links.push({ label: t.clearActivity, onPress: onClearActivity });
  if (links.length === 0) return null;

  return (
    <View className="gap-3.5 pt-1">
      {links.map((link) => (
        <Pressable key={link.label} accessibilityRole="button" accessibilityLabel={link.label} onPress={link.onPress} className="self-start active:opacity-70">
          <Text className="text-sm font-semibold text-muted-foreground">{link.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
