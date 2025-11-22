import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { useLanguage } from '../context/LanguageContext';
import { useDesignSystem } from '../context/ThemeContext';

const dummyRecent = [
  { id: '1', label: 'Supermarché', subtitle: 'Recherché il y a 2 heures' },
  { id: '2', label: 'Salaire', subtitle: 'Recherché hier' },
];

import { useTransactions } from '../hooks/useTransactions';

const SearchScreen: React.FC = () => {
  const { t } = useLanguage();
  const { colors } = useDesignSystem();
  const { transactions } = useTransactions();

  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return transactions.filter(tn => {
      const desc = (tn.description || '').toLowerCase();
      const cat = (tn.category || '').toLowerCase();
      const amt = String(tn.amount || '').toLowerCase();
      return desc.includes(q) || cat.includes(q) || amt.includes(q);
    });
  }, [query, transactions]);

  return (
    <SafeAreaView>
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}> 
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>{t.search}</Text>
        </View>

        <View style={styles.body}>
          <View style={[styles.searchBox, { backgroundColor: colors.background.secondary }]}> 
            <Ionicons name="search" size={18} color={colors.text.tertiary} />
            <TextInput
              placeholder={t.searchPlaceholder}
              placeholderTextColor={colors.text.tertiary}
              style={[styles.input, { color: colors.text.primary }]}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          {!query ? (
            <>
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Ionicons name="search" size={48} color={colors.text.tertiary} />
                <Text style={[styles.centerText, { color: colors.text.secondary }]}>{t.startTypingToSearch}</Text>
                <Text style={[styles.centerSubText, { color: colors.text.secondary }]}>Transactions, catégories, montants...</Text>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t.recentSearches}</Text>

              <FlatList
                data={dummyRecent}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.recentItem, { backgroundColor: colors.background.secondary }]}>
                    <View style={styles.recentIcon}>
                      <Ionicons name="search" size={18} color={colors.primary[600]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.recentLabel, { color: colors.text.primary }]}>{item.label}</Text>
                      <Text style={[styles.recentSubtitle, { color: colors.text.secondary }]}>{item.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{`${filtered.length} résultats`}</Text>
              <FlatList
                data={filtered}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.recentItem, { backgroundColor: colors.background.secondary }]}>
                    <View style={styles.recentIcon}>
                      <Ionicons name="search" size={18} color={colors.primary[600]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.recentLabel, { color: colors.text.primary }]}>{item.description || t.noTransactions}</Text>
                      <Text style={[styles.recentSubtitle, { color: colors.text.secondary }]}>{item.category || ''}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  body: { paddingHorizontal: 20, paddingTop: 8 },
  searchBox: { height: 52, borderRadius: 12, paddingHorizontal: 12, alignItems: 'center', flexDirection: 'row', gap: 10 },
  input: { flex: 1, fontSize: 14 },
  centerText: { marginTop: 12, fontSize: 16 },
  centerSubText: { marginTop: 6, fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  recentItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 10 },
  recentIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: '#F3F4F6' },
  recentLabel: { fontSize: 15, fontWeight: '700' },
  recentSubtitle: { fontSize: 13, marginTop: 4 },
});

export default SearchScreen;
