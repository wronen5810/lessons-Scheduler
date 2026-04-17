import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// GET /api/teacher-slug/[slug] — look up a teacher by their name slug
// e.g. "aditayer" matches display_name "Adi Tayer"
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalized = slug.toLowerCase().replace(/[^a-z0-9]/g, '');

  const supabase = createServiceSupabase();
  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('role', 'teacher')
    .eq('is_active', true);

  if (!teachers) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const match = teachers.find((t) => nameToSlug(t.display_name ?? '') === normalized);
  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ teacherId: match.id });
}
