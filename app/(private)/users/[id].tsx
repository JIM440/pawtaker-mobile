import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 pt-6">
        <Text className="text-xl font-bold text-text-primary mb-2">User Profile</Text>
        <Text className="text-text-secondary">ID: {id}</Text>
        {/* TODO: Public profile with VerifiedBadge, StarRating, reviews */}
      </View>
    </ScrollView>
  );
}
