import { Input } from "@/src/shared/components/ui/Input";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Search } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

type Props = {
  kind: string | null;
  breed: string | null;
  breedQuery: string;
  filteredBreeds: string[];
  colors: Record<string, string>;
  styles: any;
  t: (key: string, fallback?: string) => string;
  setBreedQuery: (v: string) => void;
  setBreed: (v: string) => void;
};

export function PetBreedStep({
  kind,
  breed,
  breedQuery,
  filteredBreeds,
  colors,
  styles,
  t,
  setBreedQuery,
  setBreed,
}: Props) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="title" color={colors.onSurface} style={styles.question}>
        What breed is your pet?
      </AppText>
      {kind ? (
        <View style={{ marginBottom: 16 }}>
          <AppText style={{ color: colors.onSurface, fontSize: 12 }}>
            Your pet is a:{" "}
            <Text
              style={{
                lineHeight: 0,
                borderRadius: 8,
                color: colors.primary,
                fontSize: 12,
              }}
            >
              {kind}
            </Text>
          </AppText>
        </View>
      ) : null}
      <Input
        placeholder={t("pets.add.breedSearch", "Search pet breed")}
        value={breedQuery}
        onChangeText={setBreedQuery}
        rightIcon={<Search size={22} color={colors.onSurfaceVariant} />}
        containerStyle={{
          ...styles.searchField,
          backgroundColor: colors.surfaceContainerLow,
          marginBottom: 12,
        }}
        inputStyle={{ paddingTop: 0, paddingBottom: 0 }}
        onFocus={() => {}}
        onBlur={() => {}}
      />
      <ScrollView
        style={[
          styles.breedList,
          {
            backgroundColor: colors.surfaceBright,
            borderColor: colors.outlineVariant,
            maxHeight: 320,
          },
        ]}
        contentContainerStyle={{ paddingVertical: 0 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {filteredBreeds.map((item, index) => {
          const active = breed === item;
          const isLast = index === filteredBreeds.length - 1;
          return (
            <TouchableOpacity
              key={item}
              style={{
                ...styles.breedRow,
                backgroundColor: active
                  ? colors.surfaceContainer
                  : colors.surfaceBright,
                borderBottomWidth: isLast ? 0 : 0.8,
                borderBottomColor: colors.outlineVariant,
              }}
              onPress={() => setBreed(item)}
            >
              <AppText
                variant="body"
                color={colors.onSurfaceVariant}
                style={{ paddingHorizontal: 16 }}
              >
                {item}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </ScrollView>
  );
}
