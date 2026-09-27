import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resetUserPassword, translateAuthError } from '../services/authService';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

type Step = 'form' | 'sent';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleResetPassword() {
    if (submitting) return;

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Alert.alert('Atenção', 'Informe seu email.');
      return;
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      Alert.alert('Atenção', 'Informe um email válido.');
      return;
    }

    setSubmitting(true);

    try {
      await resetUserPassword(trimmedEmail);
      setSentEmail(trimmedEmail);
      setStep('sent');
    } catch (error) {
      Alert.alert('Erro ao enviar email', translateAuthError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F5F8FC]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView
        className="flex-1 items-center justify-center px-6"
        edges={['top']}
      >
        <View
          className={`${
            isTablet ? 'w-3/5' : 'w-full'
          } rounded-3xl border border-[#D8E3F2] bg-white p-6`}
        >
          {step === 'form' ? (
            <>
              <Text className="mb-6 text-3xl font-bold text-[#00142E]">
                Recuperar Senha
              </Text>

              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                accessibilityLabel="Email"
                className="mb-3 rounded-2xl border border-[#D8E3F2] bg-[#F5F8FC] px-4 py-4 text-base text-[#00142E]"
                placeholderTextColor="#7C93AF"
              />

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Enviar email de recuperação"
                onPress={handleResetPassword}
                className="rounded-2xl bg-[#00095B] py-4"
              >
                <Text className="text-center text-base font-bold text-white">
                  {submitting ? 'Enviando…' : 'Enviar'}
                </Text>
              </TouchableOpacity>

              <Text className="mt-4 text-center text-sm text-[#7C93AF]">
                Você receberá um link de redefinição de senha no seu e-mail.
              </Text>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Voltar para o login"
                onPress={() => router.back()}
              >
                <Text className="mt-5 text-center text-base font-semibold text-[#00095B]">
                  Voltar
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View className="mb-4 items-center">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-[#00095B]">
                  <Text className="text-3xl text-white">✓</Text>
                </View>
              </View>

              <Text className="mb-2 text-center text-3xl font-bold text-[#00142E]">
                Email enviado!
              </Text>

              <Text className="mb-1 text-center text-base text-[#00142E]">
                Enviamos um link de redefinição de senha para{' '}
                <Text className="font-semibold">{sentEmail}</Text>.
              </Text>

              <Text className="mb-6 text-center text-sm text-[#7C93AF]">
                Toque no link para definir sua nova senha. Se não encontrar o
                e-mail, verifique a caixa de spam.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Voltar para o login"
                onPress={() => router.back()}
                className="rounded-2xl bg-[#00095B] py-4"
              >
                <Text className="text-center text-base font-bold text-white">
                  Voltar para o login
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
