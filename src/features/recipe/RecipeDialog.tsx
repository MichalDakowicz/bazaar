import { useEffect } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLang } from '@/features/bazaar/useBazaarSettings';
import { RecipeFooter } from '@/features/recipe/RecipeFooter';
import { RecipeInput } from '@/features/recipe/RecipeInput';
import { RecipeResults } from '@/features/recipe/RecipeResults';
import { useRecipeDialog } from '@/features/recipe/useRecipeDialog';
import { useIsDesktop } from '@/hooks/useResponsive';

/** The desktop card's cap and the phone sheet's share of the window (PING.md §9.8). */
const CARD = { width: 1040, height: 700 };
const SHEET_HEIGHT = '94%';

/**
 * Paste a recipe, see what it means for the list, press one button.
 *
 * Two shapes of one thing, like every sheet here: on a wide window a centred
 * two-column card (the paste on the left, the plan on the right, both in view
 * at once), on a phone a full-height sheet with the paste on top and the plan
 * beneath it. The ground is always on a plain View and the backdrop is a sibling
 * *behind* the card, never its parent — a click inside would otherwise bubble to
 * it and close the dialog the user is typing into.
 */
export function RecipeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLang();
  const isDesktop = useIsDesktop();
  const insets = useSafeAreaInsets();
  const recipe = useRecipeDialog(open, onClose);

  // A dialog with no visible way out is a trap for anyone on a keyboard.
  useEffect(() => {
    if (Platform.OS !== 'web' || !open || typeof document === 'undefined') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const results = (
    <RecipeResults
      lines={recipe.lines}
      hasList={recipe.hasList}
      desktop={isDesktop}
      onToggle={recipe.toggle}
      onClose={onClose}
    />
  );
  const footer = (
    <RecipeFooter
      label={t.recipeBtn(recipe.totals.add, recipe.totals.update)}
      enabled={recipe.canApply}
      desktop={isDesktop}
      onApply={() => void recipe.apply()}
      onCancel={onClose}
    />
  );

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View className={isDesktop ? 'flex-1 items-center justify-center p-10' : 'flex-1 justify-end'}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.cancel}
          onPress={onClose}
          className="absolute inset-0 bg-black/60"
        />
        {isDesktop ? (
          <Animated.View
            entering={FadeIn.duration(160)}
            style={{ width: '100%', maxWidth: CARD.width, height: '100%', maxHeight: CARD.height }}
          >
            <View className="flex-1 flex-row overflow-hidden rounded-2xl border border-border bg-background">
              <View className="min-w-0 flex-1 p-8">
                <RecipeInput value={recipe.text} onChange={recipe.setText} fill autoFocus />
              </View>
              <View className="min-w-0 flex-1 border-l border-border/50 p-8">
                {results}
                {footer}
              </View>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={SlideInDown.duration(240)} style={{ height: SHEET_HEIGHT }}>
            <View
              className="flex-1 rounded-t-[20px] border-t border-border bg-popover px-4 pt-3"
              style={{ paddingBottom: insets.bottom + 16 }}
            >
              <View className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
              <RecipeInput value={recipe.text} onChange={recipe.setText} fill={false} autoFocus={false} />
              {results}
              {footer}
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}
