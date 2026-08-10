import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';
import Header from '../components/Header';
import BannerSlider from '../components/BannerSlider';
import CategoryGrid from '../components/CategoryGrid';
import ProductCard from '../components/ProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import TrustBadges from '../components/TrustBadges';
import api from '../services/api';
import { Flame, ArrowRight, Sparkles } from 'lucide-react-native';

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let endpoint = '/products?size=20&sortBy=id&sortDir=desc';
      if (selectedCategory) {
        endpoint += `&categoryId=${selectedCategory}`;
      }
      const res = await api.get(endpoint);
      if (res.success && res.data) {
        setProducts(res.data.content || []);
      }
    } catch (e) {
      console.error('[HomeScreen] Fetch error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Banner Hero Slider */}
        <BannerSlider />

        {/* Category Grid Filter */}
        <CategoryGrid
          navigation={navigation}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        {/* Trending Drops Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.titleWithIcon}>
            <Flame size={18} color={COLORS.primary} fill={COLORS.primary} />
            <Text style={styles.sectionTitle}>TRENDING DROPS</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('ShopCatalog')}>
            <Text style={styles.seeAllText}>See All →</Text>
          </TouchableOpacity>
        </View>

        {/* Products Grid */}
        {loading ? (
          <SkeletonLoader count={4} />
        ) : (
          <View style={styles.productsGrid}>
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} navigation={navigation} />
            ))}
          </View>
        )}

        {/* Flash Sale Banner */}
        <View style={styles.flashBanner}>
          <View style={styles.flashHeader}>
            <Sparkles size={20} color="#FFF" />
            <Text style={styles.flashTitle}>FLASH SALE - 50% OFF</Text>
          </View>
          <Text style={styles.flashSubtitle}>Limited edition streetwear & 925 sterling silver rings.</Text>
          <TouchableOpacity
            style={styles.flashButton}
            onPress={() => navigation.navigate('ShopCatalog')}
          >
            <Text style={styles.flashButtonText}>SHOP NOW</Text>
            <ArrowRight size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Recommended Products */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECOMMENDED FOR YOU</Text>
        </View>

        <View style={styles.productsGrid}>
          {products.slice(8, 14).map((product) => (
            <ProductCard key={product.id} product={product} navigation={navigation} />
          ))}
        </View>

        {/* Trust Badges */}
        <TrustBadges />

        {/* Footer Info */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerBrand}>KARVIYAM MARKETPLACE</Text>
          <Text style={styles.footerText}>Karviyam Tower, Park Avenue, Chennai, Tamil Nadu 600001</Text>
          <Text style={styles.footerCopy}>© 2026 Karviyam Platform. Built for High Performance.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  flashBanner: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.lg,
    borderRadius: 20,
    padding: SPACING.lg,
  },
  flashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  flashTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  flashSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: SPACING.md,
  },
  flashButton: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  flashButtonText: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 11,
  },
  footerInfo: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerCopy: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
});
