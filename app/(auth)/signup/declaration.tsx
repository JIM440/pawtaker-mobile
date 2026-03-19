import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/src/lib/supabase/client';
import { useSignupStore } from '@/src/lib/store/signup.store';
import { useAuthStore } from '@/src/lib/store/auth.store';

function Checkbox({
  checked,
  onPress,
}: {
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
        checked ? 'bg-primary border-primary' : 'border-border bg-surface'
      }`}
    >
      {checked && <Text className="text-white text-xs font-bold">✓</Text>}
    </TouchableOpacity>
  );
}

export default function SignupDeclarationScreen() {
  const { t } = useTranslation();
  const { displayName, location, bio, setDeclaration, clearSignup } = useSignupStore();
  const { session, fetchProfile } = useAuthStore();

  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [checked3, setChecked3] = useState(false);
  const [hasHadPet, setHasHadPet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allChecked = checked1 && checked2 && checked3;

  const handleSubmit = async () => {
    if (!allChecked) {
      setError(t('auth.signup.declaration.subtitle'));
      return;
    }
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);
    setDeclaration(true, hasHadPet);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name: displayName,
        bio: bio || null,
        city: location,
      })
      .eq('id', session.user.id);

    if (updateError) {
      setLoading(false);
      setError(t('common.error'));
      return;
    }

    // Refresh profile in auth store
    await fetchProfile(session.user.id);

    // Clear signup store — no longer needed
    clearSignup();

    setLoading(false);
    router.push('/(auth)/kyc/submit');
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-6 pt-12 pb-8 flex-grow"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-2xl font-bold text-text-primary mb-2">
        {t('auth.signup.declaration.title')}
      </Text>
      <Text className="text-text-secondary mb-8">
        {t('auth.signup.declaration.subtitle')}
      </Text>

      {/* Community standards checkboxes */}
      <View className="mb-6 gap-4">
        <TouchableOpacity
          className="flex-row items-start"
          onPress={() => setChecked1(!checked1)}
          activeOpacity={0.7}
        >
          <Checkbox checked={checked1} onPress={() => setChecked1(!checked1)} />
          <Text className="flex-1 text-sm text-text-secondary leading-5">
            {t('auth.signup.declaration.point1')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-start"
          onPress={() => setChecked2(!checked2)}
          activeOpacity={0.7}
        >
          <Checkbox checked={checked2} onPress={() => setChecked2(!checked2)} />
          <Text className="flex-1 text-sm text-text-secondary leading-5">
            {t('auth.signup.declaration.point2')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-start"
          onPress={() => setChecked3(!checked3)}
          activeOpacity={0.7}
        >
          <Checkbox checked={checked3} onPress={() => setChecked3(!checked3)} />
          <Text className="flex-1 text-sm text-text-secondary leading-5">
            {t('auth.signup.declaration.point3')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Has had pet toggle */}
      <TouchableOpacity
        className="flex-row items-center mb-8 p-4 bg-surface rounded-xl border border-border"
        onPress={() => setHasHadPet(!hasHadPet)}
        activeOpacity={0.7}
      >
        <Checkbox checked={hasHadPet} onPress={() => setHasHadPet(!hasHadPet)} />
        <Text className="flex-1 text-sm text-text-primary">
          {t('auth.signup.declaration.hasHadPet')}
        </Text>
      </TouchableOpacity>

      {error && (
        <Text className="text-danger text-sm mb-4">{error}</Text>
      )}

      <TouchableOpacity
        className={`w-full py-4 rounded-xl items-center ${allChecked ? 'bg-primary' : 'bg-border'}`}
        onPress={handleSubmit}
        disabled={loading || !allChecked}
      >
        <Text className="text-white font-semibold text-base">
          {loading ? t('common.loading') : t('auth.signup.declaration.submit')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
