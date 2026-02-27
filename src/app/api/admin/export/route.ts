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

    const { data, error } = await supabaseAdmin
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
