import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Convert to CSV
    const csvContent = [
      ["Wallet", "Twitter", "Date"],
      ...data.map(row => [
        row.wallet_address,
        row.twitter_username,
        new Date(row.created_at).toLocaleDateString()
      ])
    ].map(e => e.join(",")).join("\n");

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="approved_wallets_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (err: any) {
    console.error("Export API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
