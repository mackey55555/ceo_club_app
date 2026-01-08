// Supabase接続テスト
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Supabase接続テスト');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // テーブル一覧を取得して接続確認
    const { data, error } = await supabase
      .from('member_statuses')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ 接続エラー:', error.message);
      console.error('詳細:', error);
      process.exit(1);
    }

    console.log('✅ Supabase接続成功！');
    
    // マスタデータの確認
    const { data: statuses, error: statusError } = await supabase
      .from('member_statuses')
      .select('name, description')
      .limit(5);

    if (statusError) {
      console.error('⚠️  データ取得エラー:', statusError.message);
    } else {
      console.log('✅ マスタデータ確認:');
      statuses.forEach(s => {
        console.log(`   - ${s.name}: ${s.description || ''}`);
      });
    }

  } catch (err) {
    console.error('❌ 予期しないエラー:', err.message);
    process.exit(1);
  }
}

testConnection();

