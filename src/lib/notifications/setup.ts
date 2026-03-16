import { Platform } from 'react-native';

/**
 * Request push notification permissions and return the Expo push token.
 * To be called after user is authenticated.
 */
export async function setupNotifications(): Promise<string | null> {
  // TODO: Install expo-notifications and implement
  // import * as Notifications from 'expo-notifications';
  // const { status } = await Notifications.requestPermissionsAsync();
  // if (status !== 'granted') return null;
  // const token = await Notifications.getExpoPushTokenAsync();
  // return token.data;

  if (Platform.OS === 'web') return null;

  console.log('[Notifications] Setup stub — install expo-notifications to enable');
  return null;
}
