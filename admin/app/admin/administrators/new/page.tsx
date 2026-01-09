'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

export default function NewAdministratorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    is_active: true,
  });

  useEffect(() => {
    // セッション確認
    const session = localStorage.getItem('admin_session');
    if (!session) {
      router.push('/admin/login');
      return;
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // パスワードをハッシュ化（API経由）
      const hashResponse = await fetch('/api/admin/hash-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: formData.password }),
      });

      if (!hashResponse.ok) {
        const errorData = await hashResponse.json();
        throw new Error(errorData.error || 'パスワードのハッシュ化に失敗しました');
      }

      const { password_hash } = await hashResponse.json();

      const { error } = await supabase
        .from('administrators')
        .insert([
          {
            email: formData.email,
            password_hash: password_hash,
            name: formData.name,
            is_active: formData.is_active,
          },
        ]);

      if (error) throw error;

      alert('管理者を作成しました');
      router.push('/admin/administrators');
    } catch (error: any) {
      alert('作成に失敗しました: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#243266' }}>
            新規管理者作成
          </h2>

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
                  placeholder="メールアドレスを入力"
                />
              </div>

              {/* パスワード */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード <span className="text-gray-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ focusRingColor: '#243266' }}
                  placeholder="パスワードを入力（6文字以上）"
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
                  placeholder="氏名を入力"
                />
              </div>

              {/* 有効/無効 */}
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
                  {saving ? '作成中...' : '作成'}
                </button>
                <Link
                  href="/admin/administrators"
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  キャンセル
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

