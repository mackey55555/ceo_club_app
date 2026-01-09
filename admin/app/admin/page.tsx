'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // セッション確認
    const session = localStorage.getItem('admin_session');
    if (!session) {
      router.push('/admin/login');
      return;
    }
    setAdmin(JSON.parse(session));
  }, [router]);

  if (!admin) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow" style={{ backgroundColor: '#243266' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">CEOクラブ 管理画面</h1>
            <div className="text-white">
              {admin.name} ({admin.email})
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">会員数</h3>
            <p className="text-2xl font-bold mt-2" style={{ color: '#243266' }}>
              -
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">イベント数</h3>
            <p className="text-2xl font-bold mt-2" style={{ color: '#243266' }}>
              -
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">お知らせ数</h3>
            <p className="text-2xl font-bold mt-2" style={{ color: '#243266' }}>
              -
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">承認待ち</h3>
            <p className="text-2xl font-bold mt-2" style={{ color: '#243266' }}>
              -
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#243266' }}>
            クイックアクセス
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/members"
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold mb-2 text-gray-900">会員管理</h3>
              <p className="text-sm text-gray-600">会員一覧・承認・編集</p>
            </a>
            <a
              href="/admin/events"
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold mb-2 text-gray-900">イベント管理</h3>
              <p className="text-sm text-gray-600">イベント作成・編集・申込み管理</p>
            </a>
            <a
              href="/admin/news"
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold mb-2 text-gray-900">お知らせ管理</h3>
              <p className="text-sm text-gray-600">お知らせ作成・編集</p>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

