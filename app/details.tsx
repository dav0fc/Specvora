import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

import { isAuthenticated } from '../services/authService';

export default function DetailsScreen() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/home');
      return;
    }

    router.replace('/');
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-[#F5F8FC]">
      <ActivityIndicator color="#00095B" />
    </View>
  );
}
