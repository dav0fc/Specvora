import '../styles/global.css';

import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F5F8FC' },
      }}
    />
  );
}
