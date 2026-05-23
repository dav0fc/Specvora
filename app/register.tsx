import { useState } from 'react';
import {
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { registerUser } from '../services/authService';

export default function RegisterScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha nome, email e senha.');
      return;
    }

    try {
      await registerUser(email.trim(), password, name.trim());
      Alert.alert('Sucesso', 'Usuário cadastrado com sucesso.');
      router.back();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível cadastrar.';

      Alert.alert('Erro ao cadastrar', message);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F5F8FC]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 items-center justify-center px-6">
        <View
          className={`${
            isTablet ? 'w-3/5' : 'w-full'
          } rounded-3xl border border-[#D8E3F2] bg-white p-6`}
        >
          <Text className="mb-6 text-3xl font-bold text-[#00142E]">Cadastro</Text>

          <TextInput
            placeholder="Nome"
            value={name}
            onChangeText={setName}
            className="mb-3 rounded-2xl border border-[#D8E3F2] bg-[#F5F8FC] px-4 py-4 text-base text-[#00142E]"
            placeholderTextColor="#7C93AF"
          />

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

          <Button title="Cadastrar" onPress={handleRegister} color="#00095B" />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
