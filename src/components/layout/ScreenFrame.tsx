import { BlurTargetView } from 'expo-blur';
import { useRef, type ReactNode } from 'react';
import { View } from 'react-native';

import { AppChrome } from '@/components/layout/AppChrome';
import { useSidebarSpace } from '@/hooks/useResponsive';

/**
 * The ground every screen stands on: the scope, with the desktop sidebar's width
 * taken off the left.
 *
 * The sidebar is absolutely positioned and reserves no layout, so a screen
 * insets by `useSidebarSpace` as a `marginLeft` on its body — padding on the
 * parent would drag the sidebar along with it (PING.md §8.6). A screen pushed
 * out of the tabs covers the tabs navigator and so has to mount the navigation
 * itself; say `pushed` and it does — with the body in the `BlurTargetView` its
 * glass blurs, beside it rather than around it.
 */
export function ScreenFrame({ children, pushed = false }: { children: ReactNode; pushed?: boolean }) {
  const sidebar = useSidebarSpace();
  const blurTarget = useRef<View>(null);

  const body = (
    <View className="flex-1" style={{ marginLeft: sidebar }}>
      {children}
    </View>
  );

  if (!pushed) return <View className="flex-1 bg-background">{body}</View>;

  return (
    <View className="flex-1 bg-background">
      <BlurTargetView ref={blurTarget} style={{ flex: 1 }}>
        {body}
      </BlurTargetView>
      <AppChrome blurTarget={blurTarget} />
    </View>
  );
}
