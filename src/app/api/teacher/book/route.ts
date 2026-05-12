import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { emailStudentDirectBooking } from '@/lib/email';
import { whatsappStudentApproved } from '@/lib/whatsapp';
import { getEndTime } from '@/lib/dates';
import { mergePrefs, sendEmail, sendWhatsApp, sendPush } from '@/lib/notifications';
import { sendPushToEmails } from '@/lib/firebase-admin';
import { randomUUID } from 'crypto';

// POST /api/teacher/book — teacher books a slot directly for a student or group (skips pending)
export async function POST(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const body = await request.json();
  const { booking_type, template_id, one_time_slot_id, date, end_date, start_time, group_id } = body;
  let { student_name } = body;
  let student_email: string = body.student_email?.toLowerCase().trim() ?? '';

  if (!booking_type || (!template_id && !one_time_slot_id) || !date || !start_time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!group_id && !student_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const teacherId = auth.user!.id;
  const endTime = getEndTime(start_time);

  // If booking for a group, resolve group info
  if (group_id) {
    const { data: group } = await supabase
      .from('student_groups')
      .select('id, name')
      .eq('id', group_id)
      .eq('teacher_id', teacherId)
      .single();
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    student_name = group.name;
    student_email = `grp:${group.id}`;
  }

  let template: { day_of_week: number } | null = null;
  if (template_id) {
    const { data } = await supabase
      .from('slot_templates')
      .select('day_of_week')
      .eq('id', template_id)
      .eq('teacher_id', teacherId)
      .single();
    template = data;
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  if (booking_type === 'recurring' && !template_id) {
    return NextResponse.json({ error: 'Recurring bookings require a template slot' }, { status: 400 });
  }

  // Notify student via all channels enabled for lesson_approved
  async function notifyStudent(cancelToken: string) {
    if (group_id || !student_email) return;
    const [{ data: settingsRow }, { data: studentRow }] = await Promise.all([
      supabase.from('teacher_settings').select('notification_preferences').eq('teacher_id', teacherId).single(),
      supabase.from('students').select('phone').ilike('email', student_email).eq('teacher_id', teacherId).single(),
    ]);
    const prefs = mergePrefs(settingsRow?.notification_preferences);
    const info = {
      studentName: student_name,
      studentEmail: student_email,
      bookingType: booking_type as 'recurring' | 'one_time',
      date,
      dayOfWeek: template?.day_of_week,
      startTime: start_time,
      endTime,
      cancelToken,
    };
    await Promise.all([
      sendEmail(prefs, 'lesson_approved')
        ? emailStudentDirectBooking(info).catch((e) => console.error('Email failed:', e))
        : null,
      sendWhatsApp(prefs, 'lesson_approved') && studentRow?.phone
        ? whatsappStudentApproved({ ...info, phone: studentRow.phone }).catch((e) => console.error('WhatsApp failed:', e))
        : null,
      sendPush(prefs, 'lesson_approved')
        ? sendPushToEmails(supabase, [student_email], 'Lesson Confirmed', `Your lesson on ${start_time} has been confirmed.`).catch((e) => console.error('Push failed:', e))
        : null,
    ]);
  }

  if (booking_type === 'recurring') {
    // Create one row per weekly occurrence between date and end_date
    const seriesId = randomUUID();
    const rows = [];
    const stopDate = end_date ?? date; // if no end_date, just one lesson
    let cur = new Date(date);
    const stop = new Date(stopDate);
    while (cur <= stop) {
      rows.push({
        template_id,
        student_name,
        student_email,
        lesson_date: cur.toISOString().slice(0, 10),
        started_date: date,
        series_id: seriesId,
        status: 'approved',
        booked_by: 'teacher',
        teacher_id: teacherId,
        group_id: group_id ?? null,
      });
      cur.setDate(cur.getDate() + 7);
    }

    const { error } = await supabase.from('recurring_bookings').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    notifyStudent(seriesId).catch((e) => console.error('Notify failed:', e));

    return NextResponse.json({ series_id: seriesId, count: rows.length }, { status: 201 });
  }

  // one_time
  const { data: booking, error } = await supabase
    .from('one_time_bookings')
    .insert({
      template_id: template_id || null,
      one_time_slot_id: one_time_slot_id || null,
      specific_date: date,
      start_time,
      student_name,
      student_email,
      status: 'approved',
      booked_by: 'teacher',
      teacher_id: teacherId,
      group_id: group_id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  notifyStudent(booking.cancel_token as string).catch((e) => console.error('Notify failed:', e));

  return NextResponse.json(booking, { status: 201 });
}
