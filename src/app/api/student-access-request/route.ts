import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { emailTeacherAccessRequest } from '@/lib/email';
import { DEFAULT_NOTIFICATION_PREFERENCES, sendEmail, sendWhatsApp } from '@/lib/notifications';
import { whatsappTeacherAccessRequest } from '@/lib/whatsapp';

// POST /api/student-access-request
// Called when an unregistered student submits their name from the /join page
export async function POST(request: NextRequest) {
  const { email, name, phone, note, teacherId } = await request.json();

  if (!email || !name || !teacherId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createServiceSupabase();

  // Store in DB so it appears on the teacher dashboard
  await supabase.from('student_access_requests').insert({
    teacher_id: teacherId,
    student_name: name,
    student_email: normalizedEmail,
    student_phone: phone ?? null,
    student_note: note ?? null,
  });

  const [{ data: { user } }, { data: settingsRow }, { data: profileRow }] = await Promise.all([
    supabase.auth.admin.getUserById(teacherId),
    supabase.from('teacher_settings').select('notification_preferences').eq('teacher_id', teacherId).single(),
    supabase.from('profiles').select('phone').eq('id', teacherId).single(),
  ]);
  const teacherEmail = user?.email;
  const teacherPhone = profileRow?.phone ?? null;
  const prefs = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(settingsRow?.notification_preferences ?? {}) };

  if (teacherEmail && sendEmail(prefs, 'access_request')) {
    emailTeacherAccessRequest({
      studentName: name,
      studentEmail: normalizedEmail,
      studentPhone: phone ?? null,
      studentNote: note ?? null,
      teacherEmail,
    }).catch((e) => console.error('Access request email failed:', e));
  }

  console.log('[WhatsApp debug] sendWhatsApp:', sendWhatsApp(prefs, 'access_request'), 'teacherPhone:', teacherPhone, 'templateSid:', process.env.TWILIO_TEMPLATE_ACCESS_REQUEST);
  if (sendWhatsApp(prefs, 'access_request') && teacherPhone) {
    whatsappTeacherAccessRequest({
      teacherPhone,
      studentName: name,
      studentEmail: normalizedEmail,
      studentPhone: phone ?? null,
    }).catch((e) => console.error('Access request WhatsApp failed:', e));
  }

  return NextResponse.json({ ok: true });
}
