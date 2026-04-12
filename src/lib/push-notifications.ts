import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export async function registerPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === 'prompt') {
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== 'granted') {
    console.log('Push permission denied');
    return;
  }

  await PushNotifications.removeAllListeners();

  PushNotifications.addListener('registration', async (token) => {
    try {
      await fetch('/api/push/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.value,
          platform: Capacitor.getPlatform(),
        }),
      });
    } catch (err) {
      console.error('Failed to send token to backend', err);
    }
  });

  PushNotifications.addListener('registrationError', (err) => {
    console.error('Push registration error:', err);
  });

  PushNotifications.addListener('pushNotificationReceived', (n) => {
    console.log('Push received in foreground:', n);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (a) => {
    console.log('User tapped notification:', a.notification.data);
    // Optional: navigate based on a.notification.data
  });

  await PushNotifications.register();
}