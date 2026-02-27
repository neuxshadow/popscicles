import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const q = query.trim().toLowerCase();
    const twitterQ = q.startsWith('@') ? q : `@${q}`;

    // Status check using supabaseAdmin (Service Role)
    // Returns only sensitive-safe fields
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .select('status, admin_note, twitter_username, wallet_address')
      .or(`wallet_address.eq.${q},twitter_username.eq.${q},twitter_username.eq.${twitterQ}`)
      .maybeSingle();

    if (error) {
      console.error("Status API Lookup Error:", error);
      return NextResponse.json({ error: "Database lookup failed" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "No submission found" }, { status: 404 });
    }

    return NextResponse.json({
      status: data.status,
      admin_note: data.admin_note,
      twitter_username: data.twitter_username,
      wallet_address: data.wallet_address
    });
  } catch (err) {
    console.error("Status API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
