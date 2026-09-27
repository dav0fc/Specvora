import '../styles/global.css';

import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';

// Extrai o `oobCode` (código de ação do Firebase) da URL do deep link.
function extractOobCode(url: string | null): string | null {
  if (!url) return null;

  try {
    return new URL(url).searchParams.get('oobCode');
  } catch {
    return null;
  }
}

export default function RootLayout() {
  const router = useRouter();
  const lastOobCodeRef = useRef<string | null>(null);

  // Se o usuário tocar no link de recuperação do e-mail, o app é aberto
  // com o `oobCode` na URL. Aqui encaminhamos para a tela de redefinição
  // de senha (handleCodeInApp: true no sendPasswordResetEmail).
  useEffect(() => {
    function openResetPassword(url: string | null) {
      const oobCode = extractOobCode(url);

      if (!oobCode || lastOobCodeRef.current === oobCode) return;

      lastOobCodeRef.current = oobCode;
      router.replace(`/reset-password?oobCode=${encodeURIComponent(oobCode)}`);
    }

    // App aberto a partir do link do e-mail (cold start).
    Linking.getInitialURL().then(openResetPassword);

    // App em segundo plano e o usuário toca no link.
    const subscription = Linking.addEventListener('url', ({ url }) => {
      openResetPassword(url);
    });

    return () => subscription.remove();
  }, [router]);

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
