import { useRouter } from 'expo-router';

import ConfirmDialog from '@/components/confirm-dialog';
import { useAppStore } from '@/data/app-store';

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
          ? "Your car is still charging. The charge keeps going, and you'll see it again when you sign back in with your mobile number."
          : "You'll need your mobile number and a one-time code to sign in again."
      }
      confirmLabel="Log out"
      onCancel={onCancel}
      onConfirm={() => {
        onCancel();
        router.replace('/login');
      }}
    />
  );
}
