'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

interface MemberApplication {
  id: string;
  user_id: string;
  status: string;
  applied_at: string;
  cancelled_at?: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    company_name?: string;
  };
}

interface GuestApplication {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  job_title?: string;
  status: string;
  applied_at: string;
  cancelled_at?: string;
}

interface Event {
  id: string;
  title: string;
  capacity?: number;
}

interface Member {
  id: string;
  full_name: string;
  email: string;
  company_name?: string;
}

export default function EventApplicationsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [memberApplications, setMemberApplications] = useState<MemberApplication[]>([]);
  const [guestApplications, setGuestApplications] = useState<GuestApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'guests'>('members');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchMemberKeyword, setSearchMemberKeyword] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    // セッション確認
    const session = localStorage.getItem('admin_session');
    if (!session) {
      router.push('/admin/login');
      return;
    }

    fetchEvent();
    fetchApplications();
  }, [router, eventId]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, capacity')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);

      // 会員申込み取得
      const { data: memberData, error: memberError } = await supabase
        .from('event_applications')
        .select(`
          id,
          user_id,
          status,
          applied_at,
          cancelled_at,
          user:users(id, full_name, email, company_name)
        `)
        .eq('event_id', eventId)
        .order('applied_at', { ascending: false });

      if (memberError) throw memberError;

      // 非会員申込み取得
      const { data: guestData, error: guestError } = await supabase
        .from('guest_applications')
        .select('*')
        .eq('event_id', eventId)
        .order('applied_at', { ascending: false });

      if (guestError) throw guestError;

      setMemberApplications((memberData as any) || []);
      setGuestApplications(guestData || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'applied':
        return '申込済';
      case 'cancelled':
        return 'キャンセル';
      default:
        return status;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelMemberApplication = async (applicationId: string) => {
    if (!confirm('この申込みをキャンセルしますか？')) return;

    try {
      const { error } = await supabase
        .from('event_applications')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) throw error;

      alert('キャンセルしました');
      fetchApplications();
    } catch (error: any) {
      alert('キャンセルに失敗しました: ' + error.message);
    }
  };

  const handleCancelGuestApplication = async (applicationId: string) => {
    if (!confirm('この申込みをキャンセルしますか？')) return;

    try {
      const { error } = await supabase
        .from('guest_applications')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) throw error;

      alert('キャンセルしました');
      fetchApplications();
    } catch (error: any) {
      alert('キャンセルに失敗しました: ' + error.message);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      let query = supabase
        .from('users')
        .select('id, full_name, email, company_name')
        .order('full_name', { ascending: true });

      if (searchMemberKeyword.trim()) {
        query = query.or(
          `email.ilike.%${searchMemberKeyword}%,full_name.ilike.%${searchMemberKeyword}%,company_name.ilike.%${searchMemberKeyword}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      alert('会員の取得に失敗しました');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleOpenMemberModal = () => {
    setShowMemberModal(true);
    setSearchMemberKeyword('');
    fetchMembers();
  };

  const handleApplyForMember = async (userId: string) => {
    try {
      // 既に申込み済みかチェック
      const { data: existing, error: checkError } = await supabase
        .from('event_applications')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116はレコードが見つからないエラー（正常）
        throw checkError;
      }

      if (existing) {
        alert('この会員は既に申込み済みです');
        return;
      }

      // 定員チェック
      if (event?.capacity) {
        const { count: memberCount } = await supabase
          .from('event_applications')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .eq('status', 'applied');

        const { count: guestCount } = await supabase
          .from('guest_applications')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .eq('status', 'applied');

        const totalApplications = (memberCount || 0) + (guestCount || 0);
        if (totalApplications >= event.capacity) {
          alert('申し訳ございません。定員に達しました。');
          return;
        }
      }

      // UUIDを生成
      const uuid = crypto.randomUUID();

      // 申込みを追加
      const { error } = await supabase
        .from('event_applications')
        .insert({
          id: uuid,
          event_id: eventId,
          user_id: userId,
          status: 'applied',
        });

      if (error) throw error;

      alert('代理申込みが完了しました');
      setShowMemberModal(false);
      fetchApplications();
    } catch (error: any) {
      console.error('Error applying for member:', error);
      alert('申込みに失敗しました: ' + (error.message || '不明なエラーが発生しました'));
    }
  };

  const exportToCSV = () => {
    const allData: any[] = [];

    // 会員申込みを追加
    memberApplications.forEach((app) => {
      allData.push({
        種別: '会員',
        氏名: app.user?.full_name || '-',
        メールアドレス: app.user?.email || '-',
        会社名: app.user?.company_name || '-',
        役職: '-',
        ステータス: getStatusLabel(app.status),
        申込み日時: formatDateTime(app.applied_at),
        キャンセル日時: formatDateTime(app.cancelled_at),
      });
    });

    // 非会員申込みを追加
    guestApplications.forEach((app) => {
      allData.push({
        種別: '非会員',
        氏名: app.full_name,
        メールアドレス: app.email,
        会社名: app.company_name || '-',
        役職: app.job_title || '-',
        ステータス: getStatusLabel(app.status),
        申込み日時: formatDateTime(app.applied_at),
        キャンセル日時: formatDateTime(app.cancelled_at),
      });
    });

    // CSVヘッダー
    const headers = ['種別', '氏名', 'メールアドレス', '会社名', '役職', 'ステータス', '申込み日時', 'キャンセル日時'];
    
    // CSVデータ
    const csvRows = [
      headers.join(','),
      ...allData.map((row) =>
        headers.map((header) => {
          const value = row[header];
          // カンマや改行を含む場合はダブルクォートで囲む
          if (value && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
            return `"${String(value).replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `event_applications_${eventId}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">読み込み中...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            申込み一覧: {event?.title}
          </h2>
          <div className="flex gap-2">
            {activeTab === 'members' && (
              <button
                onClick={handleOpenMemberModal}
                className="px-4 py-2 text-white rounded hover:opacity-90"
                style={{ backgroundColor: '#a8895b' }}
              >
                代理申込み
              </button>
            )}
            <button
              onClick={exportToCSV}
              className="px-4 py-2 text-white rounded hover:opacity-90"
              style={{ backgroundColor: '#243266' }}
            >
              CSVエクスポート
            </button>
          </div>
        </div>
        {/* タブ */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('members')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'members'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                style={
                  activeTab === 'members'
                    ? { borderColor: '#243266', color: '#243266' }
                    : {}
                }
              >
                会員申込み ({memberApplications.length})
              </button>
              <button
                onClick={() => setActiveTab('guests')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'guests'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                style={
                  activeTab === 'guests'
                    ? { borderColor: '#243266', color: '#243266' }
                    : {}
                }
              >
                非会員申込み ({guestApplications.length})
              </button>
            </nav>
          </div>
        </div>

        {/* 会員申込み一覧 */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {memberApplications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                会員申込みがありません
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
                      申込み日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      キャンセル日時
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {memberApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {app.user?.full_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {app.user?.email || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {app.user?.company_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                            app.status
                          )}`}
                        >
                          {getStatusLabel(app.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(app.applied_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(app.cancelled_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {app.status === 'applied' && (
                          <button
                            onClick={() => handleCancelMemberApplication(app.id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            キャンセル
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 非会員申込み一覧 */}
        {activeTab === 'guests' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {guestApplications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                非会員申込みがありません
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
                      役職
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申込み日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      キャンセル日時
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {guestApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {app.full_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{app.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {app.company_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {app.job_title || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                            app.status
                          )}`}
                        >
                          {getStatusLabel(app.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(app.applied_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(app.cancelled_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {app.status === 'applied' && (
                          <button
                            onClick={() => handleCancelGuestApplication(app.id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            キャンセル
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 会員選択モーダル */}
        {showMemberModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">会員を選択</h3>
                  <button
                    onClick={() => setShowMemberModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="氏名、メールアドレス、会社名で検索"
                    value={searchMemberKeyword}
                    onChange={(e) => {
                      setSearchMemberKeyword(e.target.value);
                      fetchMembers();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#243266] focus:ring-offset-2"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {loadingMembers ? (
                  <div className="text-center py-8 text-gray-500">読み込み中...</div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">会員が見つかりませんでした</div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => {
                      const isAlreadyApplied = memberApplications.some(
                        (app) => app.user_id === member.id && app.status === 'applied'
                      );
                      return (
                        <div
                          key={member.id}
                          className={`p-4 border rounded-lg ${
                            isAlreadyApplied
                              ? 'bg-gray-50 border-gray-200'
                              : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                          }`}
                          onClick={() => !isAlreadyApplied && handleApplyForMember(member.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-gray-900">{member.full_name}</div>
                              <div className="text-sm text-gray-500">{member.email}</div>
                              {member.company_name && (
                                <div className="text-sm text-gray-500">{member.company_name}</div>
                              )}
                            </div>
                            {isAlreadyApplied ? (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                申込済
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplyForMember(member.id);
                                }}
                                className="px-4 py-2 text-white rounded hover:opacity-90"
                                style={{ backgroundColor: '#243266' }}
                              >
                                選択
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

