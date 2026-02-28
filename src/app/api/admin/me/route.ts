import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Reduce data exposure: do NOT return user email to client.
    return NextResponse.json({
      hasUser: !!user,
      userId: user?.id || null
    });
  } catch (err: any) {
    console.error("Session Check Error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
