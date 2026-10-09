import { SwitchRow } from '@/components/ui/controls';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useListMode } from '@/features/bazaar/useListMode';

export function ListModeControl() {
  const { t } = useLang();
  const mode = useListMode();
  return (
    <SwitchRow
      label={t.generalListToggle}
      sub={t.generalListSub}
      value={mode.settings.generalList}
      disabled={mode.loading || mode.busy || !!mode.error}
      onChange={(enabled) => void mode.change(enabled)}
    />
  );
}
