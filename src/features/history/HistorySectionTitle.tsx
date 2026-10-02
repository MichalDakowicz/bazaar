import { Text } from 'react-native';

/** "THIS WEEK" — the overline above a run of trips, the same one a list uses for its sections. */
export function HistorySectionTitle({ title }: { title: string }) {
  return (
    <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground" numberOfLines={1}>
      {title}
    </Text>
  );
}
