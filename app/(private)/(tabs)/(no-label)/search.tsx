import { Colors } from '@/src/constants/colors';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { SearchField } from '@/src/shared/components/forms/SearchField';
import { AppText } from '@/src/shared/components/ui/AppText';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function SearchScreen() {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [query, setQuery] = useState('');

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <AppText variant="headline" color={colors.onSurface} style={styles.title}>
          {t('search.title')}
        </AppText>
        <SearchField
          containerStyle={styles.searchBar}
          placeholder={t('search.placeholder')}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* TODO: Search results with useDebounce hook */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },
  title: { marginBottom: 16 },
  searchBar: {},
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },
});
