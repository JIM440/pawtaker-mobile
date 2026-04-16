import { Colors } from '@/src/constants/colors';
import { SearchFilterStyles } from '@/src/constants/searchFilter';
import { useThemeStore } from '@/src/lib/store/theme.store';
import React from 'react';
import { TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

type SearchFieldProps = Omit<TextInputProps, 'style'> & {
  containerStyle?: StyleProp<ViewStyle>;
  rightSlot?: React.ReactNode;
};

export function SearchField({ containerStyle, rightSlot, ...props }: SearchFieldProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View
      style={[
        {
          height: SearchFilterStyles.searchBarHeight,
          borderRadius: SearchFilterStyles.searchBarBorderRadius,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: SearchFilterStyles.searchBarPaddingHorizontal,
          paddingRight: SearchFilterStyles.searchBarPaddingRight,
          gap: SearchFilterStyles.searchBarGap,
          backgroundColor: colors.surfaceContainerLow,
        },
        containerStyle,
      ]}
    >
      {/* <Search size={SearchFilterStyles.searchIconSize} color={colors.onSurfaceVariant} /> */}
      <TextInput
        {...props}
        style={{
          flex: 1,
          fontSize: SearchFilterStyles.searchInputFontSize,
          color: colors.onSurface,
        }}
        multiline={false}
        numberOfLines={1}
        placeholderTextColor={colors.onSurfaceVariant}
      />
      {rightSlot}
    </View>
  );
}

