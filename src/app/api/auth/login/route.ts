import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getRateLimiter, getClientIP } from '@/lib/ratelimit';

/**
 * Rate limiting thresholds: 5 attempts per 5 minutes
 */
const loginLimiter = getRateLimiter(5, "300 s");

export async function POST(request: Request) {
  const ip = getClientIP(request);
  
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Apply Rate Limiting (Production-grade via Upstash)
    if (loginLimiter) {
      // 1. Rate limit by IP
      const { success: ipSuccess } = await loginLimiter.limit(`login_ip_${ip}`);
      if (!ipSuccess) {
        return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
      }
      
      // 2. Rate limit by Email (prevents distributed brute force on one account)
      const emailKey = email.toLowerCase().trim();
      const { success: emailSuccess } = await loginLimiter.limit(`login_email_${emailKey}`);
      if (!emailSuccess) {
        return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
      }
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log failure but never the password
      console.error(`Auth failure for ${email}: ${error.message} [IP: ${ip}]`);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email
      }
    });

  } catch (err: any) {
    if (err.message === 'Supabase configuration missing') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Auth API System Error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
