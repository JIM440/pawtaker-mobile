import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React, { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

interface RangeSliderProps {
    min: number;
    max: number;
    step?: number;
    values: [number, number];
    onValuesChange: (values: [number, number]) => void;
}

export function RangeSlider({
    min,
    max,
    step = 1,
    values,
    onValuesChange,
}: RangeSliderProps) {
    const { resolvedTheme } = useThemeStore();
    const colors = Colors[resolvedTheme];

    const [containerWidth, setContainerWidth] = useState(0);
    const range = max - min;

    const leftX = useSharedValue(0);
    const rightX = useSharedValue(0);

    // Sync from props
    React.useEffect(() => {
        if (containerWidth > 0) {
            const oneStepWidth = containerWidth / range;
            leftX.value = (values[0] - min) * oneStepWidth;
            rightX.value = (values[1] - min) * oneStepWidth;
        }
    }, [values, containerWidth, min, range]);

    const onLayout = (event: LayoutChangeEvent) => {
        const width = event.nativeEvent.layout.width;
        if (width > 0) {
            setContainerWidth(width);
        }
    };

    const updateValues = (lx: number, rx: number) => {
        const oneStepWidth = containerWidth / range;
        const newMin = Math.max(min, Math.min(max, Math.round(lx / oneStepWidth) + min));
        const newMax = Math.max(min, Math.min(max, Math.round(rx / oneStepWidth) + min));

        if (newMin !== values[0] || newMax !== values[1]) {
            onValuesChange([newMin, newMax]);
        }
    };

    const panGesture = Gesture.Pan()
        .minPointers(1)
        .onUpdate((e) => {
            const touchX = e.x;
            const distLeft = Math.abs(touchX - leftX.value);
            const distRight = Math.abs(touchX - rightX.value);

            if (distLeft < distRight) {
                // Closer to left handle
                const newLX = Math.max(0, Math.min(rightX.value - (containerWidth / range), touchX));
                leftX.value = newLX;
                runOnJS(updateValues)(newLX, rightX.value);
            } else {
                // Closer to right handle
                const newRX = Math.max(leftX.value + (containerWidth / range), Math.min(containerWidth, touchX));
                rightX.value = newRX;
                runOnJS(updateValues)(leftX.value, newRX);
            }
        });

    const activeTrackStyle = useAnimatedStyle(() => ({
        left: leftX.value,
        width: rightX.value - leftX.value,
    }));

    const leftHandleStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: leftX.value }],
    }));

    const rightHandleStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: rightX.value }],
    }));

    const dots = useMemo(() => {
        const d = [];
        for (let i = 0; i <= range; i += step) {
            d.push(i + min);
        }
        return d;
    }, [min, max, step, range]);

    return (
        <GestureHandlerRootView style={styles.container}>
            <GestureDetector gesture={panGesture}>
                <View style={[styles.sliderArea]} onLayout={onLayout}>
                    {containerWidth > 0 && (
                        <View style={[styles.track, { width: containerWidth, backgroundColor: colors.surfaceContainerHighest }]}>
                            {dots.map((dot) => {
                                const oneStepWidth = containerWidth / range;
                                const dotX = (dot - min) * oneStepWidth;
                                return (
                                    <View
                                        key={dot}
                                        style={[
                                            styles.dot,
                                            {
                                                left: dotX - 2.5,
                                                backgroundColor: colors.onSurfaceVariant,
                                                opacity: 0.4,
                                            },
                                        ]}
                                    />
                                );
                            })}

                            <Animated.View style={[styles.activeLine, { backgroundColor: colors.primary }, activeTrackStyle]} />

                            <Animated.View style={[styles.handle, { backgroundColor: colors.primary }, leftHandleStyle]} />
                            <Animated.View style={[styles.handle, { backgroundColor: colors.primary }, rightHandleStyle]} />
                        </View>
                    )}
                </View>
            </GestureDetector>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: 60,
        marginVertical: 10,
    },
    sliderArea: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent", // Ensure it captures touches
    },
    track: {
        height: 14,
        borderRadius: 7,
        position: "relative",
        justifyContent: "center",
    },
    activeLine: {
        height: 14,
        borderRadius: 7,
        position: "absolute",
    },
    dot: {
        position: "absolute",
        width: 5,
        height: 5,
        borderRadius: 2.5,
        zIndex: 1,
    },
    handle: {
        width: 6,
        height: 36,
        borderRadius: 3,
        position: "absolute",
        left: -3, // Center on the X coordinate
        zIndex: 10,
    },
});
