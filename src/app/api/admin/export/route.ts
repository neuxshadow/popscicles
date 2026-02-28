import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { csvEscape } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
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

    const { data, error } = await supabase
      .from('submissions')
      .select('wallet_address, twitter_username, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      return new Response("No approved wallets found", { status: 404 });
    }

    // Headers
    const headers = ["Wallet", "Twitter", "Date"].map(csvEscape);
    
    // Rows
    const rows = data.map(row => [
      csvEscape(row.wallet_address),
      csvEscape(row.twitter_username),
      csvEscape(new Date(row.created_at).toISOString())
    ]);

    // Construct CSV content securely
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="approved_wallets_${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (err: any) {
    if (err.message === 'Supabase configuration missing') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Export API Error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
