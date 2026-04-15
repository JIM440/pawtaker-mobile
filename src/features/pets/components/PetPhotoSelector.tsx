import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { Camera } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

interface PetPhotoSelectorProps {
    photos: string[];
    setPhotos: React.Dispatch<React.SetStateAction<string[]>>;
}

const SCREEN_WIDTH = Dimensions.get("window").width;

export function PetPhotoSelector({
    photos,
    setPhotos,
}: PetPhotoSelectorProps) {
    const { t } = useTranslation();
    const { resolvedTheme } = useThemeStore();
    const colors = Colors[resolvedTheme];

    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [permissionModal, setPermissionModal] = React.useState<{
        visible: boolean;
        message: string;
    }>({ visible: false, message: "" });

    const showPermissionModal = (message: string) =>
        setPermissionModal({ visible: true, message });
    const hidePermissionModal = () =>
        setPermissionModal((s) => ({ ...s, visible: false }));

    const handlePickImages = async () => {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            showPermissionModal(
                t(
                    "pets.edit.galleryPermissionDenied",
                    "Photo library access is required to select pet photos. Please enable it in your device settings.",
                ),
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 0,
            orderedSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            const uris = result.assets.map((a) => a.uri);
            setPhotos((prev) => [...prev, ...uris]);
        }
    };

    const handleTakePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            showPermissionModal(
                t(
                    "pets.edit.cameraPermissionDenied",
                    "Camera access is required to take pet photos. Please enable it in your device settings.",
                ),
            );
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled) {
            const uris = result.assets.map((a) => a.uri);
            setPhotos((prev) => [...prev, ...uris]);
        }
    };

    const removePhoto = (uri: string) => {
        setPhotos((prev) => prev.filter((p) => p !== uri));
    };

    return (
        <View style={styles.container}>
            {/* Photo Card */}
            <View
                style={[
                    styles.photoCard,
                    {
                        backgroundColor: colors.surfaceContainerHighest,
                        borderColor: colors.outlineVariant,
                        borderStyle: 'dashed'
                    },
                ]}
            >
                {photos.length === 0 ? (
                    <TouchableOpacity
                        onPress={handlePickImages}
                        style={styles.emptyPhotoBtn}
                    >
                        <AppText
                            variant="body"
                            color={colors.primary}
                            style={{ textAlign: "center" }}
                        >
                            {t("pets.edit.addPhotos", "+ Add pet photos")}
                        </AppText>
                    </TouchableOpacity>
                ) : (
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        bounces={false}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(
                                e.nativeEvent.contentOffset.x /
                                e.nativeEvent.layoutMeasurement.width
                            );
                            setCurrentIndex(index);
                        }}
                    >
                        {photos.map((uri, slideIndex) => (
                            <View
                                key={`${slideIndex}:${uri}`}
                                style={styles.carouselSlide}
                            >
                                <AppImage
                                    source={{ uri }}
                                    style={styles.carouselImage}
                                    contentFit="cover"
                                />

                                {/* Close button */}
                                <TouchableOpacity
                                    style={[
                                        styles.closeBtn,
                                        { backgroundColor: colors.surfaceContainerHighest },
                                    ]}
                                    onPress={() => removePhoto(uri)}
                                >
                                    <AppText color={colors.onSurface}>✕</AppText>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* Counter */}
            {photos.length > 0 && (
                <View
                    style={[
                        styles.counter,
                        { backgroundColor: colors.surfaceContainerHighest },
                    ]}
                >
                    <AppText variant="caption" color={colors.onSurface}>
                        {currentIndex + 1} / {photos.length}
                    </AppText>
                </View>
            )}

            {/* Add more */}
            {photos.length > 0 && (
                <TouchableOpacity
                    onPress={handlePickImages}
                    style={[
                        styles.addMoreBtn,
                        { borderColor: colors.outlineVariant },
                    ]}
                >
                    <AppText variant="body" color={colors.primary}>
                        + Add more
                    </AppText>
                </TouchableOpacity>
            )}

            {/* Take photo */}
            <TouchableOpacity
                style={[
                    styles.takePhotosBtn,
                    { borderColor: colors.outlineVariant },
                ]}
                activeOpacity={0.9}
                onPress={handleTakePhoto}
            >
                <Camera size={18} color={colors.primary} />
                <AppText
                    variant="body"
                    color={colors.primary}
                    style={{ marginLeft: 8 }}
                >
                    {t("pets.edit.takeNewPhotos", "or take new photos")}
                </AppText>
            </TouchableOpacity>

            {/* Permission denied modal */}
            <FeedbackModal
                visible={permissionModal.visible}
                title={t("common.permissionRequired", "Permission Required")}
                description={permissionModal.message}
                primaryLabel={t("common.openSettings", "Open Settings")}
                onPrimary={() => {
                    hidePermissionModal();
                    void Linking.openSettings();
                }}
                secondaryLabel={t("common.cancel", "Cancel")}
                onSecondary={hidePermissionModal}
                onRequestClose={hidePermissionModal}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 12,
        marginBottom: 16,
    },

    photoCard: {
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: "hidden",
        height: 240,
        justifyContent: "center",
    },

    emptyPhotoBtn: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    carouselSlide: {
        width: SCREEN_WIDTH - 32, // matches parent padding
        height: 240,
    },

    carouselImage: {
        width: "100%",
        height: "100%",
    },

    closeBtn: {
        position: "absolute",
        top: 10,
        right: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },

    counter: {
        alignSelf: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },

    addMoreBtn: {
        borderWidth: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
    },

    takePhotosBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        borderWidth: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
});
