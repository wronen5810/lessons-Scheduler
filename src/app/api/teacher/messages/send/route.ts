import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { emailDirectMessage } from '@/lib/email';
import { sendPushToEmails } from '@/lib/firebase-admin';

function toWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const e164 = digits.startsWith('0') ? `972${digits.slice(1)}` : digits.replace(/^\+/, '');
  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export async function POST(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const body = await request.json();
  const {
    studentIds = [] as string[],
    groupIds = [] as string[],
    message,
    channels = { email: false, whatsapp: false, notification: false },
  } = body as {
    studentIds: string[];
    groupIds: string[];
    message: string;
    channels: { email: boolean; whatsapp: boolean; notification: boolean };
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }
  if (!channels.email && !channels.whatsapp && !channels.notification) {
    return NextResponse.json({ error: 'Select at least one channel' }, { status: 400 });
  }
  if (studentIds.length === 0 && groupIds.length === 0) {
    return NextResponse.json({ error: 'Select at least one recipient' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const recipientMap = new Map<string, Recipient>();

  // Individual students
  if (studentIds.length > 0) {
    const { data: students } = await supabase
      .from('students')
      .select('id, name, email, phone')
      .eq('teacher_id', auth.user.id)
      .in('id', studentIds);
    for (const s of students ?? []) {
      recipientMap.set(s.email.toLowerCase(), s);
    }
  }

  // Group members — verify groups belong to teacher, then resolve members
  if (groupIds.length > 0) {
    const { data: validGroups } = await supabase
      .from('student_groups')
      .select('id')
      .eq('teacher_id', auth.user.id)
      .in('id', groupIds);

    const validGroupIds = (validGroups ?? []).map((g) => g.id);
    if (validGroupIds.length > 0) {
      const { data: members } = await supabase
        .from('student_group_members')
        .select('student_id')
        .in('group_id', validGroupIds);

      const memberIds = (members ?? []).map((m) => m.student_id);
      if (memberIds.length > 0) {
        const { data: students } = await supabase
          .from('students')
          .select('id, name, email, phone')
          .eq('teacher_id', auth.user.id)
          .in('id', memberIds);
        for (const s of students ?? []) {
          recipientMap.set(s.email.toLowerCase(), s);
        }
      }
    }
  }

  const recipients = [...recipientMap.values()];
  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No valid recipients found' }, { status: 400 });
  }

  // Get teacher email for reply-to
  const { data: { user: teacherUser } } = await supabase.auth.admin.getUserById(auth.user.id);
  const teacherEmail = teacherUser?.email ?? '';

  const result: {
    email?: { sent: number; failed: Array<{ name: string; email: string }> };
    whatsapp?: { links: Array<{ name: string; phone: string; url: string }>; noPhone: Array<{ name: string; email: string }> };
    notification?: { sent: number; noToken: Array<{ name: string; email: string }> };
  } = {};

  // ── EMAIL ──────────────────────────────────────────────────────────
  if (channels.email) {
    const sent: Array<{ name: string; email: string }> = [];
    const failed: Array<{ name: string; email: string }> = [];

    await Promise.all(
      recipients.map(async (r) => {
        try {
          await emailDirectMessage({
            to: r.email,
            studentName: r.name,
            message: message.trim(),
            teacherEmail,
          });
          sent.push({ name: r.name, email: r.email });
        } catch {
          failed.push({ name: r.name, email: r.email });
        }
      })
    );
    result.email = { sent: sent.length, failed };
  }

  // ── WHATSAPP ───────────────────────────────────────────────────────
  if (channels.whatsapp) {
    const links: Array<{ name: string; phone: string; url: string }> = [];
    const noPhone: Array<{ name: string; email: string }> = [];

    for (const r of recipients) {
      if (r.phone) {
        links.push({
          name: r.name,
          phone: r.phone,
          url: toWhatsAppUrl(r.phone, message.trim()),
        });
      } else {
        noPhone.push({ name: r.name, email: r.email });
      }
    }
    result.whatsapp = { links, noPhone };
  }

  // ── PUSH NOTIFICATION ──────────────────────────────────────────────
  if (channels.notification) {
    const emails = recipients.map((r) => r.email.toLowerCase());
    const { sent, noToken: noTokenEmails } = await sendPushToEmails(
      supabase,
      emails,
      'Message from your teacher',
      message.trim()
    );
    const noToken = recipients
      .filter((r) => noTokenEmails.includes(r.email.toLowerCase()))
      .map((r) => ({ name: r.name, email: r.email }));
    result.notification = { sent, noToken };
  }

  return NextResponse.json({ recipients: recipients.length, result });
}
