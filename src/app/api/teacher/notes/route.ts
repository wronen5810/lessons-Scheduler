import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/teacher/notes?booking_type=...&booking_id=...
export async function GET(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const booking_type = searchParams.get('booking_type');
  const booking_id = searchParams.get('booking_id');

  if (!booking_type || !booking_id) {
    return NextResponse.json({ error: 'booking_type and booking_id required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('booking_notes')
    .select('*')
    .eq('teacher_id', auth.user.id)
    .eq('booking_type', booking_type)
    .eq('booking_id', booking_id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/teacher/notes
export async function POST(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { booking_type, booking_id, note, visible_to_student } = await request.json();
  if (!booking_type || !booking_id || !note?.trim()) {
    return NextResponse.json({ error: 'booking_type, booking_id and note required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('booking_notes')
    .insert({
      teacher_id: auth.user.id,
      booking_type,
      booking_id,
      note: note.trim(),
      visible_to_student: visible_to_student ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
