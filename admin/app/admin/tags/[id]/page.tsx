'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

export default function TagDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tagId = params.id as string;

  const [tag, setTag] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    // セッション確認
    const session = localStorage.getItem('admin_session');
    if (!session) {
      router.push('/admin/login');
      return;
    }

    fetchTag();
  }, [router, tagId]);

  const fetchTag = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_tags')
        .select('*')
        .eq('id', tagId)
        .single();

      if (error) throw error;
      setTag(data);
      setFormData({
        name: data.name,
        sort_order: data.sort_order,
        is_active: data.is_active,
      });
    } catch (error) {
      console.error('Error fetching tag:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('タグ名は必須です');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('event_tags')
        .update(formData)
        .eq('id', tagId);

      if (error) throw error;

      alert('タグを更新しました');
      router.push('/admin/tags');
    } catch (error: any) {
      console.error('Error updating tag:', error);
      alert('タグ更新に失敗しました: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`「${tag?.name}」を削除しますか？`)) return;

    try {
      const { error } = await supabase.from('event_tags').delete().eq('id', tagId);

      if (error) throw error;
      alert('削除しました');
      router.push('/admin/tags');
    } catch (error: any) {
      alert('削除に失敗しました: ' + error.message);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">読み込み中...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">タグ編集</h1>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            削除
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タグ名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ focusRingColor: '#243266' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                並び順
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ focusRingColor: '#243266' }}
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">有効</span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-white rounded hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#243266' }}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

