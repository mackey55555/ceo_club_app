import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Switch,
} from 'react-native';
import { useEventApplications, ApplicationFilters } from '../../hooks/useEventApplications';
import { router } from 'expo-router';
import { EventWithApplication } from '../../hooks/useEventApplications';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function HistoryScreen() {
  const [filters, setFilters] = useState<ApplicationFilters>({
    includePast: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  // フィルターモーダル内の一時的な状態
  const [tempFilters, setTempFilters] = useState<ApplicationFilters>({
    includePast: false,
  });
  const [tempKeyword, setTempKeyword] = useState('');
  const [tempSelectedYear, setTempSelectedYear] = useState<number | undefined>();
  const [tempSelectedMonth, setTempSelectedMonth] = useState<number | undefined>();

  const { events, loading, error, refetch } = useEventApplications(filters);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // フィルターモーダルを開くときに現在のフィルターを一時状態にコピー
  const openFilters = () => {
    setTempFilters({
      includePast: filters.includePast || false,
    });
    setTempKeyword(filters.keyword || '');
    setTempSelectedYear(filters.year);
    setTempSelectedMonth(filters.month);
    setShowFilters(true);
  };

  const applyFilters = () => {
    setFilters({
      includePast: tempFilters.includePast,
      year: tempSelectedYear,
      month: tempSelectedMonth,
      keyword: tempKeyword.trim() || undefined,
    });
    setShowFilters(false);
  };

  const resetFilters = () => {
    setTempFilters({
      includePast: false,
    });
    setTempKeyword('');
    setTempSelectedYear(undefined);
    setTempSelectedMonth(undefined);
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

  const handlePress = (event: EventWithApplication) => {
    router.push({
      pathname: '/(tabs)/events/[id]',
      params: { id: event.id },
    } as any);
  };

  const handleCancel = async (event: EventWithApplication) => {
    if (!event.cancel_deadline) {
      Alert.alert('エラー', 'このイベントはキャンセルできません');
      return;
    }

    const deadline = new Date(event.cancel_deadline);
    if (deadline < new Date()) {
      Alert.alert('エラー', 'キャンセル期限を過ぎています');
      return;
    }

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
              setCancelling(event.application.id);
              const { error: cancelError } = await supabase
                .from('event_applications')
                .update({
                  status: 'cancelled',
                  cancelled_at: new Date().toISOString(),
                })
                .eq('id', event.application.id);

              if (cancelError) throw cancelError;

              await refetch();
              Alert.alert('キャンセル完了', '申し込みをキャンセルしました');
            } catch (err: any) {
              console.error('Error cancelling application:', err);
              Alert.alert('エラー', err.message || 'キャンセルに失敗しました');
            } finally {
              setCancelling(null);
            }
          },
        },
      ]
    );
  };

  const canCancel = (event: EventWithApplication) => {
    if (!event.cancel_deadline) return false;
    const deadline = new Date(event.cancel_deadline);
    return deadline > new Date();
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#243266" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* フィルターボタン */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={openFilters}
        >
          <Ionicons name="filter" size={20} color="#243266" />
          <Text style={styles.filterButtonText}>フィルター</Text>
        </TouchableOpacity>
        {filters.keyword && (
          <View style={styles.activeFilter}>
            <Text style={styles.activeFilterText}>
              検索: {filters.keyword}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>参加履歴はありません</Text>
          </View>
        ) : (
          events.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventItem}
              onPress={() => handlePress(event)}
            >
              {event.thumbnail_url ? (
                <Image
                  source={{ uri: event.thumbnail_url }}
                  style={styles.thumbnail}
                />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Text style={styles.placeholderText}>No Image</Text>
                </View>
              )}
              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventDate}>
                    {formatDate(event.event_date)}
                    {event.start_time && ` ${formatTime(event.start_time)}`}
                    {event.end_time && ` - ${formatTime(event.end_time)}`}
                  </Text>
                  <View style={styles.appliedBadge}>
                    <Text style={styles.appliedBadgeText}>申込済</Text>
                  </View>
                </View>
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {event.title}
                </Text>
                {event.venue && (
                  <Text style={styles.eventVenue} numberOfLines={1}>
                    📍 {event.venue}
                  </Text>
                )}
                {canCancel(event) && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleCancel(event);
                    }}
                    disabled={cancelling === event.application.id}
                  >
                    <Text style={styles.cancelButtonText}>
                      {cancelling === event.application.id
                        ? 'キャンセル中...'
                        : 'キャンセル'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* フィルターモーダル */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>フィルター</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* 過去表示 */}
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>過去のイベントも表示</Text>
                <Switch
                  value={tempFilters.includePast || false}
                  onValueChange={(value) =>
                    setTempFilters({ ...tempFilters, includePast: value })
                  }
                  trackColor={{ false: '#e0e0e0', true: '#243266' }}
                />
              </View>

              {/* 年月フィルター */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>年月</Text>
                <View style={styles.pickerRow}>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>年</Text>
                    <ScrollView style={styles.picker}>
                      {years.map((year) => (
                        <TouchableOpacity
                          key={year}
                          style={[
                            styles.pickerOption,
                            tempSelectedYear === year && styles.pickerOptionSelected,
                          ]}
                          onPress={() =>
                            setTempSelectedYear(
                              tempSelectedYear === year ? undefined : year
                            )
                          }
                        >
                          <Text
                            style={[
                              styles.pickerOptionText,
                              tempSelectedYear === year &&
                                styles.pickerOptionTextSelected,
                            ]}
                          >
                            {year}年
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>月</Text>
                    <ScrollView style={styles.picker}>
                      {months.map((month) => (
                        <TouchableOpacity
                          key={month}
                          style={[
                            styles.pickerOption,
                            tempSelectedMonth === month &&
                              styles.pickerOptionSelected,
                          ]}
                          onPress={() =>
                            setTempSelectedMonth(
                              tempSelectedMonth === month ? undefined : month
                            )
                          }
                        >
                          <Text
                            style={[
                              styles.pickerOptionText,
                              tempSelectedMonth === month &&
                                styles.pickerOptionTextSelected,
                            ]}
                          >
                            {month}月
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>

              {/* キーワード検索 */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>キーワード検索</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="タイトル・場所で検索"
                  value={tempKeyword}
                  onChangeText={setTempKeyword}
                  placeholderTextColor="#999"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>リセット</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>適用</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#243266',
  },
  filterButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#243266',
    fontWeight: '500',
  },
  activeFilter: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
  },
  activeFilterText: {
    fontSize: 12,
    color: '#2e7d32',
  },
  scrollView: {
    flex: 1,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#243266',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  eventItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
  },
  thumbnailPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
  },
  eventContent: {
    flex: 1,
    justifyContent: 'center',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  appliedBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  appliedBadgeText: {
    fontSize: 10,
    color: '#2e7d32',
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 4,
  },
  eventVenue: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  cancelButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f44336',
    marginTop: 4,
  },
  cancelButtonText: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pickerContainer: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  picker: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  pickerOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#333',
  },
  pickerOptionTextSelected: {
    color: '#243266',
    fontWeight: '600',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#243266',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
