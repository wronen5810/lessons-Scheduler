import admin from 'firebase-admin';

const hasCreds =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length && hasCreds) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (e) {
    console.error('[firebase-admin] initializeApp failed:', e);
  }
}

export const messaging = admin.apps.length ? admin.messaging() : null;

export async function sendPushToUser(
  supabase: any,
  userId: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) {
  if (!messaging) {
    console.warn('[firebase-admin] messaging not initialized, skipping push');
    return { sent: 0 };
  }

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
  if (!messaging) {
    console.warn('[firebase-admin] messaging not initialized, skipping push');
    return { sent: 0, noToken: emails };
  }
  if (emails.length === 0) return { sent: 0, noToken: [] };

  console.log('[firebase-admin] looking up tokens for emails:', emails);
  const { data: rows, error: rpcError } = await supabase.rpc('get_push_tokens_by_emails', { emails });
  console.log('[firebase-admin] RPC rows:', JSON.stringify(rows), 'error:', rpcError);

  const tokensByEmail = new Map<string, string[]>();
  for (const row of (rows ?? []) as { student_email: string; push_token: string }[]) {
    const key = row.student_email.toLowerCase();
    if (!tokensByEmail.has(key)) tokensByEmail.set(key, []);
    tokensByEmail.get(key)!.push(row.push_token);
  }

  const noToken = emails.filter((e) => !tokensByEmail.has(e.toLowerCase()));
  const allTokens = [...tokensByEmail.values()].flat();
  console.log('[firebase-admin] allTokens count:', allTokens.length, 'noToken:', noToken);
  if (allTokens.length === 0) return { sent: 0, noToken: emails };

  const response = await messaging.sendEachForMulticast({
    tokens: allTokens,
    notification: { title, body },
    data,
  });

  // Log failures for debugging
  response.responses.forEach((res, idx) => {
    if (!res.success) {
      console.error(`[firebase-admin] FCM failed for token[${idx}]: code=${res.error?.code} message=${res.error?.message}`);
    }
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
