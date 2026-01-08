import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { router } from 'expo-router';

export default function MemberScreen() {
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {user && (
          <>
            <View style={styles.profileSection}>
              <Text style={styles.label}>氏名</Text>
              <Text style={styles.value}>{user.full_name}</Text>
            </View>
            <View style={styles.profileSection}>
              <Text style={styles.label}>メールアドレス</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
            {user.company_name && (
              <View style={styles.profileSection}>
                <Text style={styles.label}>会社名</Text>
                <Text style={styles.value}>{user.company_name}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/(tabs)/member/edit')}
            >
              <Text style={styles.editButtonText}>プロフィール編集</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Text style={styles.signOutButtonText}>ログアウト</Text>
            </TouchableOpacity>
          </>
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
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#243266',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  signOutButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

