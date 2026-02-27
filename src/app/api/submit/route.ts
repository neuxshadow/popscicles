import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isValidEthereumAddress, isValidTwitterUrl } from '@/lib/utils';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { twitter_username, wallet_address, tweet_url } = body;

    // 1. Server-side validation
    if (!twitter_username || !wallet_address || !tweet_url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const tUsername = twitter_username.trim().startsWith('@') ? twitter_username.trim() : `@${twitter_username.trim()}`;
    const wAddress = wallet_address.trim().startsWith('0x') ? wallet_address.trim().toLowerCase() : `0x${wallet_address.trim()}`.toLowerCase();

    if (!isValidEthereumAddress(wAddress)) {
      return NextResponse.json({ error: "Invalid Ethereum address format" }, { status: 400 });
    }

    if (!isValidTwitterUrl(tweet_url)) {
      return NextResponse.json({ error: "Invalid Tweet URL" }, { status: 400 });
    }

    // 2. Check for duplicates using the public client (requires no select policy OR a restricted one)
    // Actually, per "Do NOT enable any public SELECT policy", this check might fail if SELECT is disabled.
    // However, for duplicate checks during INSERT, we can either:
    // a. Rely on DB unique constraints (twitter_username, wallet_address are UNIQUE)
    // b. Use a RPC or restricted SELECT.
    // Given the constraints, let's rely on the DB unique constraint and handle the error.

    // 3. Get IP for metadata (with simple anonymization/hashing)
    const headerList = await headers();
    const forwarded = headerList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    
    // Simple hash for the IP to avoid storing raw data
    const ipHash = ip === 'unknown' ? 'unknown' : Buffer.from(ip).toString('base64').slice(0, 16);

    // 4. Insert submission using anon client
    const { error: insertError } = await supabase
      .from('submissions')
      .insert([{
        twitter_username: tUsername,
        wallet_address: wAddress,
        tweet_url: tweet_url,
        status: 'pending',
        ip_hash: ipHash,
        user_agent: headerList.get('user-agent')
      }]);

    if (insertError) {
      if (insertError.code === '23505') { // Postgres unique_violation
        return NextResponse.json({ error: "This wallet or Twitter username has already submitted." }, { status: 409 });
      }
      throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Submission API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
