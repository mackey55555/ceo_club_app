import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Event, EventApplication } from '../../../types';
import { useAuthStore } from '../../../stores/authStore';
import * as Crypto from 'expo-crypto';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [application, setApplication] = useState<EventApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchEventDetail();
    if (user) {
      fetchApplication();
    }
  }, [id, user]);

  const fetchEventDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      setEvent(data as Event);
    } catch (err: any) {
      setError(err.message || 'イベントの取得に失敗しました');
      console.error('Error fetching event detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplication = async () => {
    if (!user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('event_applications')
        .select('*')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .eq('status', 'applied')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116はレコードが見つからないエラー（正常）
        throw fetchError;
      }

      if (data) {
        setApplication(data as EventApplication);
      }
    } catch (err: any) {
      console.error('Error fetching application:', err);
    }
  };

  const handleApply = async () => {
    if (!user || !event) return;

    try {
      setApplying(true);

      // UUIDを生成
      const uuid = await Crypto.randomUUID();

      const { data, error: applyError } = await supabase
        .from('event_applications')
        .insert({
          id: uuid,
          event_id: event.id,
          user_id: user.id,
          status: 'applied',
        })
        .select()
        .single();

      if (applyError) throw applyError;

      setApplication(data as EventApplication);
      Alert.alert('申し込み完了', 'イベントへの申し込みが完了しました');
    } catch (err: any) {
      console.error('Error applying to event:', err);
      Alert.alert('エラー', err.message || '申し込みに失敗しました');
    } finally {
      setApplying(false);
    }
  };

  const handleCancel = async () => {
    if (!application) return;

    Alert.alert(
      'キャンセル確認',
      'イベントへの申し込みをキャンセルしますか？',
      [
        { text: 'いいえ', style: 'cancel' },
        {
          text: 'はい',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error: cancelError } = await supabase
                .from('event_applications')
                .update({
                  status: 'cancelled',
                  cancelled_at: new Date().toISOString(),
                })
                .eq('id', application.id);

              if (cancelError) throw cancelError;

              setApplication(null);
              Alert.alert('キャンセル完了', '申し込みをキャンセルしました');
            } catch (err: any) {
              console.error('Error cancelling application:', err);
              Alert.alert('エラー', err.message || 'キャンセルに失敗しました');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const parseBody = (body: string) => {
    try {
      const parsed = JSON.parse(body);
      if (parsed.type === 'doc' && parsed.content) {
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
      return body;
    }
  };

  const canCancel = () => {
    if (!event || !event.cancel_deadline) return false;
    return new Date(event.cancel_deadline) > new Date();
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

  if (error || !event) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || 'イベントが見つかりません'}
          </Text>
        </View>
      </View>
    );
  }

  const hasApplied = application !== null;
  const canApply = !hasApplied && event.capacity && event.capacity > 0;

  return (
    <ScrollView style={styles.container}>
      {event.thumbnail_url && (
        <Image source={{ uri: event.thumbnail_url }} style={styles.thumbnail} />
      )}
      <View style={styles.content}>
        <Text style={styles.date}>
          {formatDate(event.event_date)}
          {event.start_time && ` ${formatTime(event.start_time)}`}
          {event.end_time && ` - ${formatTime(event.end_time)}`}
        </Text>
        <Text style={styles.title}>{event.title}</Text>

        {event.venue && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 開催場所</Text>
            <Text style={styles.infoValue}>{event.venue}</Text>
          </View>
        )}

        {event.capacity && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>👥 定員</Text>
            <Text style={styles.infoValue}>{event.capacity}名</Text>
          </View>
        )}

        <View style={styles.bodyContainer}>
          <Text style={styles.body}>{parseBody(event.body)}</Text>
        </View>

        {user && (
          <View style={styles.actionContainer}>
            {hasApplied ? (
              <>
                <View style={styles.appliedBadge}>
                  <Text style={styles.appliedText}>✓ 申し込み済み</Text>
                </View>
                {canCancel() && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelButtonText}>キャンセル</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : canApply ? (
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApply}
                disabled={applying}
              >
                <Text style={styles.applyButtonText}>
                  {applying ? '申し込み中...' : 'このイベントに申し込む'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.unavailableBadge}>
                <Text style={styles.unavailableText}>
                  申し込みできません
                </Text>
              </View>
            )}
          </View>
        )}
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
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  bodyContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  body: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  actionContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  applyButton: {
    backgroundColor: '#243266',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  appliedBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  appliedText: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  unavailableBadge: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  unavailableText: {
    color: '#999',
    fontSize: 16,
  },
});

