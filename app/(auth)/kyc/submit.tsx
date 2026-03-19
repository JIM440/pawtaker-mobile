import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/src/lib/supabase/client';
import { useAuthStore } from '@/src/lib/store/auth.store';
import { uploadToCloudinary } from '@/src/lib/cloudinary/upload';

type DocType = 'passport' | 'drivers_license' | 'national_id';

function ImageSlot({
  label,
  uri,
  onPick,
  onCamera,
}: {
  label: string;
  uri: string | null;
  onPick: () => void;
  onCamera: () => void;
}) {
  return (
    <View className="mb-4">
      <Text className="text-sm text-text-secondary mb-1">{label}</Text>
      <View className="border border-dashed border-border rounded-xl bg-surface overflow-hidden">
        {uri ? (
          <Image
            source={{ uri }}
            className="w-full h-40"
            resizeMode="cover"
          />
        ) : (
          <View className="h-40 items-center justify-center">
            <Text className="text-text-secondary text-sm mb-3">No image selected</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="bg-primary px-4 py-2 rounded-lg"
                onPress={onPick}
              >
                <Text className="text-white text-sm font-medium">Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-surface border border-primary px-4 py-2 rounded-lg"
                onPress={onCamera}
              >
                <Text className="text-primary text-sm font-medium">Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {uri && (
          <View className="flex-row justify-center gap-3 py-2 bg-black/10">
            <TouchableOpacity onPress={onPick}>
              <Text className="text-white text-xs font-medium">Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCamera}>
              <Text className="text-white text-xs font-medium">Camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export default function KYCSubmitScreen() {
  const { t } = useTranslation();
  const { session, fetchProfile } = useAuthStore();

  const [docType, setDocType] = useState<DocType | null>(null);
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pickImage = async (setter: (uri: string) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Camera roll permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setter(result.assets[0].uri);
    }
  };

  const takePhoto = async (setter: (uri: string) => void) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setError('Camera permission is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setter(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!docType) {
      setError('Please select a document type.');
      return;
    }
    if (!frontUri || !selfieUri) {
      setError('Please upload the required images.');
      return;
    }
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      setProgress('Uploading front image...');
      const front = await uploadToCloudinary(frontUri);

      let back: { secure_url: string; public_id: string } | null = null;
      if (backUri) {
        setProgress('Uploading back image...');
        back = await uploadToCloudinary(backUri);
      }

      setProgress('Uploading selfie...');
      const selfie = await uploadToCloudinary(selfieUri);

      setProgress('Saving submission...');

      const { error: insertError } = await supabase
        .from('kyc_submissions')
        .insert({
          user_id: session.user.id,
          document_type: docType,
          front_url: front.secure_url,
          back_url: back?.secure_url ?? null,
          selfie_url: selfie.secure_url,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('users')
        .update({ kyc_status: 'pending' })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      await fetchProfile(session.user.id);

      router.replace('/(auth)/kyc/pending');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const docTypes: { value: DocType; label: string }[] = [
    { value: 'passport', label: t('auth.kyc.submit.passport') },
    { value: 'drivers_license', label: t('auth.kyc.submit.driversLicense') },
    { value: 'national_id', label: t('auth.kyc.submit.nationalId') },
  ];

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-6 pt-12 pb-8"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-2xl font-bold text-text-primary mb-2">
        {t('auth.kyc.submit.title')}
      </Text>
      <Text className="text-text-secondary mb-8">
        {t('auth.kyc.submit.subtitle')}
      </Text>

      {/* Document type selector */}
      <Text className="text-sm text-text-secondary mb-2">{t('auth.kyc.submit.docType')}</Text>
      <View className="flex-row gap-2 mb-6 flex-wrap">
        {docTypes.map((dt) => (
          <TouchableOpacity
            key={dt.value}
            onPress={() => setDocType(dt.value)}
            className={`px-4 py-2 rounded-full border ${
              docType === dt.value
                ? 'bg-primary border-primary'
                : 'bg-surface border-border'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                docType === dt.value ? 'text-white' : 'text-text-secondary'
              }`}
            >
              {dt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ID front */}
      <ImageSlot
        label={t('auth.kyc.submit.uploadFront')}
        uri={frontUri}
        onPick={() => pickImage(setFrontUri)}
        onCamera={() => takePhoto(setFrontUri)}
      />

      {/* ID back (optional for passport) */}
      {docType !== 'passport' && (
        <ImageSlot
          label={t('auth.kyc.submit.uploadBack')}
          uri={backUri}
          onPick={() => pickImage(setBackUri)}
          onCamera={() => takePhoto(setBackUri)}
        />
      )}

      {/* Selfie */}
      <ImageSlot
        label={t('auth.kyc.submit.uploadSelfie')}
        uri={selfieUri}
        onPick={() => pickImage(setSelfieUri)}
        onCamera={() => takePhoto(setSelfieUri)}
      />

      {error && (
        <Text className="text-danger text-sm mb-4">{error}</Text>
      )}

      {loading && progress ? (
        <View className="flex-row items-center gap-2 mb-4">
          <ActivityIndicator size="small" color="#8c4a60" />
          <Text className="text-text-secondary text-sm">{progress}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        className={`w-full py-4 rounded-xl items-center ${loading ? 'bg-border' : 'bg-primary'}`}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text className="text-white font-semibold text-base">
          {loading ? t('common.loading') : t('auth.kyc.submit.submit')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
