import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useEvents } from '../../hooks/useEvents';
import { router } from 'expo-router';
import { Event } from '../../types';

export default function EventsScreen() {
  const { events, loading, error, refetch } = useEvents();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return '';
    // timeStringは "HH:MM:SS" 形式
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const handlePress = (event: Event) => {
    router.push({
      pathname: '/(tabs)/events/[id]',
      params: { id: event.id },
    } as any);
  };

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
    <ScrollView
      style={styles.container}
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
              <Text style={styles.eventDate}>
                {formatDate(event.event_date)}
                {event.start_time && ` ${formatTime(event.start_time)}`}
                {event.end_time && ` - ${formatTime(event.end_time)}`}
              </Text>
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
  eventDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
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
});
