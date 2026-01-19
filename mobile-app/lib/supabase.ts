import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// NOTE:
// Standalone（EAS Build）ではEXPO_PUBLIC_*が未設定だと、起動直後に例外で落ちることがあります。
// ここではクラッシュを避けつつ、ログで設定漏れを気づけるようにします。
const resolvedSupabaseUrl =
  supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://example.invalid';
const resolvedSupabaseAnonKey = supabaseAnonKey ?? 'invalid';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY が未設定です。' +
      ' EAS環境変数（profile=adhoc は preview 環境）に設定してください。'
  );
}

// SecureStoreを使用したカスタムストレージアダプター
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

