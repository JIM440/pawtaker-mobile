import { useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/src/lib/supabase/client';
import { useSignupStore } from '@/src/lib/store/signup.store';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { PageContainer } from '@/src/shared/components/layout/PageContainer';
import { BackHeader } from '@/src/shared/components/layout/BackHeader';
import { AppText } from '@/src/shared/components/ui/AppText';
import { Button } from '@/src/shared/components/ui/Button';
import { OtpInput } from '@/src/shared/components/forms/OtpInput';

export default function VerifyScreen() {
  const { t } = useTranslation();
  const { email, clearSignup } = useSignupStore();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

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

    clearSignup();
    router.replace('/(private)/(tabs)');
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
    <PageContainer>
      <BackHeader className="px-0" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, paddingTop: 16 }}
      >
        <AppText
          variant="title"
          color={colors.onSurface}
          style={{ marginBottom: 8, fontSize: 32 }}
        >
          {t('auth.signup.verify.title')}
        </AppText>
        <AppText
          variant="body"
          color={colors.onSurfaceVariant}
          style={{ marginBottom: 8 }}
        >
          {t('auth.signup.verify.subtitle')}
        </AppText>
        <AppText
          variant="body"
          color={colors.onSurface}
          style={{ fontWeight: '700', marginBottom: 24 }}
        >
          {email}
        </AppText>

        <View style={{ width: '100%' }}>
          <OtpInput
            value={otp}
            onChangeText={(v) => {
              setError(null);
              setSuccessMsg(null);
              setOtp(v);
            }}
            error={error ?? undefined}
          />
        </View>

        {successMsg ? (
          <AppText
            variant="caption"
            color={colors.primary}
            style={{
              marginTop: 10,
              marginBottom: 16,
              textAlign: 'center',
              fontWeight: '600',
            }}
          >
            {successMsg}
          </AppText>
        ) : null}

        <View style={{ width: '100%', marginTop: 12 }}>
          <Button
            label={loading ? t('auth.signup.verify.verifying') : t('auth.signup.verify.submit')}
            onPress={handleVerify}
            loading={loading}
            disabled={loading || resending}
          />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 22 }}>
          <AppText variant="body" color={colors.onSurfaceVariant} style={{ marginRight: 4 }}>
            {t('auth.forgotPassword.resendPrefix')}
          </AppText>
          <TouchableOpacity onPress={handleResend} disabled={resending || loading}>
            <AppText
              variant="body"
              color={colors.onSurface}
              style={{ fontWeight: '700', opacity: resending || loading ? 0.6 : 1 }}
            >
              {resending ? t('auth.signup.verify.resending') : t('auth.signup.verify.resend')}
            </AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </PageContainer>
  );
}
