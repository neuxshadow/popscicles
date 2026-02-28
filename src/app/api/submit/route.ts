import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isValidEthereumAddress, isValidTwitterUrl, isValidTwitterHandle, normalizeEthereumAddress } from '@/lib/utils';
import { headers } from 'next/headers';
import { getRateLimiter, getClientIP } from '@/lib/ratelimit';
import { createHash } from 'crypto';

/**
 * Rate limit: 10 submissions per 10 minutes per IP
 */
const submitLimiter = getRateLimiter(10, "600 s");

export async function POST(req: Request) {
  const ip = getClientIP(req);

  try {
    // 1. Body size guard (Early reject for large payloads > 5KB)
    const contentLength = parseInt(req.headers.get('content-length') || '0');
    if (contentLength > 5120) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    // 2. Rate Limiting
    if (submitLimiter) {
      const { success } = await submitLimiter.limit(`submit_ip_${ip}`);
      if (!success) {
        return NextResponse.json({ error: "Too Many Requests. Please wait 10 minutes." }, { status: 429 });
      }
    }

    const body = await req.json();
    const { twitter_username, wallet_address, tweet_url } = body;

    // 3. Server-side validation
    if (!twitter_username || !wallet_address || !tweet_url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const tUsername = twitter_username.trim().startsWith('@') ? twitter_username.trim() : `@${twitter_username.trim()}`;
    const wAddress = normalizeEthereumAddress(wallet_address);

    if (!isValidEthereumAddress(wAddress)) {
      return NextResponse.json({ error: "Invalid Ethereum address format" }, { status: 400 });
    }

    if (!isValidTwitterHandle(tUsername)) {
      return NextResponse.json({ error: "Invalid Twitter handle format" }, { status: 400 });
    }

    if (!isValidTwitterUrl(tweet_url)) {
      return NextResponse.json({ error: "Invalid Tweet URL" }, { status: 400 });
    }

    // 4. Secure IP Anonymization (Salted SHA-256)
    const salt = process.env.IP_HASH_SALT || 'dev_salt_replace_in_prod';
    const ipHash = createHash('sha256').update(ip + salt).digest('hex');

    const headerList = await headers();
    
    // 5. Insert submission using server client
    const supabase = await createClient();
    const { error: insertError } = await supabase
      .from('submissions')
      .insert([{
        twitter_username: tUsername,
        wallet_address: wAddress,
        tweet_url: tweet_url,
        status: 'pending',
        ip_hash: ipHash,
        user_agent: headerList.get('user-agent')?.slice(0, 255) // Truncate long User-Agents
      }]);

    if (insertError) {
      if (insertError.code === '23505') { // Postgres unique_violation
        return NextResponse.json({ error: "This wallet or Twitter username has already submitted." }, { status: 409 });
      }
      throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Submission API Error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
