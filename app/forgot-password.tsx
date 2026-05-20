import { useState } from 'react';
import {
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { resetUserPassword } from '../services/authService';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');

  async function handleResetPassword() {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Informe seu email.');
      return;
    }

    try {
      await resetUserPassword(email.trim());
      Alert.alert(
        'Email enviado',
        'Enviamos as instruções de recuperação de senha para seu email.'
      );
      router.back();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível enviar o email.';

      Alert.alert('Erro ao enviar email', message);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F5F8FC]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 justify-center px-6">
        <View className="rounded-3xl border border-[#D8E3F2] bg-white p-6">
          <Text className="mb-6 text-3xl font-bold text-[#00142E]">
            Recuperar Senha
          </Text>

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="mb-4 rounded-2xl border border-[#D8E3F2] bg-[#F5F8FC] px-4 py-4 text-base text-[#00142E]"
            placeholderTextColor="#7C93AF"
          />

          <Button title="Enviar" onPress={handleResetPassword} color="#00095B" />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
