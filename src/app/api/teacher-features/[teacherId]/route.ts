import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = await params;
  const supabase = createServiceSupabase();
  const { data } = await supabase
    .from('teacher_settings')
    .select('features')
    .eq('teacher_id', teacherId)
    .single();

  const f = (data?.features ?? {}) as Record<string, unknown>;
  return NextResponse.json({
    allow_cancellation: f.allow_cancellation ?? true,
  });
}
