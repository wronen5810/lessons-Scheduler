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

  // Try 1: all columns (post-migration)
  let { data, error } = await supabase
    .from('profiles')
    .select('display_name, phone, photo_url, description, bio, show_photo, show_description, show_bio, tutoring_area, quote, page_color')
    .eq('id', auth.user.id)
    .single();

  // Try 2: original profile columns (first migration only)
  if (error) {
    ({ data, error } = await supabase
      .from('profiles')
      .select('display_name, phone, photo_url, description, bio, show_photo, show_description, show_bio')
      .eq('id', auth.user.id)
      .single());
  }

  // Try 3: absolute minimum
  if (error) {
    ({ data, error } = await supabase
      .from('profiles')
      .select('display_name, phone')
      .eq('id', auth.user.id)
      .single());
  }

  const d = (data ?? {}) as Record<string, unknown>;

  return NextResponse.json({
    display_name: (d.display_name as string) ?? '',
    email,
    phone: (d.phone as string) ?? '',
    photo_url: (d.photo_url as string) ?? '',
    description: (d.description as string) ?? '',
    bio: (d.bio as string) ?? '',
    show_photo: (d.show_photo as boolean) ?? false,
    show_description: (d.show_description as boolean) ?? false,
    show_bio: (d.show_bio as boolean) ?? false,
    tutoring_area: (d.tutoring_area as string) ?? '',
    quote: (d.quote as string) ?? '',
    page_color: (d.page_color as string) ?? '#4A9E8A',
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const body = await request.json();
  const supabase = createServiceSupabase();

  // ── Base fields (always present in profiles table) ─────────────────────
  const baseUpdate: Record<string, unknown> = {};

  if (body.display_name !== undefined) {
    const name = String(body.display_name).trim();
    if (!name) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    baseUpdate.display_name = name;
  }
  if (body.phone !== undefined) baseUpdate.phone = body.phone ? String(body.phone).trim() : null;

  // ── Extended fields (added by add_teacher_profile.sql migration) ────────
  const extUpdate: Record<string, unknown> = {};

  if (body.description !== undefined) extUpdate.description = body.description ? String(body.description).trim() : null;
  if (body.bio !== undefined) extUpdate.bio = body.bio ? String(body.bio).trim() : null;
  if (body.show_photo !== undefined) extUpdate.show_photo = Boolean(body.show_photo);
  if (body.show_description !== undefined) extUpdate.show_description = Boolean(body.show_description);
  if (body.show_bio !== undefined) extUpdate.show_bio = Boolean(body.show_bio);

  // ── V2 fields (added by add_teacher_profile_v2.sql migration) ───────────
  const v2Update: Record<string, unknown> = {};

  if (body.tutoring_area !== undefined) v2Update.tutoring_area = body.tutoring_area ? String(body.tutoring_area).trim() : null;
  if (body.quote !== undefined) v2Update.quote = body.quote ? String(body.quote).trim() : null;
  if (body.page_color !== undefined) {
    const color = String(body.page_color).trim();
    if (!HEX_RE.test(color)) return NextResponse.json({ error: 'Invalid color' }, { status: 400 });
    v2Update.page_color = color;
  }

  // Apply base update
  const allBase = { ...baseUpdate, ...extUpdate };
  if (Object.keys(allBase).length > 0) {
    const { error } = await supabase
      .from('profiles')
      .update(allBase)
      .eq('id', auth.user.id);

    // If extended columns don't exist yet, retry with only base columns
    if (error && Object.keys(extUpdate).length > 0 && Object.keys(baseUpdate).length > 0) {
      const { error: e2 } = await supabase
        .from('profiles')
        .update(baseUpdate)
        .eq('id', auth.user.id);
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
    } else if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Apply v2 update — silently skip if columns don't exist yet
  if (Object.keys(v2Update).length > 0) {
    await supabase.from('profiles').update(v2Update).eq('id', auth.user.id);
  }

  return NextResponse.json({ ok: true });
}
