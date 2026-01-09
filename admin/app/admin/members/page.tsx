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

export default function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<User[]>([]);
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
    fetchMembers();
  }, [router, statusFilter, searchKeyword]);

  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('member_statuses')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setStatuses(data || []);
    } catch (error) {
      console.error('Error fetching statuses:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
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
        .order('created_at', { ascending: false });

      // ステータスフィルター
      if (statusFilter !== 'all') {
        query = query.eq('status_id', statusFilter);
      }

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
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (statusName: string) => {
    switch (statusName) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-orange-100 text-orange-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (statusName: string) => {
    switch (statusName) {
      case 'active':
        return '有効';
      case 'pending':
        return '承認待ち';
      case 'suspended':
        return '停止中';
      case 'rejected':
        return '却下';
      default:
        return statusName;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <Link
              href="/admin/members/pending"
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              承認待ち一覧
            </Link>
            <Link
              href="/admin/members/new"
              className="px-4 py-2 text-white rounded hover:opacity-90"
              style={{ backgroundColor: '#243266' }}
            >
              新規作成
            </Link>
          </div>
        </div>
        {/* 検索・フィルター */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* 会員一覧 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">読み込み中...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              会員が見つかりませんでした
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
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.status && (
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                            member.status.name
                          )}`}
                        >
                          {getStatusLabel(member.status.name)}
                        </span>
                      )}
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
                        詳細
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

