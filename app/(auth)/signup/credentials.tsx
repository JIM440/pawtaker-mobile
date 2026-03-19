import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/src/lib/supabase/client';
import { useSignupStore } from '@/src/lib/store/signup.store';
import { TextField } from '@/src/shared/components/forms/TextField';

export default function SignupCredentialsScreen() {
  const { t } = useTranslation();
  const { setCredentials } = useSignupStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setError(null);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError(t('errors.required'));
      return;
    }
    if (password.length < 8) {
      setError(t('errors.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('errors.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          has_had_pet: false, // updated in declaration step
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Save to Zustand for use in later steps
    setCredentials(fullName.trim(), email.trim(), password);

    router.push('/(auth)/signup/verify');
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-6 justify-center flex-grow"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-2xl font-bold text-text-primary mb-8">
        {t('auth.signup.credentials.title')}
      </Text>

      <TextField
        label={t('auth.signup.credentials.nameLabel')}
        value={fullName}
        onChangeText={setFullName}
        placeholder={t('auth.signup.credentials.namePlaceholder')}
        autoCapitalize="words"
      />
      <TextField
        label={t('auth.signup.credentials.emailLabel')}
        value={email}
        onChangeText={setEmail}
        placeholder={t('auth.signup.credentials.emailPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField
        label={t('auth.signup.credentials.passwordLabel')}
        value={password}
        onChangeText={setPassword}
        placeholder={t('auth.signup.credentials.passwordPlaceholder')}
        secureTextEntry
      />
      <TextField
        label={t('auth.signup.credentials.confirmPasswordLabel')}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder={t('auth.signup.credentials.confirmPasswordPlaceholder')}
        secureTextEntry
      />

      {error && (
        <Text className="text-danger text-sm mb-4">{error}</Text>
      )}

      <TouchableOpacity
        className="bg-primary w-full py-4 rounded-xl items-center mt-2"
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text className="text-white font-semibold text-base">
          {loading ? t('common.loading') : t('auth.signup.credentials.submit')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-4"
        onPress={() => router.push('/(auth)/login')}
      >
        <Text className="text-primary-light text-center text-base">
          {t('auth.signup.credentials.alreadyHaveAccount')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
