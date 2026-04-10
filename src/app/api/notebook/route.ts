import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

const TABLE_MAP: Record<string, string> = {
  homework: 'notebook_homework',
  notes: 'notebook_notes',
  resources: 'notebook_resources',
};

async function resolveIdentity(
  request: NextRequest,
): Promise<{ teacherId: string; studentEmail: string } | NextResponse> {
  const url = new URL(request.url);
  const auth = await requireTeacher();

  if (!auth.error) {
    const email = url.searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
    return { teacherId: auth.user.id, studentEmail: email.toLowerCase() };
  }

  const email = url.searchParams.get('email');
  const teacherId = url.searchParams.get('teacherId');
  if (!email || !teacherId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return { teacherId, studentEmail: email.toLowerCase() };
}

export async function GET(request: NextRequest) {
  const identity = await resolveIdentity(request);
  if (identity instanceof NextResponse) return identity;

  const type = new URL(request.url).searchParams.get('type');
  if (!type || !TABLE_MAP[type]) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const query = supabase
    .from(TABLE_MAP[type])
    .select('*')
    .eq('teacher_id', identity.teacherId)
    .ilike('student_email', identity.studentEmail);

  if (type === 'homework') {
    query.order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true });
  } else {
    query.order('created_at', { ascending: true });
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const identity = await resolveIdentity(request);
  if (identity instanceof NextResponse) return identity;

  const body = await request.json();
  const { type, ...fields } = body;
  if (!type || !TABLE_MAP[type]) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from(TABLE_MAP[type])
    .insert({ teacher_id: identity.teacherId, student_email: identity.studentEmail, ...fields })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
