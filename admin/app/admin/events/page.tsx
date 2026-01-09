'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Event {
  id: string;
  title: string;
  thumbnail_url?: string;
  event_date: string;
  venue?: string;
  status_id: string;
  status?: {
    name: string;
  };
  publish_at?: string;
  created_at: string;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
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
    fetchEvents();
  }, [router, statusFilter, searchKeyword]);

  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('event_statuses')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setStatuses(data || []);
    } catch (error) {
      console.error('Error fetching statuses:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('events')
        .select(`
          id,
          title,
          thumbnail_url,
          event_date,
          venue,
          status_id,
          publish_at,
          created_at,
          status:event_statuses(id, name)
        `)
        .order('event_date', { ascending: false });

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
      setEvents((data as any) || []);
    } catch (error) {
      console.error('Error fetching events:', error);
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
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-orange-100 text-orange-800';
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
      case 'closed':
        return '終了';
      case 'cancelled':
        return 'キャンセル';
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
      const { error } = await supabase.from('events').delete().eq('id', id);

      if (error) throw error;

      alert('削除しました');
      fetchEvents();
    } catch (error: any) {
      alert('削除に失敗しました: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow" style={{ backgroundColor: '#243266' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="text-white hover:text-gray-200"
              >
                ← ダッシュボード
              </Link>
              <h1 className="text-2xl font-bold text-white">イベント管理</h1>
            </div>
            <Link
              href="/admin/events/new"
              className="px-4 py-2 bg-white text-gray-800 rounded hover:bg-gray-100"
            >
              新規作成
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* イベント一覧 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">読み込み中...</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              イベントが見つかりませんでした
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイトル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    開催日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    開催場所
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    公開日時
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {event.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(event.event_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.venue || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {event.status && (
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                            event.status.name
                          )}`}
                        >
                          {getStatusLabel(event.status.name)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(event.publish_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                          style={{ color: '#243266' }}
                        >
                          編集
                        </Link>
                        <Link
                          href={`/admin/events/${event.id}/applications`}
                          className="text-indigo-600 hover:text-indigo-900"
                          style={{ color: '#243266' }}
                        >
                          申込み
                        </Link>
                        <button
                          onClick={() => handleDelete(event.id, event.title)}
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
      </main>
    </div>
  );
}

