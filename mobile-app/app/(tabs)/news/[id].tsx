import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { News } from '../../../types';

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

  const parseBody = (body: string) => {
    try {
      // TipTapのJSON形式をパース（簡易版）
      const parsed = JSON.parse(body);
      if (parsed.type === 'doc' && parsed.content) {
        // 簡易的にテキストを抽出
        const extractText = (node: any): string => {
          if (node.type === 'text') {
            return node.text || '';
          }
          if (node.content && Array.isArray(node.content)) {
            return node.content.map(extractText).join('');
          }
          return '';
        };
        return extractText(parsed);
      }
      return body;
    } catch {
      // JSONでない場合はそのまま返す
      return body;
    }
  };

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
          <Text style={styles.body}>{parseBody(news.body)}</Text>
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

