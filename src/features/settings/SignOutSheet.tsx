import { useState } from 'react';
import { View } from 'react-native';

import { SheetDialog } from '@/components/ui/SheetDialog';
import { useToast } from '@/components/ui/Toast';
import { signOut, type SignOutScope } from '@/features/auth/authActions';
import { SignOutScopePicker } from '@/features/auth/SignOutScopePicker';

type SignOutSheetProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * The sign-out sheet and the question it asks: Just Bazaar, or every Ping app.
 * Closing puts it back on "Just Bazaar", so the reach-everywhere answer is
 * always a choice someone made, never one left over from last time.
 */
export function SignOutSheet({ open, onClose }: SignOutSheetProps) {
  const { say } = useToast();
  const [scope, setScope] = useState<SignOutScope>('local');

  const close = () => {
    setScope('local');
    onClose();
  };

  return (
    <SheetDialog
      open={open}
      title="Sign out?"
      body="Your lists stay where they are. The same account signs back in."
      confirmLabel={scope === 'local' ? 'Sign out of Bazaar' : 'Sign out everywhere'}
      dismissLabel="Stay"
      tone="destructive"
      onConfirm={async () => {
        const chosen = scope;
        close();
        try {
          await signOut(chosen);
        } catch (error) {
          say(error instanceof Error ? error.message : 'That did not work.');
        }
      }}
      onDismiss={close}
    >
      <View className="mt-4">
        <SignOutScopePicker value={scope} onChange={setScope} />
      </View>
    </SheetDialog>
  );
}
