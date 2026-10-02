import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ContentShell } from '@/components/layout/ContentShell';
import { ScreenFrame } from '@/components/layout/ScreenFrame';
import { ScreenTop } from '@/components/layout/ScreenTop';
import { Overline, Segmented, SwitchRow } from '@/components/ui/controls';
import { useAuth } from '@/features/auth/AuthProvider';
import { QrLoginControl } from '@/features/auth/qr/QrLoginControl';
import { useBazaarSettings, useLang } from '@/features/bazaar/useBazaarSettings';
import { Avatar } from '@/features/friends/Avatar';
import { AlwaysHomeEditor } from '@/features/settings/AlwaysHomeEditor';
import { AppUpdateControl } from '@/features/settings/AppUpdateControl';
import { useSettingsCopy } from '@/features/settings/copy';
import { SignOutSheet } from '@/features/settings/SignOutSheet';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { useProfile } from '@/hooks/useProfile';
import { MAX_W, useGutter } from '@/hooks/useResponsive';
import type { Lang } from '@/lib/categories';
import type { ThemePref } from '@/lib/userSettings';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Settings, with you at the top of it — the avatar plate's destination.
 *
 * Two languages and they are different questions: the one the app speaks to you
 * in, and the one products are named in. The second says plainly that search
 * covers both either way, because "I switched to Polish and now English words
 * find nothing" is exactly the worry a language switch invites.
 *
 * The theme row says out loud that it is shared with the other Ping apps —
 * telling someone that after the fact is how you lose their trust in a switch.
 */
export function SettingsScreen() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const { t } = useLang();
  const copy = useSettingsCopy();
  const { settings, update } = useBazaarSettings();
  const { theme, setTheme } = useTheme();
  const navBarSpace = useNavBarSpace();
  const gutter = useGutter();
  const [signingOut, setSigningOut] = useState(false);

  const languages: { value: Lang; label: string }[] = [
    { value: 'en', label: copy.english },
    { value: 'pl', label: copy.polish },
  ];

  return (
    <ScreenFrame>
      <ScrollView contentContainerStyle={{ paddingBottom: navBarSpace }} showsVerticalScrollIndicator={false}>
        <ScreenTop />
        <ContentShell maxWidth={MAX_W.text}>
          <View className={['flex-row items-center gap-3.5 pt-1', gutter].join(' ')}>
            <Avatar profile={profile} size={56} />
            <View className="min-w-0 flex-1">
              <Text className="text-2xl font-bold tracking-tight text-foreground" numberOfLines={1}>
                {t.settings}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {[profile?.displayName || profile?.username, user?.email].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>

          <View className={['mt-6 gap-4 border-y border-border/50 py-5', gutter].join(' ')}>
            <Overline>{t.language}</Overline>
            <View className="gap-2">
              <Text className="text-base font-semibold text-foreground">{t.appL}</Text>
              <Segmented<Lang> label={t.appL} value={settings.appLang} onChange={(appLang) => void update({ appLang })} options={languages} />
            </View>
            <View className="gap-2">
              <Text className="text-base font-semibold text-foreground">{t.prodL}</Text>
              <Segmented<Lang> label={t.prodL} value={settings.productLang} onChange={(productLang) => void update({ productLang })} options={languages} />
              <Text className="text-xs text-muted-foreground">{t.prodNote}</Text>
            </View>
          </View>

          <View className={['gap-1 pt-6', gutter].join(' ')}>
            <Overline>{t.shopH}</Overline>
            <SwitchRow label={t.swipeLabel} sub={t.swipeSub} value={settings.swipeToCheck} onChange={(swipeToCheck) => void update({ swipeToCheck })} />
            <SwitchRow label={t.notifyAdds} sub={t.notifyAddsSub} value={settings.notifyAdds} onChange={(notifyAdds) => void update({ notifyAdds })} />
            <SwitchRow
              label={t.notifyShopping}
              sub={t.notifyShoppingSub}
              value={settings.notifyShopping}
              onChange={(notifyShopping) => void update({ notifyShopping })}
            />
          </View>

          <View className={['pt-6', gutter].join(' ')}>
            <AlwaysHomeEditor />
          </View>

          <View className={['gap-3 pt-7', gutter].join(' ')}>
            <Overline>{t.appearance}</Overline>
            <Segmented<ThemePref>
              label={t.appearance}
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'dark', label: copy.themeDark },
                { value: 'light', label: copy.themeLight },
                { value: 'system', label: copy.themeSystem },
              ]}
            />
            <Text className="text-xs text-muted-foreground">{copy.themeNote}</Text>
          </View>

          <View className={['gap-3 pt-7', gutter].join(' ')}>
            <Overline>{t.otherDevices}</Overline>
            <QrLoginControl />
          </View>

          <View className={['pt-7', gutter].join(' ')}>
            <Overline>{t.about}</Overline>
            <View className="mt-2">
              <AppUpdateControl />
            </View>
            <Text className="mt-1 text-xs text-muted-foreground">{copy.aboutNote}</Text>
          </View>

          <View className={['py-7', gutter].join(' ')}>
            <Pressable accessibilityRole="button" accessibilityLabel={t.signOut} hitSlop={8} onPress={() => setSigningOut(true)}>
              <Text className="text-sm font-semibold text-destructive-foreground">{t.signOut}</Text>
            </Pressable>
          </View>
        </ContentShell>
      </ScrollView>
      <SignOutSheet open={signingOut} onClose={() => setSigningOut(false)} />
    </ScreenFrame>
  );
}
