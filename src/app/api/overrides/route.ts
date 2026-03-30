import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// POST /api/overrides — block or unblock a specific date instance
export async function POST(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const body = await request.json();
  const { template_id, specific_date, is_blocked } = body;

  if (!template_id || !specific_date || is_blocked === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // Verify the template belongs to this teacher
  const { data: template } = await supabase
    .from('slot_templates')
    .select('id')
    .eq('id', template_id)
    .eq('teacher_id', auth.user.id)
    .single();

  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('slot_overrides')
    .upsert(
      { template_id, specific_date, is_blocked, teacher_id: auth.user.id },
      { onConflict: 'template_id,specific_date' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
