import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';
import { Search, ArrowLeft, X, TrendingUp } from 'lucide-react-native';
import ProductCard from '../components/ProductCard';
import api from '../services/api';

const POPULAR_SEARCHES = ['Oversized Tee', 'Linen Shirt', '925 Silver Ring', 'Apex Sneakers', 'Anime Hoodie'];

export default function SearchScreen({ navigation }) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (keyword.trim().length > 1) {
      handleSearch();
    } else {
      setResults([]);
    }
  }, [keyword]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products?size=20&keyword=${encodeURIComponent(keyword.trim())}`);
      if (res.success && res.data) {
        setResults(res.data.content || []);
      }
    } catch (e) {
      console.error('[SearchScreen] Error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Search Input Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Search size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, categories, styles..."
            value={keyword}
            onChangeText={setKeyword}
            autoFocus
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => setKeyword('')}>
              <X size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Popular Suggestions if empty */}
      {keyword.trim().length === 0 ? (
        <View style={styles.suggestionsBox}>
          <View style={styles.titleRow}>
            <TrendingUp size={16} color={COLORS.primary} />
            <Text style={styles.suggestTitle}>POPULAR SEARCHES</Text>
          </View>
          <View style={styles.pillsRow}>
            {POPULAR_SEARCHES.map((term, i) => (
              <TouchableOpacity key={i} style={styles.pill} onPress={() => setKeyword(term)}>
                <Text style={styles.pillText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => (
            <ProductCard product={item} navigation={navigation} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 44,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  suggestionsBox: {
    padding: SPACING.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  suggestTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  listContent: {
    padding: SPACING.lg,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});
