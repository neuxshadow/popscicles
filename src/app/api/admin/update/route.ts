import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    const headerList = await headers();
    const password = headerList.get('x-admin-password');

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status, admin_note } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('submissions')
      .update({ status, admin_note })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Admin Update API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
