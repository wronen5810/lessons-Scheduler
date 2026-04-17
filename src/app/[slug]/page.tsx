import { redirect, notFound } from 'next/navigation';
import { createServiceSupabase } from '@/lib/supabase-server';

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export default async function TeacherSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalized = slug.toLowerCase().replace(/[^a-z0-9]/g, '');

  const supabase = createServiceSupabase();
  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('role', 'teacher')
    .eq('is_active', true);

  if (!teachers || teachers.length === 0) notFound();

  // Try matching against display_name slug first
  let match = teachers.find((t) => nameToSlug(t.display_name ?? '') === normalized);

  // Fallback: match against email username (e.g. "oritjaschek" from "orit.jaschek@...")
  if (!match) {
    const enriched = await Promise.all(
      teachers.map(async (t) => {
        const { data: { user } } = await supabase.auth.admin.getUserById(t.id);
        return { ...t, email: user?.email ?? '' };
      })
    );
    match = enriched.find((t) => {
      const username = (t.email ?? '').split('@')[0];
      return nameToSlug(username) === normalized;
    });
  }

  if (!match) notFound();

  redirect(`/join/${match!.id}`);
}
