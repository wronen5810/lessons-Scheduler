import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { emailTeacherNewRequest } from '@/lib/email';
import { formatDate, getEndTime, todayInIsrael } from '@/lib/dates';
import { randomUUID } from 'crypto';
import { mergePrefs, sendEmail, sendWhatsApp, sendPush } from '@/lib/notifications';
import { whatsappTeacherNewRequest } from '@/lib/whatsapp';
import { sendPushToUser } from '@/lib/firebase-admin';

// POST /api/bookings — student submits a lesson request
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { booking_type, template_id, one_time_slot_id, date, end_date, start_time, student_email: rawEmail, teacher_id } = body;
  const student_email = rawEmail?.toLowerCase().trim();

  if (!booking_type || (!template_id && !one_time_slot_id) || !date || !start_time || !student_email || !teacher_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const endTime = getEndTime(start_time);

  // Verify student is on this teacher's active list
  const { data: student } = await supabase
    .from('students')
    .select('id, name, is_active')
    .ilike('email', student_email)
    .eq('teacher_id', teacher_id)
    .single();

  if (!student) {
    return NextResponse.json({ error: 'Your email is not registered. Please contact the teacher.' }, { status: 403 });
  }
  if (!student.is_active) {
    return NextResponse.json({ error: 'Your account is currently inactive. Please contact the teacher.' }, { status: 403 });
  }

  const student_name = student.name;

  const [{ data: { user: teacherUser } }, { data: settingsRow }, { data: profileRow }] = await Promise.all([
    supabase.auth.admin.getUserById(teacher_id),
    supabase.from('teacher_settings').select('notification_preferences').eq('teacher_id', teacher_id).single(),
    supabase.from('profiles').select('phone').eq('id', teacher_id).single(),
  ]);
  const teacherEmail = teacherUser?.email;
  const teacherPhone = profileRow?.phone ?? null;
  const prefs = mergePrefs(settingsRow?.notification_preferences);

  const { data: template } = await supabase
    .from('slot_templates')
    .select('*')
    .eq('id', template_id)
    .eq('teacher_id', teacher_id)
    .single();

  if (template_id && !template) {
    return NextResponse.json({ error: 'Invalid slot' }, { status: 400 });
  }

  if (booking_type === 'recurring') {
    // Check no existing approved/pending lessons overlap on this template in the date range
    const stopDate = end_date ?? date;
    const { data: existing } = await supabase
      .from('recurring_bookings')
      .select('lesson_date')
      .eq('template_id', template_id)
      .eq('teacher_id', teacher_id)
      .in('status', ['pending', 'approved'])
      .gte('lesson_date', date)
      .lte('lesson_date', stopDate);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'One or more dates in that range are no longer available' }, { status: 409 });
    }

    const seriesId = randomUUID();
    const rows = [];
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
        booked_by: 'student',
        teacher_id,
      });
      cur.setDate(cur.getDate() + 7);
    }

    const { error } = await supabase.from('recurring_bookings').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const reqInfo = { studentName: student_name, studentEmail: student_email, bookingType: 'recurring' as const, date, dayOfWeek: template.day_of_week, startTime: start_time, endTime };
    const pushTitle = 'New Lesson Request';
    const pushBody = `${student_name} requested a lesson on ${reqInfo.startTime}`;
    await Promise.all([
      sendEmail(prefs, 'lesson_request') ? emailTeacherNewRequest({ ...reqInfo, teacherEmail }).catch((e) => console.error('Email failed:', e)) : null,
      sendWhatsApp(prefs, 'lesson_request') && teacherPhone ? whatsappTeacherNewRequest({ ...reqInfo, teacherPhone }).catch((e) => console.error('WhatsApp failed:', e)) : null,
      sendPush(prefs, 'lesson_request') ? sendPushToUser(supabase, teacher_id, pushTitle, pushBody).catch((e) => console.error('Push failed:', e)) : null,
    ]);

    return NextResponse.json({ series_id: seriesId, count: rows.length }, { status: 201 });
  }

  // one_time booking
  const today = todayInIsrael();
  const maxDate = formatDate(new Date(new Date(today).getTime() + 28 * 24 * 60 * 60 * 1000));

  if (date < today || date > maxDate) {
    return NextResponse.json({ error: 'Date out of allowed range' }, { status: 400 });
  }

  const { data: existingOt } = await supabase
    .from('one_time_bookings')
    .select('id')
    .eq('specific_date', date)
    .eq('start_time', start_time)
    .eq('teacher_id', teacher_id)
    .in('status', ['pending', 'approved'])
    .limit(1);

  if (existingOt && existingOt.length > 0) {
    return NextResponse.json({ error: 'Slot is no longer available' }, { status: 409 });
  }

  const { data: booking, error } = await supabase
    .from('one_time_bookings')
    .insert({
      template_id: template_id || null,
      one_time_slot_id: one_time_slot_id || null,
      specific_date: date,
      start_time,
      student_name,
      student_email,
      booked_by: 'student',
      teacher_id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const otReqInfo = { studentName: student_name, studentEmail: student_email, bookingType: 'one_time' as const, date, startTime: start_time, endTime };
  const pushTitle = 'New Lesson Request';
  const pushBody = `${student_name} requested a lesson on ${start_time}`;
  await Promise.all([
    sendEmail(prefs, 'lesson_request') ? emailTeacherNewRequest({ ...otReqInfo, teacherEmail }).catch((e) => console.error('Email failed:', e)) : null,
    sendWhatsApp(prefs, 'lesson_request') && teacherPhone ? whatsappTeacherNewRequest({ ...otReqInfo, teacherPhone }).catch((e) => console.error('WhatsApp failed:', e)) : null,
    sendPush(prefs, 'lesson_request') ? sendPushToUser(supabase, teacher_id, pushTitle, pushBody).catch((e) => console.error('Push failed:', e)) : null,
  ]);

  return NextResponse.json(booking, { status: 201 });
}
