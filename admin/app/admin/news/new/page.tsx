'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function NewNewsPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);
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
        created_by: admin.id,
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
              <h1 className="text-2xl font-bold text-white">新規お知らせ作成</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
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
        </form>
      </main>
    </div>
  );
}

