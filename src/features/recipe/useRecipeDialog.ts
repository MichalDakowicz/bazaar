import { useCallback, useDeferredValue, useMemo, useState } from 'react';

import { useToast } from '@/components/ui/Toast';
import { useAdder } from '@/features/add/useAdder';
import { useBazaarSettings, useLang } from '@/features/bazaar/useBazaarSettings';
import { useBazaarWrites } from '@/features/bazaar/useBazaarWrites';
import { usePurchaseHistory, useWorkspace } from '@/features/bazaar/useWorkspace';
import { recipeLine, withFlips } from '@/features/recipe/recipeLines';
import { applyPlan, planRecipe, planTotals, type PlanContext } from '@/lib/recipe';
import { buildUsuals } from '@/lib/usuals';

const NONE: ReadonlySet<string> = new Set();

/**
 * The recipe dialog's whole brain: the pasted text, the plan read off it, the
 * switches the user flips, and the writes the button makes.
 *
 * The plan is recomputed as the text changes (deferred, so typing never waits on
 * a catalogue scan) and against the list as it is *now* — a quantity another
 * person just changed shows up in the row. Nothing is kept of the list here.
 */
export function useRecipeDialog(open: boolean, onClose: () => void) {
  const { t, productLang } = useLang();
  const { settings } = useBazaarSettings();
  const { list, addMany } = useAdder();
  const workspace = useWorkspace();
  const writes = useBazaarWrites();
  const { say } = useToast();
  const history = usePurchaseHistory();

  const [text, setText] = useState('');
  const [flipped, setFlipped] = useState<ReadonlySet<string>>(NONE);
  const [busy, setBusy] = useState(false);

  // Opening starts from a blank page. Done while rendering, not in an effect: the
  // reset lands in the same pass as `open`, so the dialog never shows last
  // time's paste for a frame.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setText('');
      setFlipped(NONE);
      setBusy(false);
    }
  }

  // Stable between renders, unlike `useAdder().items`, so the plan below is only
  // recomputed when the list or the text actually changed.
  const listId = list?.id ?? null;
  const items = useMemo(() => workspace.items.filter((item) => item.listId === listId), [workspace.items, listId]);
  // The usuals' "bought recently" window is 45 days; a session's age is noise.
  const [now] = useState(() => Date.now());
  const usuals = useMemo(() => buildUsuals(history, now), [history, now]);
  const deferred = useDeferredValue(text);

  const plan = useMemo(() => {
    if (!open || deferred.trim() === '') return { title: '', rows: [] };
    const context: PlanContext = { items, alwaysHome: settings.alwaysHome, usuals, lang: productLang };
    return planRecipe(deferred, context);
  }, [open, deferred, items, settings.alwaysHome, usuals, productLang]);

  const rows = useMemo(() => withFlips(plan.rows, flipped), [plan.rows, flipped]);
  const lines = useMemo(() => rows.map((row) => recipeLine(row, t, productLang)), [rows, t, productLang]);
  const totals = useMemo(() => planTotals(rows), [rows]);

  const toggle = useCallback((raw: string) => {
    setFlipped((current) => {
      const next = new Set(current);
      if (next.has(raw)) next.delete(raw);
      else next.add(raw);
      return next;
    });
  }, []);

  const canApply = !!list && !busy && totals.add + totals.update > 0;

  const apply = useCallback(async () => {
    if (!canApply) return;
    const { adds, updates } = applyPlan(rows);
    // What each raised item held before, so Undo can put it back.
    const before = new Map(items.map((item) => [item.id, item.qty]));

    setBusy(true);
    const added = adds.length > 0 ? await addMany(adds) : [];
    if (!added) {
      // The write already said why in a toast; leave the dialog open to retry.
      setBusy(false);
      return;
    }
    const raised = await Promise.all(
      updates.map(async (update) => ((await writes.changeQty(update.itemId, update.qty)) ? update : null)),
    );
    const done = raised.filter((update): update is NonNullable<typeof update> => update !== null);

    setBusy(false);
    // Every write failed (each said why): nothing happened, so say nothing more.
    if (added.length === 0 && done.length === 0) return;
    onClose();
    say(t.recipeAdded(plan.title, added.length, done.length), {
      label: t.undo,
      onPress: () => {
        if (added.length > 0) void writes.removeItems(added);
        for (const update of done) {
          const previous = before.get(update.itemId);
          if (previous !== undefined) void writes.changeQty(update.itemId, previous);
        }
      },
    });
  }, [canApply, rows, items, addMany, writes, onClose, say, t, plan.title]);

  return {
    text,
    setText,
    lines,
    found: lines.length,
    totals,
    canApply,
    busy,
    hasList: !!list,
    apply,
    toggle,
  };
}
