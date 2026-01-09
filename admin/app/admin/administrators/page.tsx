'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function AdministratorsPage() {
  const router = useRouter();
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // セッション確認
    const session = localStorage.getItem('admin_session');
    if (!session) {
      router.push('/admin/login');
      return;
    }

    fetchAdministrators();
  }, [router]);

  const fetchAdministrators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('administrators')
        .select('id, email, name, is_active, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdministrators(data || []);
    } catch (error) {
      console.error('Error fetching administrators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('administrators')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      alert('ステータスを更新しました');
      fetchAdministrators();
    } catch (error: any) {
      alert('更新に失敗しました: ' + error.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;

    try {
      const { error } = await supabase
        .from('administrators')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('削除しました');
      fetchAdministrators();
    } catch (error: any) {
      alert('削除に失敗しました: ' + error.message);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end mb-6">
          <Link
            href="/admin/administrators/new"
            className="px-4 py-2 text-white rounded hover:opacity-90"
            style={{ backgroundColor: '#243266' }}
          >
            新規作成
          </Link>
        </div>

        {/* 管理者一覧 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">読み込み中...</div>
          ) : administrators.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              管理者が見つかりませんでした
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    氏名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メールアドレス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
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
                {administrators.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {admin.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{admin.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          admin.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {admin.is_active ? '有効' : '無効'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(admin.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/administrators/${admin.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                          style={{ color: '#243266' }}
                        >
                          編集
                        </Link>
                        <button
                          onClick={() =>
                            handleToggleActive(admin.id, admin.is_active)
                          }
                          className={`${
                            admin.is_active
                              ? 'text-orange-600 hover:text-orange-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {admin.is_active ? '無効化' : '有効化'}
                        </button>
                        <button
                          onClick={() => handleDelete(admin.id, admin.name)}
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

