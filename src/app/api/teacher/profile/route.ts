import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase, createAuthSupabase } from '@/lib/supabase-server';

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export async function GET() {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const authClient = await createAuthSupabase();

  const { data: { user } } = await authClient.auth.getUser();
  const email = user?.email ?? '';

  const { data } = await supabase
    .from('profiles')
    .select('display_name, phone, photo_url, description, bio, show_photo, show_description, show_bio, tutoring_area, quote, page_color')
    .eq('id', auth.user.id)
    .single();

  return NextResponse.json({
    display_name: data?.display_name ?? '',
    email,
    phone: data?.phone ?? '',
    photo_url: data?.photo_url ?? '',
    description: data?.description ?? '',
    bio: data?.bio ?? '',
    show_photo: data?.show_photo ?? false,
    show_description: data?.show_description ?? false,
    show_bio: data?.show_bio ?? false,
    tutoring_area: data?.tutoring_area ?? '',
    quote: data?.quote ?? '',
    page_color: data?.page_color ?? '#4A9E8A',
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const body = await request.json();
  const update: Record<string, unknown> = {};

  if (body.display_name !== undefined) {
    const name = String(body.display_name).trim();
    if (!name) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    update.display_name = name;
  }

  if (body.phone !== undefined) update.phone = body.phone ? String(body.phone).trim() : null;
  if (body.description !== undefined) update.description = body.description ? String(body.description).trim() : null;
  if (body.bio !== undefined) update.bio = body.bio ? String(body.bio).trim() : null;
  if (body.show_photo !== undefined) update.show_photo = Boolean(body.show_photo);
  if (body.show_description !== undefined) update.show_description = Boolean(body.show_description);
  if (body.show_bio !== undefined) update.show_bio = Boolean(body.show_bio);
  if (body.tutoring_area !== undefined) update.tutoring_area = body.tutoring_area ? String(body.tutoring_area).trim() : null;
  if (body.quote !== undefined) update.quote = body.quote ? String(body.quote).trim() : null;
  if (body.page_color !== undefined) {
    const color = String(body.page_color).trim();
    if (!HEX_RE.test(color)) return NextResponse.json({ error: 'Invalid color' }, { status: 400 });
    update.page_color = color;
  }

  const supabase = createServiceSupabase();
  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
