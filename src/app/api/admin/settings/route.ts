import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/admin/settings?key=default_monthly_charge
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const key = new URL(request.url).searchParams.get('key');
  const supabase = createServiceSupabase();

  if (key) {
    const { data, error } = await supabase.from('admin_settings').select('value').eq('key', key).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ key, value: data?.value ?? null });
  }

  const { data, error } = await supabase.from('admin_settings').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// PATCH /api/admin/settings  body: { key, value }
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { key, value } = await request.json();
  if (!key || value === undefined || value === null) {
    return NextResponse.json({ error: 'key and value are required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('admin_settings')
    .upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
