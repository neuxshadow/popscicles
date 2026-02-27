import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const headerList = await headers();
    const password = headerList.get('x-admin-password');

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { count: total } = await supabaseAdmin.from('submissions').select('*', { count: 'exact', head: true });
    const { count: pending } = await supabaseAdmin.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: approved } = await supabaseAdmin.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'approved');
    const { count: rejected } = await supabaseAdmin.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'rejected');

    return NextResponse.json({
      total: total || 0,
      pending: pending || 0,
      approved: approved || 0,
      rejected: rejected || 0
    });
  } catch (err: any) {
    console.error("Admin Stats API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
