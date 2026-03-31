import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/teachers — public list of active teacher IDs (used by root page)
export async function GET() {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'teacher')
    .eq('is_active', true);

  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data ?? []);
}
