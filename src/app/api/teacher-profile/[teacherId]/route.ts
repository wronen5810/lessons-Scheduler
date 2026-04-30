import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/teacher-profile/[teacherId] — public, returns visible profile fields.
// Uses progressive fallback so the page works even before migrations are applied.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const { teacherId } = await params;
  const supabase = createServiceSupabase();

  // Try 1: all columns (post-migration)
  let { data, error } = await supabase
    .from('profiles')
    .select('display_name, photo_url, description, bio, tutoring_area, quote, page_color')
    .eq('id', teacherId)
    .single();

  // Try 2: original profile columns only (first migration applied)
  if (error) {
    ({ data, error } = await supabase
      .from('profiles')
      .select('display_name, photo_url, description, bio')
      .eq('id', teacherId)
      .single());
  }

  // Try 3: absolute minimum (no migrations)
  if (error) {
    ({ data, error } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', teacherId)
      .single());
  }

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const d = data as Record<string, unknown>;

  return NextResponse.json({
    display_name: (d.display_name as string) ?? '',
    photo_url: (d.photo_url as string) ?? null,
    description: (d.description as string) ?? null,
    bio: (d.bio as string) ?? null,
    tutoring_area: (d.tutoring_area as string) ?? null,
    quote: (d.quote as string) ?? null,
    page_color: (d.page_color as string) ?? '#4A9E8A',
  }, {
    headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' },
  });
}
