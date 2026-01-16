'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import RichTextEditor from '@/components/RichTextEditor';
import ImageUpload from '@/components/ImageUpload';
import AdminLayout from '@/components/AdminLayout';

export default function NewNewsPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);
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
  }, [router]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      const insertData: any = {
        title: formData.title,
        body: formData.body,
        status_id: formData.status_id,
        // 管理者はusersテーブルに存在しないため、created_byはNULLにする
        // created_by: admin.id,
      };

      if (formData.thumbnail_url) {
        insertData.thumbnail_url = formData.thumbnail_url;
      }

      if (formData.publish_at) {
        insertData.publish_at = formData.publish_at;
      }

      const { data, error } = await supabase
        .from('news')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      alert('お知らせを作成しました');
      router.push(`/admin/news/${data.id}`);
    } catch (error: any) {
      console.error('Error creating news:', error);
      alert('お知らせ作成に失敗しました: ' + error.message);
    } finally {
      setSaving(false);
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

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <form onSubmit={handleSubmit}>
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
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 text-white rounded hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#243266' }}
                  >
                    {saving ? '作成中...' : '作成'}
                  </button>
                  <Link
                    href="/admin/news"
                    className="px-6 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  >
                    キャンセル
                  </Link>
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
                  className="prose prose-sm max-w-none text-gray-700"
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
        </form>
      </div>
    </AdminLayout>
  );
}
