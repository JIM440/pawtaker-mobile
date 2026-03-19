import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/src/lib/supabase/client';
import { useSignupStore } from '@/src/lib/store/signup.store';

export default function VerifyScreen() {
  const { t } = useTranslation();
  const { email } = useSignupStore();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleVerify = async () => {
    if (otp.length < 6) {
      setError(t('auth.signup.verify.invalidCode'));
      return;
    }
    setLoading(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    setLoading(false);

    if (verifyError) {
      setError(t('auth.signup.verify.invalidCode'));
      return;
    }

    // Trigger fires server-side to set is_email_verified = true
    router.push('/(auth)/signup/profile');
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setSuccessMsg(null);

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    setResending(false);

    if (resendError) {
      setError(t('common.error'));
    } else {
      setSuccessMsg(t('auth.signup.verify.resendSuccess'));
    }
  };

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <Text className="text-2xl font-bold text-text-primary mb-2">
        {t('auth.signup.verify.title')}
      </Text>
      <Text className="text-text-secondary mb-8">
        {t('auth.signup.verify.subtitle')} {email}
      </Text>

      {/* 6-digit OTP input */}
      <View className="mb-6">
        <TextInput
          className="border border-border rounded-xl px-4 py-4 bg-surface text-text-primary text-2xl text-center font-bold tracking-widest"
          value={otp}
          onChangeText={(v) => {
            setError(null);
            setOtp(v.replace(/[^0-9]/g, ''));
          }}
          keyboardType="number-pad"
          maxLength={8}
          placeholder={t('auth.signup.verify.codePlaceholder')}
          placeholderTextColor="#6B7280"
        />
      </View>

      {error && <Text className="text-danger text-sm mb-4 text-center">{error}</Text>}
      {successMsg && <Text className="text-success text-sm mb-4 text-center">{successMsg}</Text>}

      <TouchableOpacity
        className="bg-primary w-full py-4 rounded-xl items-center mb-4"
        onPress={handleVerify}
        disabled={loading}
      >
        <Text className="text-white font-semibold text-base">
          {loading ? t('auth.signup.verify.verifying') : t('auth.signup.verify.submit')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={resending}>
        <Text className="text-primary-light text-center text-base">
          {resending ? t('auth.signup.verify.resending') : t('auth.signup.verify.resend')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
