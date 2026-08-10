import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';
import { Heart, Star, ShoppingBag, ArrowLeft, ShieldCheck, Truck, RotateCcw } from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../services/api';

const { width } = Dimensions.get('window');

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export default function ProductDetailScreen({ navigation, route }) {
  const { productId } = route.params || {};
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);

  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  useEffect(() => {
    fetchProductDetail();
  }, [productId]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${productId}`);
      if (res.success && res.data) {
        setProduct(res.data);
      }
    } catch (e) {
      console.error('[ProductDetailScreen] Fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Product not found.</Text>
      </View>
    );
  }

  const wishlisted = isWishlisted(product.id);

  return (
    <View style={styles.container}>
      {/* Top Action Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconCircle} onPress={() => toggleWishlist(product)}>
          <Heart size={18} color={wishlisted ? COLORS.primary : COLORS.text} fill={wishlisted ? COLORS.primary : 'transparent'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Hero Image */}
        <Image
          source={{ uri: product.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800' }}
          style={styles.heroImage}
          resizeMode="cover"
        />

        <View style={styles.content}>
          {/* Category Tag */}
          <Text style={styles.categoryTag}>{product.categoryName || 'PREMIUM COLLECTION'}</Text>
          <Text style={styles.title}>{product.name}</Text>

          {/* Rating Row */}
          <View style={styles.ratingRow}>
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>4.9 (128 customer reviews)</Text>
          </View>

          {/* Price Tag */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{product.price}</Text>
            <Text style={styles.mrp}>₹{product.price + 500}</Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>25% OFF</Text>
            </View>
          </View>

          {/* Size Selector */}
          <Text style={styles.sectionHeading}>SELECT SIZE</Text>
          <View style={styles.sizesRow}>
            {SIZES.map((sz) => {
              const active = selectedSize === sz;
              return (
                <TouchableOpacity
                  key={sz}
                  style={[styles.sizeBox, active && styles.activeSizeBox]}
                  onPress={() => setSelectedSize(sz)}
                >
                  <Text style={[styles.sizeText, active && styles.activeSizeText]}>{sz}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description */}
          <Text style={styles.sectionHeading}>DESCRIPTION</Text>
          <Text style={styles.description}>
            {product.description ||
              'Crafted from 100% premium heavyweight cotton with double-stitched seams and luxury brand finish. Built for everyday street comfort and long-lasting durability.'}
          </Text>

          {/* Trust Value Propositions */}
          <View style={styles.guaranteeBox}>
            <View style={styles.guaranteeItem}>
              <Truck size={16} color={COLORS.primary} />
              <Text style={styles.guaranteeText}>Express Shipping</Text>
            </View>
            <View style={styles.guaranteeItem}>
              <RotateCcw size={16} color={COLORS.primary} />
              <Text style={styles.guaranteeText}>30 Day Returns</Text>
            </View>
            <View style={styles.guaranteeItem}>
              <ShieldCheck size={16} color={COLORS.primary} />
              <Text style={styles.guaranteeText}>Authentic Quality</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Footer */}
      <View style={styles.bottomFooter}>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => addToCart(product, selectedSize, 1)}
        >
          <ShoppingBag size={18} color="#FFF" />
          <Text style={styles.cartButtonText}>ADD TO BAG</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => {
            addToCart(product, selectedSize, 1);
            navigation.navigate('Cart');
          }}
        >
          <Text style={styles.buyButtonText}>BUY NOW</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 40,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  heroImage: {
    width: width,
    height: width * 1.1,
  },
  content: {
    padding: SPACING.lg,
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  ratingText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  price: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
  },
  mrp: {
    fontSize: 14,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '900',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sizesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  sizeBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSizeBox: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  sizeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  activeSizeText: {
    color: '#FFF',
  },
  description: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },
  guaranteeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  guaranteeItem: {
    alignItems: 'center',
    gap: 4,
  },
  guaranteeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.text,
  },
  bottomFooter: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  cartButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.text,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cartButtonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  buyButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
