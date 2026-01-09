'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

interface User {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  status_id: string;
  status?: {
    name: string;
    description?: string;
  };
  created_at: string;
}

export default function PendingMembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    // セッション確認
    const session = localStorage.getItem('admin_session');
    if (!session) {
      router.push('/admin/login');
      return;
    }

    fetchPendingMembers();
  }, [router, searchKeyword]);

  const fetchPendingMembers = async () => {
    try {
      setLoading(true);
      const pendingStatusId = '00000000-0000-0000-0000-000000000001'; // pending

      let query = supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          company_name,
          status_id,
          created_at,
          status:member_statuses(id, name, description)
        `)
        .eq('status_id', pendingStatusId)
        .order('created_at', { ascending: false });

      // 検索キーワード
      if (searchKeyword.trim()) {
        query = query.or(
          `email.ilike.%${searchKeyword}%,full_name.ilike.%${searchKeyword}%,company_name.ilike.%${searchKeyword}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setMembers((data as any) || []);
    } catch (error) {
      console.error('Error fetching pending members:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* 検索 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              検索
            </label>
            <input
              type="text"
              placeholder="メールアドレス・氏名・会社名で検索"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ focusRingColor: '#243266' }}
            />
          </div>
        </div>

        {/* 会員一覧 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">読み込み中...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              承認待ちの会員はいません
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
                    会社名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    申請日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.full_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {member.company_name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(member.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/members/${member.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                        style={{ color: '#243266' }}
                      >
                        詳細・承認
                      </Link>
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

