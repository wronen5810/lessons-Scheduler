export interface NotificationChannels {
  email: boolean;
  whatsapp: boolean;
  push: boolean;
}

export type NotificationKey =
  | 'lesson_request'   // student → teacher
  | 'lesson_approved'  // teacher → student
  | 'lesson_rejected'  // teacher → student
  | 'lesson_cancelled' // teacher → student
  | 'lesson_reminder'  // system  → student
  | 'access_request';  // student → teacher

export const NOTIFICATION_KEYS: NotificationKey[] = [
  'lesson_request', 'lesson_approved', 'lesson_rejected',
  'lesson_cancelled', 'lesson_reminder', 'access_request',
];

export interface NotificationPreferences {
  lesson_request: NotificationChannels;
  lesson_approved: NotificationChannels;
  lesson_rejected: NotificationChannels;
  lesson_cancelled: NotificationChannels;
  lesson_reminder: NotificationChannels;
  access_request: NotificationChannels;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  lesson_request:   { email: true, whatsapp: false, push: false },
  lesson_approved:  { email: true, whatsapp: false, push: false },
  lesson_rejected:  { email: true, whatsapp: false, push: false },
  lesson_cancelled: { email: true, whatsapp: false, push: false },
  lesson_reminder:  { email: true, whatsapp: false, push: false },
  access_request:   { email: true, whatsapp: false, push: false },
};

// Merges DB data into full prefs, handling the old string format (email/whatsapp/both/off)
export function mergePrefs(raw: unknown): NotificationPreferences {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  const result = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  for (const key of NOTIFICATION_KEYS) {
    const val = (raw as Record<string, unknown>)[key];
    if (!val) continue;
    if (typeof val === 'string') {
      // Migrate old string format
      result[key] = {
        email:    val === 'email'    || val === 'both',
        whatsapp: val === 'whatsapp' || val === 'both',
        push: false,
      };
    } else if (typeof val === 'object') {
      result[key] = { ...DEFAULT_NOTIFICATION_PREFERENCES[key], ...(val as Partial<NotificationChannels>) };
    }
  }
  return result;
}

export function sendEmail(prefs: NotificationPreferences, key: NotificationKey): boolean {
  return prefs[key]?.email ?? true;
}

export function sendWhatsApp(prefs: NotificationPreferences, key: NotificationKey): boolean {
  return prefs[key]?.whatsapp ?? false;
}

export function sendPush(prefs: NotificationPreferences, key: NotificationKey): boolean {
  return prefs[key]?.push ?? false;
}
