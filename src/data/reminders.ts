/**
 * Phone notifications for reservations (local, scheduled on the device — no server).
 * Web has no local notifications, so everything here quietly does nothing there,
 * and a denied permission never breaks booking.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL = 'reservations';
const supported = Platform.OS !== 'web';

if (supported) {
  // show reminders even while the app is open
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

let ready: Promise<boolean> | null = null;
/** Asks once for notification permission (and sets up the Android channel). */
function ensureReady(): Promise<boolean> {
  if (!supported) return Promise.resolve(false);
  ready ??= (async () => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Reservations', importance: Notifications.AndroidImportance.HIGH });
      }
      const current = await Notifications.getPermissionsAsync();
      if (current.granted) return true;
      const asked = await Notifications.requestPermissionsAsync();
      return asked.granted;
    } catch {
      return false;
    }
  })();
  return ready;
}

/** Shows a notification now, or at `at` (ms) if that's still ahead. Returns its id, or null. */
export async function remind(title: string, body: string, at?: number): Promise<string | null> {
  if (!(await ensureReady())) return null;
  try {
    const later = at != null && at > Date.now() + 1000;
    return await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: later ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL } : { channelId: CHANNEL },
    });
  } catch {
    return null;
  }
}

/** Cancels reminders that haven't fired yet (e.g. after a reservation is cancelled or used). */
export async function cancelReminders(ids: string[] | undefined) {
  if (!supported || !ids?.length) return;
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}
