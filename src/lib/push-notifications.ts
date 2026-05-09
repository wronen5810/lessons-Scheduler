import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

async function requestAndRegister(
  onRegistration: (fcmToken: string) => Promise<void>
) {
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
      await onRegistration(token.value);
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
  });

  await PushNotifications.register();
}

// For teachers (Supabase auth session)
export async function registerPushNotifications() {
  await requestAndRegister(async (fcmToken) => {
    await fetch('/api/push/register-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: fcmToken, platform: Capacitor.getPlatform() }),
    });
  });
}

// For students (custom JWT auth)
export async function registerStudentPushNotifications(
  studentToken: string
) {
  await requestAndRegister(async (fcmToken) => {
    await fetch('/api/push/register-student-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ token: fcmToken, platform: Capacitor.getPlatform() }),
    });
  });
}