import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import {
  CalendarDays,
  Clock3,
  Edit3,
  PawPrint,
} from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Switch, TouchableOpacity, View } from "react-native";

export function EditAvailabilityTab() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [available, setAvailable] = useState(true);
  const [service, setService] = useState<"daytime" | "playwalk">("daytime");
  const [days, setDays] = useState<string[]>(["Sat", "Sun"]);
  const [timeRange, setTimeRange] = useState("8 AM - 9 PM");
  const [petOwner, setPetOwner] = useState<"yes" | "no">("yes");
  const [yardType, setYardType] = useState("fenced yard");

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <AppText variant="body" color={colors.onSurface}>
          Available
        </AppText>
        <Switch
          value={available}
          onValueChange={setAvailable}
          trackColor={{
            false: colors.surfaceContainerHighest,
            true: colors.primary,
          }}
          thumbColor={colors.surface}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.serviceRow}>
          <TouchableOpacity
            style={[
              styles.servicePill,
              {
                backgroundColor:
                  service === "daytime"
                    ? colors.primary
                    : colors.surfaceContainerHighest,
              },
            ]}
            activeOpacity={0.9}
            onPress={() => setService("daytime")}
          >
            <PawPrint
              size={18}
              color={service === "daytime" ? colors.onPrimary : colors.primary}
            />
            <AppText
              variant="caption"
              color={
                service === "daytime" ? colors.onPrimary : colors.onSurface
              }
              style={styles.serviceLabel}
            >
              Daytime
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.servicePill,
              {
                backgroundColor:
                  service === "playwalk"
                    ? colors.primary
                    : colors.surfaceContainerHighest,
              },
            ]}
            activeOpacity={0.9}
            onPress={() => setService("playwalk")}
          >
            <PawPrint
              size={18}
              color={service === "playwalk" ? colors.onPrimary : colors.primary}
            />
            <AppText
              variant="caption"
              color={
                service === "playwalk" ? colors.onPrimary : colors.onSurface
              }
              style={styles.serviceLabel}
            >
              Play/walk
            </AppText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.fieldRow} activeOpacity={0.9}>
          <View style={styles.fieldLeft}>
            <CalendarDays size={18} color={colors.onSurfaceVariant} />
            <AppText
              variant="body"
              color={colors.onSurface}
              style={styles.fieldText}
            >
              Every {days.join(", ")}
            </AppText>
          </View>
          <Edit3 size={16} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.fieldRow} activeOpacity={0.9}>
          <View style={styles.fieldLeft}>
            <Clock3 size={18} color={colors.onSurfaceVariant} />
            <AppText
              variant="body"
              color={colors.onSurface}
              style={styles.fieldText}
            >
              {timeRange}
            </AppText>
          </View>
          <Edit3 size={16} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

        <View style={styles.inlineRow}>
          <View style={styles.inlineCol}>
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={{ marginBottom: 4 }}
            >
              Pet owner
            </AppText>
            <View style={styles.inlineChips}>
              {(["yes", "no"] as const).map((opt) => {
                const active = petOwner === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.smallPill,
                      {
                        backgroundColor: active
                          ? colors.primary
                          : colors.surfaceContainerHighest,
                      },
                    ]}
                    onPress={() => setPetOwner(opt)}
                  >
                    <AppText
                      variant="caption"
                      color={
                        active ? colors.onPrimary : colors.onSurfaceVariant
                      }
                    >
                      {opt === "yes" ? "Yes" : "No"}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inlineCol}>
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={{ marginBottom: 4 }}
            >
              Yard type
            </AppText>
            <View style={styles.inlineChips}>
              {["none needed", "fenced yard"].map((opt) => {
                const active = yardType === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.smallPill,
                      {
                        backgroundColor: active
                          ? colors.primary
                          : colors.surfaceContainerHighest,
                      },
                    ]}
                    onPress={() => setYardType(opt)}
                  >
                    <AppText
                      variant="caption"
                      color={
                        active ? colors.onPrimary : colors.onSurfaceVariant
                      }
                    >
                      {opt}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.noteCard,
          {
            backgroundColor: colors.surfaceContainerLowest,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <AppText
          variant="caption"
          color={colors.onSurfaceVariant}
          style={{ marginBottom: 8 }}
        >
          Short note
        </AppText>
        <AppText variant="body" color={colors.onSurfaceVariant}>
          Hi there! I'm Bob, a lifelong pet lover with years of experience
          caring for energetic pups and senior cats alike.
        </AppText>
      </View>

      <Button label="Save" fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  section: {
    marginTop: 24,
    gap: 16,
  },
  serviceRow: {
    flexDirection: "row",
    gap: 12,
  },
  servicePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    gap: 8,
  },
  serviceLabel: {
    fontSize: 13,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  fieldLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  fieldText: {
    fontSize: 14,
  },
  inlineRow: {
    flexDirection: "row",
    gap: 16,
  },
  inlineCol: {
    flex: 1,
  },
  inlineChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  smallPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  noteCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
