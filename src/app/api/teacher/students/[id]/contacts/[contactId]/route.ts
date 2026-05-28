// PATCH  /api/teacher/students/[id]/contacts/[contactId] — update a contact
// DELETE /api/teacher/students/[id]/contacts/[contactId] — delete a contact

import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

type Params = { params: Promise<{ id: string; contactId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id: studentId, contactId } = await params;
  const body = await request.json();
  const { name, relationship, email, phone, is_primary } = body as {
    name?: string;
    relationship?: string;
    email?: string;
    phone?: string;
    is_primary?: boolean;
  };

  const supabase = createServiceSupabase();

  // If marking as primary, clear any existing primary for this student first
  if (is_primary === true) {
    await supabase
      .from('student_contacts')
      .update({ is_primary: false })
      .eq('student_id', studentId)
      .eq('teacher_id', auth.user.id)
      .eq('is_primary', true)
      .neq('id', contactId);
  }

  const patch: Record<string, unknown> = {};
  if (name !== undefined)         patch.name = name.trim();
  if (relationship !== undefined) patch.relationship = relationship.trim() || null;
  if (email !== undefined)        patch.email = email.trim().toLowerCase() || null;
  if (phone !== undefined)        patch.phone = phone.trim() || null;
  if (is_primary !== undefined)   patch.is_primary = is_primary;

  const { data, error } = await supabase
    .from('student_contacts')
    .update(patch)
    .eq('id', contactId)
    .eq('student_id', studentId)
    .eq('teacher_id', auth.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id: studentId, contactId } = await params;
  const supabase = createServiceSupabase();

  const { error } = await supabase
    .from('student_contacts')
    .delete()
    .eq('id', contactId)
    .eq('student_id', studentId)
    .eq('teacher_id', auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
