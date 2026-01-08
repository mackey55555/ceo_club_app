import React, { useState, useCallback, useMemo } from 'react';
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
  Switch,
  Modal,
} from 'react-native';
import { useEvents, EventFilters } from '../../hooks/useEvents';
import { router } from 'expo-router';
import { EventWithApplication } from '../../types';
import { Ionicons } from '@expo/vector-icons';

type ViewType = 'list' | 'calendar' | 'venue';

export default function EventsScreen() {
  const [viewType, setViewType] = useState<ViewType>('list');
  const [filters, setFilters] = useState<EventFilters>({
    includePast: false,
    applicationStatus: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  // フィルターモーダル内の一時的な状態
  const [tempFilters, setTempFilters] = useState<EventFilters>({
    includePast: false,
    applicationStatus: 'all',
  });
  const [tempKeyword, setTempKeyword] = useState('');
  const [tempSelectedYear, setTempSelectedYear] = useState<number | undefined>();
  const [tempSelectedMonth, setTempSelectedMonth] = useState<number | undefined>();

  // カレンダー用の状態
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);

  const { events, loading, error, refetch } = useEvents(filters);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // フィルターモーダルを開くときに現在のフィルターを一時状態にコピー
  const openFilters = () => {
    setTempFilters({
      includePast: filters.includePast || false,
      applicationStatus: filters.applicationStatus || 'all',
    });
    setTempKeyword(filters.keyword || '');
    setTempSelectedYear(filters.year);
    setTempSelectedMonth(filters.month);
    setShowFilters(true);
  };

  const applyFilters = () => {
    setFilters({
      includePast: tempFilters.includePast,
      applicationStatus: tempFilters.applicationStatus,
      year: tempSelectedYear,
      month: tempSelectedMonth,
      keyword: tempKeyword.trim() || undefined,
    });
    setShowFilters(false);
  };

  const resetFilters = () => {
    setTempFilters({
      includePast: false,
      applicationStatus: 'all',
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

  // 場所別ビュー用: 場所ごとにグループ化
  const eventsByVenue = useMemo(() => {
    const grouped: { [venue: string]: EventWithApplication[] } = {};
    events.forEach((event) => {
      const venue = event.venue || '場所未設定';
      if (!grouped[venue]) {
        grouped[venue] = [];
      }
      grouped[venue].push(event);
    });
    return grouped;
  }, [events]);

  // カレンダー用: 日付ごとにグループ化
  const eventsByDate = useMemo(() => {
    const grouped: { [date: string]: EventWithApplication[] } = {};
    events.forEach((event) => {
      const dateKey = event.event_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [events]);

  // カレンダーの日付を生成
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // 月の最初の日が週の何日目か（0=日曜日）
    const startDay = firstDay.getDay();
    // 前月の日付を追加
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    // 今月の日付を追加
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    // 週を埋めるために次月の日付を追加
    const remaining = 42 - days.length; // 6週分
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }, [calendarMonth]);

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

  const renderListView = () => (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>イベントはありません</Text>
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
                {event.hasApplied && (
                  <View style={styles.appliedBadge}>
                    <Text style={styles.appliedBadgeText}>申込済</Text>
                  </View>
                )}
              </View>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {event.title}
              </Text>
              {event.venue && (
                <Text style={styles.eventVenue} numberOfLines={1}>
                  📍 {event.venue}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  const renderCalendarView = () => {
    const dateKey = selectedDate
      ? selectedDate.toISOString().split('T')[0]
      : null;
    const dayEvents = dateKey ? eventsByDate[dateKey] || [] : [];

    return (
      <View style={styles.calendarContainer}>
        <ScrollView
          style={styles.calendarScrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* カレンダーヘッダー */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              onPress={() => {
                const prevMonth = new Date(calendarMonth);
                prevMonth.setMonth(prevMonth.getMonth() - 1);
                setCalendarMonth(prevMonth);
              }}
            >
              <Ionicons name="chevron-back" size={24} color="#243266" />
            </TouchableOpacity>
            <Text style={styles.calendarMonthText}>
              {calendarMonth.getFullYear()}年{calendarMonth.getMonth() + 1}月
            </Text>
            <TouchableOpacity
              onPress={() => {
                const nextMonth = new Date(calendarMonth);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                setCalendarMonth(nextMonth);
              }}
            >
              <Ionicons name="chevron-forward" size={24} color="#243266" />
            </TouchableOpacity>
          </View>

          {/* 曜日ヘッダー */}
          <View style={styles.weekdayHeader}>
            {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
              <View key={day} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* カレンダーグリッド */}
          <View style={styles.calendarGrid}>
            <View style={styles.calendarRow}>
              {calendarDays.map((day, index) => {
                const dayKey = day.toISOString().split('T')[0];
                const hasEvents = (eventsByDate[dayKey]?.length || 0) > 0;
                const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                const isToday =
                  day.toDateString() === new Date().toDateString();
                const isSelected =
                  selectedDate?.toDateString() === day.toDateString();

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarCell,
                      !isCurrentMonth && styles.calendarCellOtherMonth,
                      isToday && styles.calendarCellToday,
                      isSelected && styles.calendarCellSelected,
                      hasEvents && styles.calendarCellWithEvents,
                    ]}
                    onPress={() => setSelectedDate(day)}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        !isCurrentMonth && styles.calendarDayTextOtherMonth,
                        isToday && styles.calendarDayTextToday,
                        isSelected && styles.calendarDayTextSelected,
                        hasEvents && styles.calendarDayTextWithEvents,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 選択した日のイベント一覧 */}
          {selectedDate && dayEvents.length > 0 && (
            <View style={styles.dayEventsContainer}>
              <Text style={styles.dayEventsTitle}>
                {formatDate(selectedDate.toISOString())}のイベント
              </Text>
              {dayEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.dayEventItem}
                  onPress={() => handlePress(event)}
                >
                  <Text style={styles.dayEventTime}>
                    {event.start_time && formatTime(event.start_time)}
                    {event.end_time && ` - ${formatTime(event.end_time)}`}
                  </Text>
                  <Text style={styles.dayEventTitle}>{event.title}</Text>
                  {event.venue && (
                    <Text style={styles.dayEventVenue}>📍 {event.venue}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderVenueView = () => {
    const venues = Object.keys(eventsByVenue);
    const displayVenue = selectedVenue || null;
    const displayEvents = displayVenue
      ? eventsByVenue[displayVenue] || []
      : [];

    return (
      <View style={styles.venueContainer}>
        {!displayVenue ? (
          <ScrollView
            style={styles.venueList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {venues.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>開催場所はありません</Text>
              </View>
            ) : (
              venues.map((venue) => (
                <TouchableOpacity
                  key={venue}
                  style={styles.venueItem}
                  onPress={() => setSelectedVenue(venue)}
                >
                  <Text style={styles.venueName}>📍 {venue}</Text>
                  <Text style={styles.venueEventCount}>
                    {eventsByVenue[venue].length}件のイベント
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#999"
                    style={styles.venueArrow}
                  />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        ) : (
          <View style={styles.venueEventsContainer}>
            <View style={styles.venueEventsHeader}>
              <TouchableOpacity
                onPress={() => setSelectedVenue(null)}
                style={styles.backButton}
              >
                <Ionicons name="chevron-back" size={24} color="#243266" />
              </TouchableOpacity>
              <Text style={styles.venueEventsTitle}>📍 {displayVenue}</Text>
            </View>
            <ScrollView
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {displayEvents.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>イベントはありません</Text>
                </View>
              ) : (
                displayEvents.map((event) => (
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
                        {event.hasApplied && (
                          <View style={styles.appliedBadge}>
                            <Text style={styles.appliedBadgeText}>申込済</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.eventTitle} numberOfLines={2}>
                        {event.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* タブ切り替え */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, viewType === 'list' && styles.tabActive]}
          onPress={() => setViewType('list')}
        >
          <Ionicons
            name="list"
            size={20}
            color={viewType === 'list' ? '#243266' : '#999'}
          />
          <Text
            style={[
              styles.tabText,
              viewType === 'list' && styles.tabTextActive,
            ]}
          >
            リスト
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewType === 'calendar' && styles.tabActive]}
          onPress={() => setViewType('calendar')}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={viewType === 'calendar' ? '#243266' : '#999'}
          />
          <Text
            style={[
              styles.tabText,
              viewType === 'calendar' && styles.tabTextActive,
            ]}
          >
            カレンダー
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewType === 'venue' && styles.tabActive]}
          onPress={() => setViewType('venue')}
        >
          <Ionicons
            name="location"
            size={20}
            color={viewType === 'venue' ? '#243266' : '#999'}
          />
          <Text
            style={[
              styles.tabText,
              viewType === 'venue' && styles.tabTextActive,
            ]}
          >
            場所別
          </Text>
        </TouchableOpacity>
      </View>

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

      {/* ビュー切り替え */}
      {viewType === 'list' && renderListView()}
      {viewType === 'calendar' && renderCalendarView()}
      {viewType === 'venue' && renderVenueView()}

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

              {/* 申込みステータス */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>申込みステータス</Text>
                <View style={styles.radioGroup}>
                  {[
                    { value: 'all', label: 'すべて' },
                    { value: 'applied', label: '申込済のみ' },
                    { value: 'not_applied', label: '未申込のみ' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.radioOption}
                      onPress={() =>
                        setTempFilters({
                          ...tempFilters,
                          applicationStatus: option.value as any,
                        })
                      }
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          tempFilters.applicationStatus === option.value &&
                            styles.radioCircleSelected,
                        ]}
                      >
                        {tempFilters.applicationStatus === option.value && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text style={styles.radioLabel}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#243266',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
  },
  tabTextActive: {
    color: '#243266',
    fontWeight: '600',
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
  },
  // カレンダービューのスタイル
  calendarContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  calendarScrollView: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  weekdayHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  weekdayCell: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  calendarGrid: {
    paddingBottom: 0,
  },
  calendarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  calendarCellOtherMonth: {
    backgroundColor: '#f9f9f9',
  },
  calendarCellToday: {
    backgroundColor: '#e3f2fd',
  },
  calendarCellSelected: {
    backgroundColor: '#243266',
  },
  calendarCellWithEvents: {
    backgroundColor: '#a8895b',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333',
  },
  calendarDayTextOtherMonth: {
    color: '#ccc',
  },
  calendarDayTextToday: {
    fontWeight: 'bold',
    color: '#243266',
  },
  calendarDayTextSelected: {
    color: '#fff',
  },
  calendarDayTextWithEvents: {
    color: '#fff',
    fontWeight: '600',
  },
  dayEventsContainer: {
    marginTop: 0,
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  dayEventsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 0,
    marginBottom: 12,
  },
  dayEventItem: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  dayEventTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  dayEventTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  dayEventVenue: {
    fontSize: 12,
    color: '#666',
  },
  // 場所別ビューのスタイル
  venueContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  venueList: {
    flex: 1,
  },
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  venueName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  venueEventCount: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  venueArrow: {
    marginLeft: 8,
  },
  venueEventsContainer: {
    flex: 1,
  },
  venueEventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 12,
  },
  venueEventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  // モーダルのスタイル
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
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#999',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#243266',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#243266',
  },
  radioLabel: {
    fontSize: 14,
    color: '#333',
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
