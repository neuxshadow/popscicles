import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { headers } from 'next/headers';

export async function GET(req: Request) {
  try {
    const headerList = await headers();
    const password = headerList.get('x-admin-password');

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    let query = supabaseAdmin
      .from('submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    if (search) {
      query = query.or(`twitter_username.ilike.%${search}%,wallet_address.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query.range(from, to);

    if (error) throw error;

    return NextResponse.json({
      submissions: data || [],
      count: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize)
    });
  } catch (err: any) {
    console.error("Admin List API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
