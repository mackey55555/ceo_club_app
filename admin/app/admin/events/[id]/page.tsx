'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import RichTextEditor from '@/components/RichTextEditor';
import ImageUpload from '@/components/ImageUpload';
import AdminLayout from '@/components/AdminLayout';

interface Event {
  id: string;
  title: string;
  body: string;
  thumbnail_url?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  capacity?: number;
  cancel_deadline?: string;
  status_id: string;
  status?: {
    id: string;
    name: string;
  };
  publish_at?: string;
  allow_guest: boolean;
  created_at: string;
  updated_at: string;
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const isNew = eventId === 'new';

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);
  const [editMode, setEditMode] = useState(isNew);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    thumbnail_url: '',
    event_date: '',
    start_time: '',
    end_time: '',
    venue: '',
    capacity: '',
    cancel_deadline: '',
    status_id: '00000000-0000-0000-0000-000000000201', // draft
    publish_at: '',
    allow_guest: false,
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
      fetchEvent();
    } else {
      setLoading(false);
    }
  }, [router, eventId]);

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

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          status:event_statuses(id, name)
        `)
        .eq('id', eventId)
        .single();

      if (error) throw error;

      setEvent(data as any);
      setFormData({
        title: data.title || '',
        body: data.body || '',
        thumbnail_url: data.thumbnail_url || '',
        event_date: data.event_date || '',
        start_time: data.start_time || '',
        end_time: data.end_time || '',
        venue: data.venue || '',
        capacity: data.capacity ? String(data.capacity) : '',
        cancel_deadline: data.cancel_deadline
          ? new Date(data.cancel_deadline).toISOString().slice(0, 16)
          : '',
        status_id: data.status_id || '00000000-0000-0000-0000-000000000201',
        publish_at: data.publish_at
          ? new Date(data.publish_at).toISOString().slice(0, 16)
          : '',
        allow_guest: data.allow_guest || false,
      });
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.body || !formData.event_date) {
      alert('タイトル、本文、開催日は必須です');
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
        event_date: formData.event_date,
        status_id: formData.status_id,
        allow_guest: formData.allow_guest,
      };

      if (formData.thumbnail_url) {
        updateData.thumbnail_url = formData.thumbnail_url;
      } else {
        updateData.thumbnail_url = null;
      }

      if (formData.start_time) {
        updateData.start_time = formData.start_time;
      } else {
        updateData.start_time = null;
      }

      if (formData.end_time) {
        updateData.end_time = formData.end_time;
      } else {
        updateData.end_time = null;
      }

      if (formData.venue) {
        updateData.venue = formData.venue;
      } else {
        updateData.venue = null;
      }

      if (formData.capacity) {
        updateData.capacity = parseInt(formData.capacity, 10);
      } else {
        updateData.capacity = null;
      }

      if (formData.cancel_deadline) {
        updateData.cancel_deadline = formData.cancel_deadline;
      } else {
        updateData.cancel_deadline = null;
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
          .from('events')
          .insert(updateData)
          .select()
          .single();

        if (error) throw error;
        alert('イベントを作成しました');
        router.push(`/admin/events/${data.id}`);
      } else {
        const { error } = await supabase
          .from('events')
          .update(updateData)
          .eq('id', eventId);

        if (error) throw error;
        alert('保存しました');
        setEditMode(false);
        fetchEvent();
      }
    } catch (error: any) {
      console.error('Error saving event:', error);
      alert('保存に失敗しました: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    if (!confirm(`「${event.title}」を削除しますか？`)) return;

    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);

      if (error) throw error;

      alert('削除しました');
      router.push('/admin/events');
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

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return '-';
    return timeString;
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

  if (!isNew && !event) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center text-gray-500">
              イベントが見つかりませんでした
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRingColor: '#243266' }}
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
                    folder="events"
                  />
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開催日 <span className="text-gray-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={(e) =>
                      setFormData({ ...formData, event_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRingColor: '#243266' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開催場所
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) =>
                      setFormData({ ...formData, venue: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRingColor: '#243266' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始時刻
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRingColor: '#243266' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    終了時刻
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRingColor: '#243266' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    定員
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                    placeholder="空欄で無制限"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRingColor: '#243266' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    キャンセル期限
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.cancel_deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, cancel_deadline: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRingColor: '#243266' }}
                  />
                </div>
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

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.allow_guest}
                    onChange={(e) =>
                      setFormData({ ...formData, allow_guest: e.target.checked })
                    }
                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-2"
                    style={{ focusRingColor: '#243266' }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    非会員申込み許可
                  </span>
                </label>
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
                        fetchEvent();
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
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div>
                    <strong>開催日:</strong> {formData.event_date ? formatDate(formData.event_date) : '-'}
                  </div>
                  {formData.start_time && (
                    <div>
                      <strong>開始時刻:</strong> {formData.start_time}
                    </div>
                  )}
                  {formData.end_time && (
                    <div>
                      <strong>終了時刻:</strong> {formData.end_time}
                    </div>
                  )}
                  {formData.venue && (
                    <div>
                      <strong>開催場所:</strong> {formData.venue}
                    </div>
                  )}
                  {formData.capacity && (
                    <div>
                      <strong>定員:</strong> {formData.capacity}人
                    </div>
                  )}
                  {formData.publish_at && (
                    <div>
                      <strong>公開日時:</strong> {formatDateTime(formData.publish_at)}
                    </div>
                  )}
                </div>
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
                  {event?.title}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  本文
                </label>
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: event?.body || '' }}
                />
              </div>

              {event?.thumbnail_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    サムネイル
                  </label>
                  <img
                    src={event.thumbnail_url}
                    alt={event.title}
                    className="max-w-full h-auto rounded"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開催日
                  </label>
                  <div className="text-gray-900">{formatDate(event?.event_date)}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開催場所
                  </label>
                  <div className="text-gray-900">{event?.venue || '-'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始時刻
                  </label>
                  <div className="text-gray-900">{formatTime(event?.start_time)}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    終了時刻
                  </label>
                  <div className="text-gray-900">{formatTime(event?.end_time)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    定員
                  </label>
                  <div className="text-gray-900">
                    {event?.capacity ? `${event.capacity}人` : '無制限'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    キャンセル期限
                  </label>
                  <div className="text-gray-900">
                    {formatDateTime(event?.cancel_deadline)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ステータス
                  </label>
                  <div className="text-gray-900">
                    {event?.status && getStatusLabel(event.status.name)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    公開日時
                  </label>
                  <div className="text-gray-900">
                    {formatDateTime(event?.publish_at)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  非会員申込み許可
                </label>
                <div className="text-gray-900">
                  {event?.allow_guest ? '許可' : '不許可'}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  <div>作成日: {formatDateTime(event?.created_at)}</div>
                  <div>更新日: {formatDateTime(event?.updated_at)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

