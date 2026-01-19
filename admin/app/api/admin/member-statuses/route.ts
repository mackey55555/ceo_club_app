import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabaseService';
import { requireAdminSession } from '../_utils';

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);
    const supabase = createServiceSupabase();

    const { data, error } = await supabase
      .from('member_statuses')
      .select('id, name, description')
      .order('name');

    if (error) throw error;
    return NextResponse.json({ statuses: data ?? [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? '取得に失敗しました' },
      { status: 500 }
    );
  }
}


