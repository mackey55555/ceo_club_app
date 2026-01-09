import { Stack, useSegments } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import TabBar from '../../components/TabBar';
import Header from '../../components/Header';
import { useMemo } from 'react';

export default function TabsLayout() {
  const segments = useSegments();

  // 詳細画面かどうかを判定
  const isDetailScreen = useMemo(() => {
    const lastSegment = segments[segments.length - 1];
    return lastSegment?.includes('[') || lastSegment === 'edit';
  }, [segments]);

  // ヘッダータイトルを決定
  const headerTitle = useMemo(() => {
    // 詳細画面
    if (segments.includes('news') && segments.includes('[id]')) {
      return 'お知らせ詳細';
    }
    if (segments.includes('events') && segments.includes('[id]')) {
      return 'イベント詳細';
    }
    if (segments.includes('member') && segments.includes('edit')) {
      return 'プロフィール編集';
    }
    // タブ画面
    const lastSegment = segments[segments.length - 1];
    if (lastSegment === 'news') {
      return 'お知らせ';
    }
    if (lastSegment === 'events') {
      return 'イベント';
    }
    if (lastSegment === 'history') {
      return '申込済';
    }
    if (lastSegment === 'reports') {
      return 'イベント報告記';
    }
    if (lastSegment === 'member') {
      return '会員証';
    }
    return '';
  }, [segments]);

  return (
    <View style={styles.container}>
      {headerTitle && (
        <Header title={headerTitle} showBack={isDetailScreen} />
      )}
      <Stack>
        <Stack.Screen 
          name="news" 
          options={{ 
            headerShown: false,
            animation: 'none' 
          }} 
        />
        <Stack.Screen 
          name="events" 
          options={{ 
            headerShown: false,
            animation: 'none' 
          }} 
        />
        <Stack.Screen 
          name="history" 
          options={{ 
            headerShown: false,
            animation: 'none' 
          }} 
        />
        <Stack.Screen 
          name="reports" 
          options={{ 
            headerShown: false,
            animation: 'none' 
          }} 
        />
        <Stack.Screen 
          name="member" 
          options={{ 
            headerShown: false,
            animation: 'none' 
          }} 
        />
        <Stack.Screen 
          name="news/[id]" 
          options={{ 
            headerShown: false,
            animation: 'default' 
          }} 
        />
        <Stack.Screen 
          name="events/[id]" 
          options={{ 
            headerShown: false,
            animation: 'default' 
          }} 
        />
        <Stack.Screen 
          name="member/edit" 
          options={{ 
            headerShown: false,
            animation: 'default' 
          }} 
        />
      </Stack>
      {!isDetailScreen && <TabBar />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
