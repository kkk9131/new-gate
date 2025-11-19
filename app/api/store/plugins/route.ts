import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  const supabase = await createClient();

  let dbQuery = supabase
    .from('store_plugins')
    .select('*', { count: 'exact' })
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category && category !== 'all') {
    dbQuery = dbQuery.eq('category', category);
  }

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  }

  const { data, error, count } = await dbQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plugins: data, total: count });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validate required fields (basic validation)
    if (!body.plugin_id || !body.name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('store_plugins')
      .insert({
        ...body,
        author_id: user.id,
        author_name: user.user_metadata.full_name || user.email, // Fallback
        author_email: user.email,
        is_published: false, // Default to draft
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
