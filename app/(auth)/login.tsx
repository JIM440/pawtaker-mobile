import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/src/lib/supabase/client';
import { TextField } from '@/src/shared/components/forms/TextField';

export default function LoginScreen() {
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);

    if (!email || !password) {
      setError(t('errors.required'));
      return;
    }

    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(t('auth.login.invalidCredentials'));
    }
    // No navigation here — onAuthStateChange fires SIGNED_IN
    // and the root layout useEffect handles routing based on profile state
  };

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <Text className="text-2xl font-bold text-text-primary mb-8">{t('auth.login.title')}</Text>

      <TextField
        label={t('auth.login.emailLabel')}
        value={email}
        onChangeText={setEmail}
        placeholder={t('auth.login.emailPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField
        label={t('auth.login.passwordLabel')}
        value={password}
        onChangeText={setPassword}
        placeholder={t('auth.login.passwordPlaceholder')}
        secureTextEntry
      />

      {error && (
        <Text className="text-danger text-sm mb-4">{error}</Text>
      )}

      <TouchableOpacity
        className="bg-primary w-full py-4 rounded-xl items-center mb-4"
        onPress={handleSignIn}
        disabled={loading}
      >
        <Text className="text-white font-semibold text-base">
          {loading ? t('common.loading') : t('auth.login.submit')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
        <Text className="text-primary-light text-center text-sm mb-3">
          {t('auth.login.forgotPassword')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/signup/credentials')}>
        <Text className="text-primary-light text-center text-base">{t('auth.login.noAccount')}</Text>
      </TouchableOpacity>
    </View>
  );
}
