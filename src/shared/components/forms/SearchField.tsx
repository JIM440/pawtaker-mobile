import React from 'react';
import { View, TextInput, type TextInputProps, type StyleProp, type ViewStyle } from 'react-native';
import { Search } from 'lucide-react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { SearchFilterStyles } from '@/src/constants/searchFilter';

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
          borderWidth: 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: SearchFilterStyles.searchBarPaddingHorizontal,
          paddingRight: SearchFilterStyles.searchBarPaddingRight,
          gap: SearchFilterStyles.searchBarGap,
          backgroundColor: colors.surfaceContainer,
          borderColor: colors.outlineVariant,
        },
        containerStyle,
      ]}
    >
      <Search size={SearchFilterStyles.searchIconSize} color={colors.onSurfaceVariant} />
      <TextInput
        style={{ flex: 1, fontSize: SearchFilterStyles.searchInputFontSize, color: colors.onSurface }}
        placeholderTextColor={colors.onSurfaceVariant}
        {...props}
      />
      {rightSlot}
    </View>
  );
}

