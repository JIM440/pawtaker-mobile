import { AppText } from "@/src/shared/components/ui/AppText";
import { Calendar, Clock, Heart, MapPin } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type Props = {
  colors: Record<string, string>;
  petName: string;
  breed: string;
  petType: string;
  dateRange?: string;
  time?: string;
  careType?: string;
  location?: string;
  distance?: string;
  description?: string;
  rightNode?: React.ReactNode;
  showFavorite?: boolean;
  isFavorite?: boolean;
  favoriteDisabled?: boolean;
  onFavoritePress?: () => void;
  onNamePress?: () => void;
  isSeeking?: boolean;
};

export function PetDetailHeaderSection({
  colors,
  petName,
  breed,
  petType,
  dateRange,
  time,
  careType,
  location,
  distance,
  description,
  rightNode,
  showFavorite = false,
  isFavorite = false,
  favoriteDisabled = false,
  onFavoritePress,
  onNamePress,
  isSeeking = false,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <View style={styles.nameRow}>
          <TouchableOpacity
            activeOpacity={onNamePress ? 0.7 : 1}
            disabled={!onNamePress}
            onPress={onNamePress}
          >
            <AppText variant="headline" style={styles.petName} color={colors.onSurface}>
              {petName}
            </AppText>
          </TouchableOpacity>
          {isSeeking && (
            <View
              style={[
                styles.seekingBadge,
                { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
            >
              <AppText
                variant="caption"
                style={{ fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}
                color={colors.onTertiary}
              >
                Seeking
              </AppText>
            </View>
          )}
          <View style={styles.breedRow}>
            <AppText variant="caption" color={colors.onSurface}>
              {breed}
            </AppText>
            <AppText variant="caption" color={colors.onSurfaceVariant}>
              {" • "}
            </AppText>
            <AppText variant="caption" color={colors.onSurfaceVariant}>
              {petType}
            </AppText>
          </View>
        </View>
        {showFavorite ? (
          <TouchableOpacity
            onPress={onFavoritePress}
            disabled={favoriteDisabled}
            style={[styles.favButton, { backgroundColor: colors.surfaceContainer }]}
          >
            <Heart
              size={20}
              color={isFavorite ? colors.primary : colors.onSurfaceVariant}
              fill={isFavorite ? colors.primary : "transparent"}
            />
          </TouchableOpacity>
        ) : (
          rightNode
        )}
      </View>

      {dateRange || time || careType ? (
        <View style={styles.metaRow}>
          {dateRange ? (
            <View style={styles.metaItem}>
              <Calendar size={16} color={colors.onSurfaceVariant} />
              <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.metaText}>
                {dateRange}
              </AppText>
            </View>
          ) : null}
          {time ? (
            <>
              <AppText variant="caption" color={colors.onSurfaceVariant}>
                {" • "}
              </AppText>
              <View style={styles.metaItem}>
                <Clock size={16} color={colors.onSurfaceVariant} />
                <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.metaText}>
                  {time}
                </AppText>
              </View>
            </>
          ) : null}
          {careType ? (
            <>
              <AppText variant="caption" color={colors.onSurfaceVariant}>
                {" • "}
              </AppText>
              <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.metaText}>
                {careType}
              </AppText>
            </>
          ) : null}
        </View>
      ) : null}

      {location ? (
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MapPin size={16} color={colors.onSurfaceVariant} />
            <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.metaText}>
              {location}
            </AppText>
          </View>
          {distance ? (
            <>
              <AppText variant="caption" color={colors.onSurfaceVariant}>
                {" • "}
              </AppText>
              <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.metaText}>
                {distance}
              </AppText>
            </>
          ) : null}
        </View>
      ) : null}

      {description?.trim() ? (
        <AppText variant="body" color={colors.onSurfaceVariant} style={styles.description}>
          {description}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    flex: 1,
  },
  petName: {
    fontSize: 22,
    letterSpacing: -0.1,
    lineHeight: 28,
  },
  breedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 2,
  },
  favButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 2,
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 16,
  },
  description: {
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 13,
    fontSize: 11,
  },
  seekingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginLeft: 4,
    marginBottom: 4,
  },
});
