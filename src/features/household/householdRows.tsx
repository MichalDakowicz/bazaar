import { ChevronRight } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { CardRow } from '@/components/media/CardList';
import { StatusChip } from '@/components/ui/StatusChip';
import { Avatar } from '@/features/friends/Avatar';
import type { HouseholdSection } from '@/features/household/useHouseholdScreen';
import { COLORS } from '@/theme/colors';

/**
 * The household's sections as the one flat list `CardList` draws: a heading,
 * then — in Today — a live row for every trip somebody else is out on, then the
 * feed. A live row is the only row that is ever pressable; the feed is news.
 *
 * `chevron` is the phone's hint that the row opens a page; on a wide window the
 * trip is already beside the feed, so the row only has a selected ground.
 */
export function householdRows(sections: HouseholdSection[], liveLabel: string, chevron: boolean): CardRow[] {
  const rows: CardRow[] = [];

  for (const section of sections) {
    rows.push({
      type: 'heading',
      key: `h:${section.key}`,
      node: (
        <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground" numberOfLines={1}>
          {section.title}
        </Text>
      ),
    });

    for (const live of section.live) {
      rows.push({
        type: 'card',
        key: `live:${live.id}`,
        props: {
          leading: <Avatar profile={live.person} size={36} />,
          title: live.title,
          subtitle: live.subtitle,
          selected: live.selected,
          onPress: live.onPress,
          accessibilityLabel: `${live.title}, ${liveLabel}`,
          trailing: (
            <View className="flex-row items-center gap-2">
              <StatusChip label={liveLabel} />
              {chevron && <ChevronRight size={16} color={COLORS.muted} strokeWidth={2} />}
            </View>
          ),
        },
      });
    }

    for (const row of section.rows) {
      rows.push({
        type: 'card',
        key: `feed:${row.id}`,
        props: {
          dense: true,
          strong: false,
          titleLines: 3,
          leading: <Avatar profile={row.person} size={36} />,
          title: row.title,
          subtitle: row.subtitle,
        },
      });
    }
  }

  return rows;
}
