import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { News } from '../../../types';
import RenderHTML from 'react-native-render-html';

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNewsDetail();
  }, [id]);

  const fetchNewsDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('news')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      setNews(data as News);
    } catch (err: any) {
      setError(err.message || 'お知らせの取得に失敗しました');
      console.error('Error fetching news detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // HTMLをレンダリングするための設定
  const { width } = useWindowDimensions();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#243266" />
        </View>
      </View>
    );
  }

  if (error || !news) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || 'お知らせが見つかりません'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {news.thumbnail_url && (
        <Image source={{ uri: news.thumbnail_url }} style={styles.thumbnail} />
      )}
      <View style={styles.content}>
        <Text style={styles.date}>{formatDate(news.created_at)}</Text>
        <Text style={styles.title}>{news.title}</Text>
        <View style={styles.bodyContainer}>
          <RenderHTML
            contentWidth={width - 40}
            source={{ html: news.body || '' }}
            baseStyle={styles.body}
            tagsStyles={{
              h1: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, marginTop: 16 },
              h2: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, marginTop: 14 },
              h3: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, marginTop: 12 },
              p: { fontSize: 16, lineHeight: 24, marginBottom: 12 },
              ul: { marginBottom: 12, paddingLeft: 20 },
              ol: { marginBottom: 12, paddingLeft: 20 },
              li: { fontSize: 16, lineHeight: 24, marginBottom: 4 },
              strong: { fontWeight: 'bold' },
              em: { fontStyle: 'italic' },
              a: { color: '#243266', textDecorationLine: 'underline' },
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    lineHeight: 32,
  },
  bodyContainer: {
    marginTop: 8,
  },
  body: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});

