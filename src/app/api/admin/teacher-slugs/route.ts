import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// GET /api/admin/teacher-slugs — debug: shows all teachers and what slug they'd match
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const { data: teachers, error } = await supabase
    .from('profiles')
    .select('id, display_name, is_active')
    .eq('role', 'teacher');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await Promise.all(
    (teachers ?? []).map(async (t) => {
      const { data: { user } } = await supabase.auth.admin.getUserById(t.id);
      const email = user?.email ?? '';
      const emailUsername = email.split('@')[0];
      return {
        id: t.id,
        display_name: t.display_name,
        is_active: t.is_active,
        display_name_slug: nameToSlug(t.display_name ?? ''),
        email,
        email_slug: nameToSlug(emailUsername),
      };
    })
  );

  return NextResponse.json(enriched);
}
