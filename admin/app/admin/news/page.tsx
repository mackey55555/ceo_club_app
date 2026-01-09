'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

interface News {
  id: string;
  title: string;
  thumbnail_url?: string;
  status_id: string;
  status?: {
    name: string;
  };
  publish_at?: string;
  created_at: string;
  updated_at: string;
}

export default function NewsPage() {
  const router = useRouter();
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    // セッション確認
    const session = localStorage.getItem('admin_session');
    if (!session) {
      router.push('/admin/login');
      return;
    }

    fetchStatuses();
    fetchNews();
  }, [router, statusFilter, searchKeyword]);

  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('news_statuses')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setStatuses(data || []);
    } catch (error) {
      console.error('Error fetching statuses:', error);
    }
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('news')
        .select(`
          id,
          title,
          thumbnail_url,
          status_id,
          publish_at,
          created_at,
          updated_at,
          status:news_statuses(id, name)
        `)
        .order('created_at', { ascending: false });

      // ステータスフィルター
      if (statusFilter !== 'all') {
        query = query.eq('status_id', statusFilter);
      }

      // 検索キーワード
      if (searchKeyword.trim()) {
        query = query.ilike('title', `%${searchKeyword}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNews((data as any) || []);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (statusName: string) => {
    switch (statusName) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (statusName: string) => {
    switch (statusName) {
      case 'published':
        return '公開中';
      case 'draft':
        return '下書き';
      case 'archived':
        return 'アーカイブ';
      default:
        return statusName;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`「${title}」を削除しますか？`)) return;

    try {
      const { error } = await supabase.from('news').delete().eq('id', id);

      if (error) throw error;

      alert('削除しました');
      fetchNews();
    } catch (error: any) {
      alert('削除に失敗しました: ' + error.message);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end mb-6">
          <Link
            href="/admin/news/new"
            className="px-4 py-2 text-white rounded hover:opacity-90"
            style={{ backgroundColor: '#243266' }}
          >
            新規作成
          </Link>
        </div>
        {/* 検索・フィルター */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                検索
              </label>
              <input
                type="text"
                placeholder="タイトルで検索"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ focusRingColor: '#243266' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ focusRingColor: '#243266' }}
              >
                <option value="all">すべて</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {getStatusLabel(status.name)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* お知らせ一覧 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">読み込み中...</div>
          ) : news.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              お知らせが見つかりませんでした
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイトル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    公開日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {news.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.status && (
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                            item.status.name
                          )}`}
                        >
                          {getStatusLabel(item.status.name)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.publish_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/news/${item.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                          style={{ color: '#243266' }}
                        >
                          編集
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

