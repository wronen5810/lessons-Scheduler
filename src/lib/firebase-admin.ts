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
  const { data: tokens, error: tokenError } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId);

  console.log('[Push debug] userId:', userId, 'tokens:', tokens?.length ?? 0, 'tokenError:', tokenError);
  if (!tokens || tokens.length === 0) return { sent: 0 };

  const response = await messaging.sendEachForMulticast({
    tokens: tokens.map((t: any) => t.token),
    notification: { title, body },
    data,
  });
  console.log('[Push debug] successCount:', response.successCount, 'failureCount:', response.failureCount, 'responses:', JSON.stringify(response.responses.map(r => ({ success: r.success, error: r.error?.message }))));

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