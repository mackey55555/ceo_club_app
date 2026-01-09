'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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
        .select('id, title')
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow" style={{ backgroundColor: '#243266' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href={`/admin/events/${eventId}`}
                className="text-white hover:text-gray-200"
              >
                ← イベント詳細
              </Link>
              <h1 className="text-2xl font-bold text-white">
                申込み一覧: {event?.title}
              </h1>
            </div>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-white text-gray-800 rounded hover:bg-gray-100"
            >
              CSVエクスポート
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

