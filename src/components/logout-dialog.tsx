import { useRouter } from 'expo-router';

import ConfirmDialog from '@/components/confirm-dialog';
import { signOut, useAppStore } from '@/data/app-store';

/** "Log out?" confirmation, shared by Account and Settings. */
export default function LogoutDialog({ visible, onCancel }: { visible: boolean; onCancel: () => void }) {
  const router = useRouter();
  const charging = useAppStore((st) => st.session != null);
  return (
    <ConfirmDialog
      visible={visible}
      icon="log-out-outline"
      title="Log out?"
      message={
        charging
          ? 'Your car is still charging. Logging out stops tracking it on this phone and clears your saved data here.'
          : "You'll need your mobile number and a one-time code to sign in again. Saved data on this phone will be cleared."
      }
      confirmLabel="Log out"
      onCancel={onCancel}
      onConfirm={() => {
        onCancel();
        signOut();
        router.replace('/login');
      }}
    />
  );
}
