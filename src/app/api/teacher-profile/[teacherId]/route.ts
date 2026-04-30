import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/teacher-profile/[teacherId] — public, returns visible profile fields
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const { teacherId } = await params;
  const supabase = createServiceSupabase();

  const { data } = await supabase
    .from('profiles')
    .select('display_name, photo_url, description, bio, show_photo, show_description, show_bio, tutoring_area, quote, page_color')
    .eq('id', teacherId)
    .single();

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    display_name: data.display_name ?? '',
    photo_url: data.show_photo ? (data.photo_url ?? null) : null,
    description: data.show_description ? (data.description ?? null) : null,
    bio: data.show_bio ? (data.bio ?? null) : null,
    tutoring_area: data.tutoring_area ?? null,
    quote: data.quote ?? null,
    page_color: data.page_color ?? '#4A9E8A',
  }, {
    headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
  });
}
