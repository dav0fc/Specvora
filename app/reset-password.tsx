import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

import {
  checkPasswordResetCode,
  confirmNewPassword,
  translateAuthError,
} from '../services/authService';

type Step = 'loading' | 'invalid' | 'form' | 'success';

// Extrai o `oobCode` (código de ação do Firebase) da URL do deep link.
function extractOobCode(url: string | null): string | null {
  if (!url) return null;

  try {
    return new URL(url).searchParams.get('oobCode');
  } catch {
    return null;
  }
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { oobCode: oobCodeParam } = useLocalSearchParams<{ oobCode?: string }>();

  const [step, setStep] = useState<Step>('loading');
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invalidMessage, setInvalidMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Resolve o `oobCode`: query da rota (vinda do layout) > URL inicial do app.
  useEffect(() => {
    let active = true;

    async function resolveOobCode() {
      if (oobCodeParam) {
        setOobCode(oobCodeParam);
        return;
      }

      const initialUrl = await Linking.getInitialURL();
      if (active) {
        setOobCode(extractOobCode(initialUrl));
      }
    }

    resolveOobCode();

    return () => {
      active = false;
    };
  }, [oobCodeParam]);

  // Valida o código e prepara o formulário de nova senha.
  useEffect(() => {
    if (!oobCode) {
      setStep('invalid');
      return;
    }

    let active = true;

    async function checkCode() {
      try {
        const emailFromCode = await checkPasswordResetCode(oobCode);

        if (active) {
          setEmail(emailFromCode ?? '');
          setStep('form');
        }
      } catch (error) {
        if (active) {
          setInvalidMessage(translateAuthError(error));
          setStep('invalid');
        }
      }
    }

    checkCode();

    return () => {
      active = false;
    };
  }, [oobCode]);

  async function handleConfirmPassword() {
    if (submitting || !oobCode) return;

    if (newPassword.length < 6) {
      Alert.alert('Atenção', 'A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas informadas não conferem.');
      return;
    }

    setSubmitting(true);

    try {
      await confirmNewPassword(oobCode, newPassword);
      setStep('success');
    } catch (error) {
      Alert.alert('Erro ao redefinir senha', translateAuthError(error));
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
          {step === 'loading' && (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#00095B" />
              <Text className="mt-4 text-base text-[#7C93AF]">
                Verificando o link de recuperação…
              </Text>
            </View>
          )}

          {step === 'invalid' && (
            <>
              <Text className="mb-4 text-center text-3xl font-bold text-[#00142E]">
                Link inválido
              </Text>

              <Text className="mb-6 text-center text-base text-[#00142E]">
                {invalidMessage ||
                  'Este link não é de recuperação de senha ou está incompleto.'}
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Solicitar novo link"
                onPress={() => router.replace('/forgot-password')}
                className="rounded-2xl bg-[#00095B] py-4"
              >
                <Text className="text-center text-base font-bold text-white">
                  Solicitar novo link
                </Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'form' && (
            <>
              <Text className="mb-2 text-3xl font-bold text-[#00142E]">
                Definir nova senha
              </Text>

              {email ? (
                <Text className="mb-5 text-center text-sm text-[#7C93AF]">
                  Conta: <Text className="font-semibold">{email}</Text>
                </Text>
              ) : (
                <View className="mb-5" />
              )}

              <TextInput
                placeholder="Nova senha"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                accessibilityLabel="Nova senha"
                className="mb-3 rounded-2xl border border-[#D8E3F2] bg-[#F5F8FC] px-4 py-4 text-base text-[#00142E]"
                placeholderTextColor="#7C93AF"
              />

              <TextInput
                placeholder="Confirmar nova senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                accessibilityLabel="Confirmar nova senha"
                className="mb-4 rounded-2xl border border-[#D8E3F2] bg-[#F5F8FC] px-4 py-4 text-base text-[#00142E]"
                placeholderTextColor="#7C93AF"
              />

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Redefinir senha"
                onPress={handleConfirmPassword}
                className="rounded-2xl bg-[#00095B] py-4"
              >
                <Text className="text-center text-base font-bold text-white">
                  {submitting ? 'Redefinindo…' : 'Redefinir senha'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'success' && (
            <>
              <View className="mb-4 items-center">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-[#00095B]">
                  <Text className="text-3xl text-white">✓</Text>
                </View>
              </View>

              <Text className="mb-2 text-center text-3xl font-bold text-[#00142E]">
                Senha redefinida!
              </Text>

              <Text className="mb-6 text-center text-base text-[#7C93AF]">
                Sua nova senha foi definida. Faça login para continuar.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Fazer login"
                onPress={() => router.replace('/')}
                className="rounded-2xl bg-[#00095B] py-4"
              >
                <Text className="text-center text-base font-bold text-white">
                  Fazer login
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
