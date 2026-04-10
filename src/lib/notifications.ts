export type NotificationChannel = 'email' | 'whatsapp' | 'both' | 'off';

export type NotificationKey =
  | 'lesson_request'   // student → teacher
  | 'lesson_approved'  // teacher → student
  | 'lesson_rejected'  // teacher → student
  | 'lesson_cancelled' // teacher → student
  | 'lesson_reminder'  // system  → student
  | 'access_request';  // student → teacher

export interface NotificationPreferences {
  lesson_request: NotificationChannel;
  lesson_approved: NotificationChannel;
  lesson_rejected: NotificationChannel;
  lesson_cancelled: NotificationChannel;
  lesson_reminder: NotificationChannel;
  access_request: NotificationChannel;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  lesson_request: 'email',
  lesson_approved: 'email',
  lesson_rejected: 'email',
  lesson_cancelled: 'email',
  lesson_reminder: 'email',
  access_request: 'email',
};

export function sendEmail(prefs: NotificationPreferences, key: NotificationKey): boolean {
  const ch = prefs[key] ?? 'email';
  return ch === 'email' || ch === 'both';
}

export function sendWhatsApp(prefs: NotificationPreferences, key: NotificationKey): boolean {
  const ch = prefs[key] ?? 'email';
  return ch === 'whatsapp' || ch === 'both';
}
