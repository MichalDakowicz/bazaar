import { useCallback } from 'react';

import { useToast } from '@/components/ui/Toast';
import { HandoffStatus } from '@/features/auth/HandoffStatus';
import { siblingFailureCopy } from '@/features/auth/siblingCopy';
import { useSignInReturn } from '@/features/auth/useSignInReturn';

/** `bazaar://sign-in-return` — the sibling Bazaar asked has answered (PING.md §9.13). */
export default function SignInReturn() {
  const { say } = useToast();
  const onFailure = useCallback(
    (outcome: Parameters<typeof siblingFailureCopy>[0]) => say(siblingFailureCopy(outcome)),
    [say],
  );
  useSignInReturn(onFailure);
  return <HandoffStatus message="Signing you in…" />;
}
