import '../styles/global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F5F8FC' },
      }}
    >
      <StatusBar style="dark" />
    </Stack>
  );
}
