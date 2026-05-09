import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

interface BulkStudent {
  name: string;
  email: string;
  phone: string;
}

// POST /api/teacher/students/bulk
export async function POST(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const body = await request.json();
  const students: BulkStudent[] = Array.isArray(body.students) ? body.students : [];

  if (students.length === 0) {
    return NextResponse.json({ error: 'No students provided' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  let created = 0;
  let updated = 0;
  const errors: { index: number; error: string }[] = [];

  for (let i = 0; i < students.length; i++) {
    const name = students[i].name?.trim() ?? '';
    const emailNorm = students[i].email?.trim().toLowerCase() || null;
    const phoneTrim = students[i].phone?.trim() || null;

    if (!name) {
      errors.push({ index: i, error: 'Name is required' });
      continue;
    }
    if (!emailNorm && !phoneTrim) {
      errors.push({ index: i, error: 'Email or phone is required' });
      continue;
    }

    try {
      if (emailNorm) {
        const { data: existing } = await supabase
          .from('students')
          .select('id')
          .eq('teacher_id', auth.user.id)
          .eq('email', emailNorm)
          .maybeSingle();

        if (existing) {
          const { error: updateErr } = await supabase
            .from('students')
            .update({ name, phone: phoneTrim })
            .eq('id', existing.id);
          if (updateErr) throw new Error(updateErr.message);
          updated++;
        } else {
          const { error: insertErr } = await supabase
            .from('students')
            .insert({ name, email: emailNorm, phone: phoneTrim, teacher_id: auth.user.id });
          if (insertErr) throw new Error(insertErr.message);
          created++;
        }
      } else {
        const { error: insertErr } = await supabase
          .from('students')
          .insert({ name, phone: phoneTrim, teacher_id: auth.user.id });
        if (insertErr) throw new Error(insertErr.message);
        created++;
      }
    } catch (err) {
      errors.push({ index: i, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  return NextResponse.json({ created, updated, errors });
}
