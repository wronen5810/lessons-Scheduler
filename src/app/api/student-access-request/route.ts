import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { emailTeacherAccessRequest, emailTeacherStudentAutoApproved } from '@/lib/email';
import { mergePrefs, sendEmail, sendWhatsApp, sendPush } from '@/lib/notifications';
import { sendPushToUser } from '@/lib/firebase-admin';
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

  const [{ data: { user } }, { data: settingsRow }, { data: profileRow }] = await Promise.all([
    supabase.auth.admin.getUserById(teacherId),
    supabase.from('teacher_settings').select('notification_preferences, features').eq('teacher_id', teacherId).single(),
    supabase.from('profiles').select('phone').eq('id', teacherId).single(),
  ]);
  const teacherEmail = user?.email;
  const teacherPhone = profileRow?.phone ?? null;
  const prefs = mergePrefs(settingsRow?.notification_preferences);
  const features = (settingsRow?.features ?? {}) as { auto_approve_students?: boolean };
  const autoApprove = features.auto_approve_students ?? true;

  if (autoApprove) {
    // Add student directly to the students table
    await supabase.from('students').insert({
      teacher_id: teacherId,
      name,
      email: normalizedEmail,
      phone: phone ?? null,
      notes: note ?? null,
      is_active: true,
      is_waitlisted: false,
    });

    // Notify teacher that a new student joined automatically
    await Promise.all([
      teacherEmail && sendEmail(prefs, 'access_request')
        ? emailTeacherStudentAutoApproved({
            studentName: name,
            studentEmail: normalizedEmail,
            studentPhone: phone ?? null,
            studentNote: note ?? null,
            teacherEmail,
          }).catch((e) => console.error('Auto-approve email failed:', e))
        : null,
      sendPush(prefs, 'access_request')
        ? sendPushToUser(supabase, teacherId, 'New Student Joined', `${name} has been automatically added to your students.`).catch((e) => console.error('Auto-approve push failed:', e))
        : null,
    ]);

    return NextResponse.json({ ok: true, auto_approved: true });
  }

  // Manual approval flow: store request so it appears on the teacher dashboard
  await supabase.from('student_access_requests').insert({
    teacher_id: teacherId,
    student_name: name,
    student_email: normalizedEmail,
    student_phone: phone ?? null,
    student_note: note ?? null,
  });

  await Promise.all([
    teacherEmail && sendEmail(prefs, 'access_request') ? emailTeacherAccessRequest({
      studentName: name,
      studentEmail: normalizedEmail,
      studentPhone: phone ?? null,
      studentNote: note ?? null,
      teacherEmail,
    }).catch((e) => console.error('Access request email failed:', e)) : null,
    sendWhatsApp(prefs, 'access_request') && teacherPhone ? whatsappTeacherAccessRequest({
      teacherPhone,
      studentName: name,
      studentEmail: normalizedEmail,
      studentPhone: phone ?? null,
    }).catch((e) => console.error('Access request WhatsApp failed:', e)) : null,
    sendPush(prefs, 'access_request') ? sendPushToUser(supabase, teacherId, 'New Student Request', `${name} is requesting access to your lessons.`).catch((e) => console.error('Access request push failed:', e)) : null,
  ]);

  return NextResponse.json({ ok: true });
}
