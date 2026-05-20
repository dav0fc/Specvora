import { useState } from 'react';
import {
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { loginUser } from '../services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha email e senha.');
      return;
    }

    try {
      await loginUser(email.trim(), password);
      router.replace('/home');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível realizar o login.';

      Alert.alert('Erro ao entrar', message);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F5F8FC]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 items-center justify-center px-6">
        <View className={`${isTablet ? 'w-3/5' : 'w-full'} rounded-3xl border border-[#D8E3F2] bg-white p-6`}>
          <Text className="mb-6 text-3xl font-bold text-[#00142E]">Login</Text>

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="mb-3 rounded-2xl border border-[#D8E3F2] bg-[#F5F8FC] px-4 py-4 text-base text-[#00142E]"
            placeholderTextColor="#7C93AF"
          />

          <TextInput
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="mb-4 rounded-2xl border border-[#D8E3F2] bg-[#F5F8FC] px-4 py-4 text-base text-[#00142E]"
            placeholderTextColor="#7C93AF"
          />

          <Button title="Entrar" onPress={handleLogin} color="#00095B" />

          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text className="mt-5 text-base font-semibold text-[#00095B]">
              Criar conta?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/forgot-password')}>
            <Text className="mt-3 text-base font-semibold text-[#00095B]">
              Esqueci minha senha
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
