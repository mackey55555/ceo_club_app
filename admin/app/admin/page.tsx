'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    memberCount: 0,
    eventCount: 0,
    newsCount: 0,
    pendingCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // セッション確認
    const session = localStorage.getItem('admin_session');
    if (!session) {
      router.push('/admin/login');
      return;
    }

    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // 会員数
      const { count: memberCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // イベント数
      const { count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // お知らせ数
      const { count: newsCount } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true });

      // 承認待ち数
      const { count: pendingCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('status_id', '00000000-0000-0000-0000-000000000001'); // pending

      setStats({
        memberCount: memberCount || 0,
        eventCount: eventCount || 0,
        newsCount: newsCount || 0,
        pendingCount: pendingCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">会員数</h3>
            <p className="text-2xl font-bold mt-2" style={{ color: '#243266' }}>
              {loading ? '...' : stats.memberCount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">イベント数</h3>
            <p className="text-2xl font-bold mt-2" style={{ color: '#243266' }}>
              {loading ? '...' : stats.eventCount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">お知らせ数</h3>
            <p className="text-2xl font-bold mt-2" style={{ color: '#243266' }}>
              {loading ? '...' : stats.newsCount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">承認待ち</h3>
            <p className="text-2xl font-bold mt-2" style={{ color: '#243266' }}>
              {loading ? '...' : stats.pendingCount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#243266' }}>
            クイックアクセス
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/members"
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold mb-2 text-gray-900">会員管理</h3>
              <p className="text-sm text-gray-600">会員一覧・承認・編集</p>
            </Link>
            <Link
              href="/admin/events"
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold mb-2 text-gray-900">イベント管理</h3>
              <p className="text-sm text-gray-600">イベント作成・編集・申込み管理</p>
            </Link>
            <Link
              href="/admin/news"
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold mb-2 text-gray-900">お知らせ管理</h3>
              <p className="text-sm text-gray-600">お知らせ作成・編集</p>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

