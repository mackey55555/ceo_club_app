'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import RichTextEditor from '@/components/RichTextEditor';
import ImageUpload from '@/components/ImageUpload';
import AdminLayout from '@/components/AdminLayout';

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
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
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
        // 管理者はusersテーブルに存在しないため、created_byはNULLにする
        // updateData.created_by = admin.id;
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
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">読み込み中...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isNew && !news) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center text-gray-500">
              お知らせが見つかりませんでした
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-6">
          {!isNew && !editMode && (
            <div className="flex gap-2">
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 text-white rounded hover:opacity-90"
                style={{ backgroundColor: '#243266' }}
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
        {editMode ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左側: 編集フォーム */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold" style={{ color: '#243266' }}>
                  編集
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('edit')}
                    className={`px-3 py-1 rounded text-sm ${
                      viewMode === 'edit'
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('preview')}
                    className={`px-3 py-1 rounded text-sm ${
                      viewMode === 'preview'
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    プレビュー
                  </button>
                </div>
              </div>

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#243266] focus:ring-offset-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    本文 <span className="text-gray-500">*</span>
                  </label>
                  {viewMode === 'edit' ? (
                    <RichTextEditor
                      content={formData.body}
                      onChange={(content) =>
                        setFormData({ ...formData, body: content })
                      }
                      placeholder="本文を入力してください..."
                    />
                  ) : (
                    <div
                      className="border border-gray-300 rounded-md p-4 min-h-[300px] bg-white prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: formData.body || '<p class="text-gray-400">プレビューが表示されます</p>' }}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    サムネイル画像
                  </label>
                  <ImageUpload
                    currentUrl={formData.thumbnail_url}
                    onUploadComplete={(url) =>
                      setFormData({ ...formData, thumbnail_url: url })
                    }
                    bucketName="thumbnails"
                    folder="news"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#243266] focus:ring-offset-2"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#243266] focus:ring-offset-2"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t">
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
            </div>

            {/* 右側: プレビュー */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-4" style={{ color: '#243266' }}>
                プレビュー
              </h2>
              <div className="border border-gray-300 rounded-md p-6 bg-gray-50">
                {formData.thumbnail_url && (
                  <img
                    src={formData.thumbnail_url}
                    alt={formData.title || 'サムネイル'}
                    className="w-full h-auto rounded mb-4"
                  />
                )}
                <h1 className="text-2xl font-bold mb-4 text-gray-900">
                  {formData.title || 'タイトルが表示されます'}
                </h1>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: formData.body || '<p class="text-gray-400">本文が表示されます</p>',
                  }}
                />
                {formData.publish_at && (
                  <div className="mt-4 text-sm text-gray-500">
                    公開日時: {formatDate(formData.publish_at)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
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
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: news?.body || '' }}
                />
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
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
