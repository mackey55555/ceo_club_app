'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

interface Administrator {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export default function AdministratorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const administratorId = params.id as string;

  const [administrator, setAdministrator] = useState<Administrator | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    is_active: true,
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // セッション確認
    const session = localStorage.getItem('admin_session');
    if (!session) {
      router.push('/admin/login');
      return;
    }

    fetchAdministrator();
  }, [router, administratorId]);

  const fetchAdministrator = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('administrators')
        .select('id, email, name, is_active, created_at')
        .eq('id', administratorId)
        .single();

      if (error) throw error;

      setAdministrator(data);
      setFormData({
        email: data.email,
        name: data.name,
        is_active: data.is_active,
      });
    } catch (error) {
      console.error('Error fetching administrator:', error);
      alert('管理者情報の取得に失敗しました');
      router.push('/admin/administrators');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('administrators')
        .update({
          email: formData.email,
          name: formData.name,
          is_active: formData.is_active,
        })
        .eq('id', administratorId);

      if (error) throw error;

      alert('更新しました');
      setEditMode(false);
      fetchAdministrator();
    } catch (error: any) {
      alert('更新に失敗しました: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('パスワードが一致しません');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('パスワードは6文字以上にしてください');
      return;
    }

    setSaving(true);

    try {
      // パスワードをハッシュ化（API経由）
      const hashResponse = await fetch('/api/admin/hash-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordData.newPassword }),
      });

      if (!hashResponse.ok) {
        const errorData = await hashResponse.json();
        throw new Error(errorData.error || 'パスワードのハッシュ化に失敗しました');
      }

      const { password_hash } = await hashResponse.json();

      const { error } = await supabase
        .from('administrators')
        .update({ password_hash: password_hash })
        .eq('id', administratorId);

      if (error) throw error;

      alert('パスワードをリセットしました');
      setShowPasswordReset(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      alert('パスワードリセットに失敗しました: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`「${administrator?.name}」を削除しますか？`)) return;

    try {
      const { error } = await supabase
        .from('administrators')
        .delete()
        .eq('id', administratorId);

      if (error) throw error;

      alert('削除しました');
      router.push('/admin/administrators');
    } catch (error: any) {
      alert('削除に失敗しました: ' + error.message);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
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

  if (!administrator) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center text-gray-500">
              管理者が見つかりませんでした
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold" style={{ color: '#243266' }}>
              管理者詳細
            </h2>
            {!editMode && !showPasswordReset && (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 text-white rounded hover:opacity-90"
                  style={{ backgroundColor: '#243266' }}
                >
                  編集
                </button>
                <button
                  onClick={() => setShowPasswordReset(true)}
                  className="px-4 py-2 text-white rounded hover:opacity-90"
                  style={{ backgroundColor: '#a8895b' }}
                >
                  パスワードリセット
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

          {showPasswordReset ? (
            <form onSubmit={handlePasswordReset}>
              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#243266' }}>
                  パスワードリセット
                </h3>

                {/* 新しいパスワード */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    新しいパスワード <span className="text-gray-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRingColor: '#243266' }}
                    placeholder="新しいパスワードを入力（6文字以上）"
                  />
                </div>

                {/* パスワード確認 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    パスワード確認 <span className="text-gray-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRingColor: '#243266' }}
                    placeholder="パスワードを再入力"
                  />
                </div>

                {/* ボタン */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 text-white rounded hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#a8895b' }}
                  >
                    {saving ? 'リセット中...' : 'パスワードをリセット'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordReset(false);
                      setPasswordData({ newPassword: '', confirmPassword: '' });
                    }}
                    className="px-6 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </form>
          ) : editMode ? (
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* メールアドレス */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス <span className="text-gray-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRingColor: '#243266' }}
                  />
                </div>

                {/* 氏名 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    氏名 <span className="text-gray-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRingColor: '#243266' }}
                  />
                </div>

                {/* 有効/無効 */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      有効
                    </span>
                  </label>
                </div>

                {/* ボタン */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 text-white rounded hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#243266' }}
                  >
                    {saving ? '更新中...' : '更新'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        email: administrator.email,
                        name: administrator.name,
                        is_active: administrator.is_active,
                      });
                    }}
                    className="px-6 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <div className="text-gray-900">{administrator.email}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  氏名
                </label>
                <div className="text-gray-900">{administrator.name}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ステータス
                </label>
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    administrator.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {administrator.is_active ? '有効' : '無効'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  作成日
                </label>
                <div className="text-gray-900">
                  {formatDate(administrator.created_at)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

