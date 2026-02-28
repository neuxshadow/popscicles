import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = authData.user;

    // Check if the user is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { count: total } = await supabase.from('submissions').select('*', { count: 'exact', head: true });
    const { count: pending } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: approved } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'approved');
    const { count: rejected } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'rejected');

    return NextResponse.json({
      total: total || 0,
      pending: pending || 0,
      approved: approved || 0,
      rejected: rejected || 0
    });
  } catch (err: any) {
    if (err.message === 'Supabase configuration missing') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Admin Stats API Error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
