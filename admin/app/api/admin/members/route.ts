import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabaseService';
import { requireAdminSession } from '../_utils';

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);
    const supabase = createServiceSupabase();

    const { searchParams } = new URL(request.url);
    const statusId = searchParams.get('statusId') || 'all';
    const keyword = (searchParams.get('keyword') || '').trim();

    let query = supabase
      .from('users')
      .select(
        `
        id,
        email,
        full_name,
        company_name,
        district,
        gender,
        birth_date,
        status_id,
        created_at,
        status:member_statuses(id, name, description)
      `
      )
      .order('created_at', { ascending: false });

    if (statusId !== 'all') {
      query = query.eq('status_id', statusId);
    }

    if (keyword) {
      query = query.or(
        `email.ilike.%${keyword}%,full_name.ilike.%${keyword}%,company_name.ilike.%${keyword}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ members: data ?? [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? '取得に失敗しました' },
      { status: 500 }
    );
  }
}


