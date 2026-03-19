import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        ...(Platform.OS !== 'web' && { animation: 'slide_from_right' }),
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup/credentials" />
      <Stack.Screen name="signup/verify" />
      <Stack.Screen name="signup/profile" />
      <Stack.Screen name="signup/declaration" />
      <Stack.Screen name="kyc/submit" />
      <Stack.Screen name="kyc/pending" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
