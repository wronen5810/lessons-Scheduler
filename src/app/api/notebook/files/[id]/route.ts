import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

const BUCKET = 'notebook-files';

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

// DELETE /api/notebook/files/[id]?email=...&teacherId=...
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const identity = await resolveIdentity(request);
  if (identity instanceof NextResponse) return identity;

  const { id } = await params;
  const supabase = createServiceSupabase();

  const { data: record } = await supabase
    .from('notebook_files')
    .select('storage_path')
    .eq('id', id)
    .eq('teacher_id', identity.teacherId)
    .single();

  if (!record) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  await supabase.storage.from(BUCKET).remove([record.storage_path]);

  const { error } = await supabase
    .from('notebook_files')
    .delete()
    .eq('id', id)
    .eq('teacher_id', identity.teacherId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
