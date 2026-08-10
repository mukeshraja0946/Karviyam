import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { useWishlist } from '../context/WishlistContext';
import { Heart } from 'lucide-react-native';

export default function WishlistScreen({ navigation }) {
  const { wishlist } = useWishlist();

  if (!wishlist || wishlist.length === 0) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} showSearch={false} />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Heart size={32} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
          <Text style={styles.emptySub}>Save your favorite items by tapping the heart icon.</Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('ShopCatalog')}
          >
            <Text style={styles.exploreButtonText}>EXPLORE DROPS →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} showSearch={false} />

      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>WISHLISTED ITEMS ({wishlist.length})</Text>
      </View>

      <FlatList
        data={wishlist}
        keyExtractor={(item) => (item.product?.id || item.id).toString()}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <ProductCard
            product={item.product || item}
            navigation={navigation}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 1,
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
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  exploreButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  exploreButtonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
  },
});
