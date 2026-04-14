import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const messaging = admin.messaging();

export async function sendPushToUser(
  supabase: any,
  userId: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) {
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId);

  if (!tokens || tokens.length === 0) return { sent: 0 };

  const response = await messaging.sendEachForMulticast({
    tokens: tokens.map((t: any) => t.token),
    notification: { title, body },
    data,
  });

  // Clean up dead tokens
  const dead: string[] = [];
  response.responses.forEach((res, idx) => {
    if (!res.success && res.error?.code === 'messaging/registration-token-not-registered') {
      dead.push(tokens[idx].token);
    }
  });
  if (dead.length > 0) {
    await supabase.from('push_tokens').delete().in('token', dead);
  }

  return { sent: response.successCount };
}

// Sends push notifications to a list of students looked up by email.
// Uses the get_push_tokens_by_emails RPC (see supabase/add_message_functions.sql).
export async function sendPushToEmails(
  supabase: any,
  emails: string[],
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<{ sent: number; noToken: string[] }> {
  if (emails.length === 0) return { sent: 0, noToken: [] };

  const { data: rows } = await supabase.rpc('get_push_tokens_by_emails', { emails });

  const tokensByEmail = new Map<string, string[]>();
  for (const row of (rows ?? []) as { student_email: string; push_token: string }[]) {
    const key = row.student_email.toLowerCase();
    if (!tokensByEmail.has(key)) tokensByEmail.set(key, []);
    tokensByEmail.get(key)!.push(row.push_token);
  }

  const noToken = emails.filter((e) => !tokensByEmail.has(e.toLowerCase()));
  const allTokens = [...tokensByEmail.values()].flat();
  if (allTokens.length === 0) return { sent: 0, noToken: emails };

  const response = await messaging.sendEachForMulticast({
    tokens: allTokens,
    notification: { title, body },
    data,
  });

  // Clean up dead tokens
  const dead: string[] = [];
  response.responses.forEach((res, idx) => {
    if (!res.success && res.error?.code === 'messaging/registration-token-not-registered') {
      dead.push(allTokens[idx]);
    }
  });
  if (dead.length > 0) {
    await supabase.from('push_tokens').delete().in('token', dead);
  }

  return { sent: response.successCount, noToken };
}