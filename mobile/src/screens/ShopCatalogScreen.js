import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import FilterModal from '../components/FilterModal';
import api from '../services/api';
import { SlidersHorizontal, LayoutGrid, List } from 'lucide-react-native';

export default function ShopCatalogScreen({ navigation, route }) {
  const initialCategory = route.params?.category || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('price-asc');
  const [priceRange, setPriceRange] = useState(5000);
  const [isGridView, setIsGridView] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [sortField, sortDir] = sortBy.split('-');
      let endpoint = `/products?size=30&maxPrice=${priceRange}&sortBy=${sortField}&sortDir=${sortDir}`;
      if (selectedCategory) {
        if (!isNaN(selectedCategory)) {
          endpoint += `&categoryId=${selectedCategory}`;
        } else {
          endpoint += `&keyword=${encodeURIComponent(selectedCategory)}`;
        }
      }

      const res = await api.get(endpoint);
      if (res.success && res.data) {
        setProducts(res.data.content || []);
      }
    } catch (e) {
      console.error('[ShopCatalogScreen] Fetch error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy, priceRange]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title="SHOP CATALOG" />

      {/* Control Bar */}
      <View style={styles.controlBar}>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
          <SlidersHorizontal size={14} color={COLORS.primary} />
          <Text style={styles.filterText}>Sort & Filter</Text>
        </TouchableOpacity>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, isGridView && styles.activeToggleBtn]}
            onPress={() => setIsGridView(true)}
          >
            <LayoutGrid size={16} color={isGridView ? COLORS.primary : COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !isGridView && styles.activeToggleBtn]}
            onPress={() => setIsGridView(false)}
          >
            <List size={16} color={!isGridView ? COLORS.primary : COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Catalog List */}
      {loading ? (
        <SkeletonLoader count={6} />
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Products Found</Text>
          <Text style={styles.emptySub}>Try adjusting your filters or price limit.</Text>
        </View>
      ) : (
        <FlatList
          key={isGridView ? 'grid' : 'list'}
          data={products}
          keyExtractor={(item) => item.id.toString()}
          numColumns={isGridView ? 2 : 1}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={isGridView ? styles.columnWrapper : null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              navigation={navigation}
              fullWidth={!isGridView}
            />
          )}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        sortBy={sortBy}
        setSortBy={setSortBy}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        onApply={fetchProducts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleBtn: {
    padding: 6,
    borderRadius: 8,
  },
  activeToggleBtn: {
    backgroundColor: COLORS.surface,
  },
  listContent: {
    padding: SPACING.lg,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
