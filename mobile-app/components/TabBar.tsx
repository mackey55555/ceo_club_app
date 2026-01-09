import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const tabs = [
  { name: 'news', label: 'お知らせ', icon: 'newspaper-outline' },
  { name: 'events', label: 'イベント', icon: 'calendar-outline' },
  { name: 'history', label: '申込済', icon: 'time-outline' },
  { name: 'reports', label: '報告記', icon: 'document-text-outline' },
  { name: 'member', label: '会員証', icon: 'person-outline' },
];

export default function TabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (tabName: string) => {
    return pathname?.includes(`/${tabName}`);
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = isActive(tab.name);
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => router.push(`/(tabs)/${tab.name}` as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={24}
              color={active ? '#243266' : '#999'}
            />
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  labelActive: {
    color: '#243266',
    fontWeight: '600',
  },
});

