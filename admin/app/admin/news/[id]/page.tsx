'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface News {
  id: string;
  title: string;
  body: string;
  thumbnail_url?: string;
  status_id: string;
  status?: {
    id: string;
    name: string;
  };
  publish_at?: string;
  created_at: string;
  updated_at: string;
}

export default function NewsDetailPage() {
  const router = useRouter();
  const params = useParams();
  const newsId = params.id as string;
  const isNew = newsId === 'new';

  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);
  const [editMode, setEditMode] = useState(isNew);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    thumbnail_url: '',
    status_id: '00000000-0000-0000-0000-000000000101', // draft
    publish_at: '',
  });

  useEffect(() => {
    // セッション確認
    const session = localStorage.getItem('admin_session');
    if (!session) {
      router.push('/admin/login');
      return;
    }

    fetchStatuses();
    if (!isNew) {
      fetchNews();
    } else {
      setLoading(false);
    }
  }, [router, newsId]);

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
      const { data, error } = await supabase
        .from('news')
        .select(`
          *,
          status:news_statuses(id, name)
        `)
        .eq('id', newsId)
        .single();

      if (error) throw error;

      setNews(data as any);
      setFormData({
        title: data.title || '',
        body: data.body || '',
        thumbnail_url: data.thumbnail_url || '',
        status_id: data.status_id || '00000000-0000-0000-0000-000000000101',
        publish_at: data.publish_at
          ? new Date(data.publish_at).toISOString().slice(0, 16)
          : '',
      });
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.body) {
      alert('タイトルと本文は必須です');
      return;
    }

    try {
      setSaving(true);
      const session = localStorage.getItem('admin_session');
      if (!session) {
        router.push('/admin/login');
        return;
      }
      const admin = JSON.parse(session);

      const updateData: any = {
        title: formData.title,
        body: formData.body,
        status_id: formData.status_id,
      };

      if (formData.thumbnail_url) {
        updateData.thumbnail_url = formData.thumbnail_url;
      } else {
        updateData.thumbnail_url = null;
      }

      if (formData.publish_at) {
        updateData.publish_at = formData.publish_at;
      } else {
        updateData.publish_at = null;
      }

      if (isNew) {
        updateData.created_by = admin.id;
        const { data, error } = await supabase
          .from('news')
          .insert(updateData)
          .select()
          .single();

        if (error) throw error;
        alert('お知らせを作成しました');
        router.push(`/admin/news/${data.id}`);
      } else {
        const { error } = await supabase
          .from('news')
          .update(updateData)
          .eq('id', newsId);

        if (error) throw error;
        alert('保存しました');
        setEditMode(false);
        fetchNews();
      }
    } catch (error: any) {
      console.error('Error saving news:', error);
      alert('保存に失敗しました: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!news) return;
    if (!confirm(`「${news.title}」を削除しますか？`)) return;

    try {
      const { error } = await supabase.from('news').delete().eq('id', newsId);

      if (error) throw error;

      alert('削除しました');
      router.push('/admin/news');
    } catch (error: any) {
      alert('削除に失敗しました: ' + error.message);
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
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>読み込み中...</div>
      </div>
    );
  }

  if (!isNew && !news) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>お知らせが見つかりませんでした</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow" style={{ backgroundColor: '#243266' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/news"
                className="text-white hover:text-gray-200"
              >
                ← お知らせ一覧
              </Link>
              <h1 className="text-2xl font-bold text-white">
                {isNew ? '新規お知らせ作成' : 'お知らせ詳細'}
              </h1>
            </div>
            {!isNew && !editMode && (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-white text-gray-800 rounded hover:bg-gray-100"
                >
                  編集
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  削除
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {editMode ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル <span className="text-gray-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ focusRingColor: '#243266' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  本文 <span className="text-gray-500">*</span>
                </label>
                <textarea
                  required
                  rows={15}
                  value={formData.body}
                  onChange={(e) =>
                    setFormData({ ...formData, body: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ focusRingColor: '#243266' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  サムネイルURL
                </label>
                <input
                  type="url"
                  value={formData.thumbnail_url}
                  onChange={(e) =>
                    setFormData({ ...formData, thumbnail_url: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ focusRingColor: '#243266' }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ステータス
                  </label>
                  <select
                    value={formData.status_id}
                    onChange={(e) =>
                      setFormData({ ...formData, status_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRingColor: '#243266' }}
                  >
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {getStatusLabel(status.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    公開日時
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.publish_at}
                    onChange={(e) =>
                      setFormData({ ...formData, publish_at: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRingColor: '#243266' }}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 text-white rounded hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#243266' }}
                >
                  {saving ? '保存中...' : '保存'}
                </button>
                {!isNew && (
                  <button
                    onClick={() => {
                      setEditMode(false);
                      fetchNews();
                    }}
                    disabled={saving}
                    className="px-6 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル
                </label>
                <div className="text-gray-900 text-lg font-semibold">
                  {news?.title}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  本文
                </label>
                <div className="text-gray-900 whitespace-pre-wrap">
                  {news?.body}
                </div>
              </div>

              {news?.thumbnail_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    サムネイル
                  </label>
                  <img
                    src={news.thumbnail_url}
                    alt={news.title}
                    className="max-w-full h-auto rounded"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ステータス
                  </label>
                  <div className="text-gray-900">
                    {news?.status && getStatusLabel(news.status.name)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    公開日時
                  </label>
                  <div className="text-gray-900">
                    {formatDate(news?.publish_at)}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  <div>作成日: {formatDate(news?.created_at)}</div>
                  <div>更新日: {formatDate(news?.updated_at)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

