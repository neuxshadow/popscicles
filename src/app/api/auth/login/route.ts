import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Server-side Login Error:", error);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Sessions are automatically handled by the createClient's cookie setAll logic
    // which uses next/headers cookies() internally.
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email
      }
    });

  } catch (err: any) {
    console.error("Auth API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
