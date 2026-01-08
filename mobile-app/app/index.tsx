import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized) return;

    if (user) {
      router.replace('/(tabs)/news');
    } else {
      router.replace('/(auth)/login');
    }
  }, [user, initialized, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#243266" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

