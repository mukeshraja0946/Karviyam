import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';
import { Heart, Star, ShoppingBag } from 'lucide-react-native';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');
const cardWidth = (width - SPACING.lg * 2 - SPACING.md) / 2;

export default function ProductCard({ product, navigation, fullWidth = false }) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (!product) return null;

  const wishlisted = isWishlisted(product.id);
  const formattedPrice = `₹${product.price}`;

  return (
    <TouchableOpacity
      style={[styles.card, fullWidth && { width: '100%' }]}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500' }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Wishlist Heart Button */}
        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => toggleWishlist(product)}
        >
          <Heart
            size={16}
            color={wishlisted ? COLORS.primary : COLORS.textSecondary}
            fill={wishlisted ? COLORS.primary : 'transparent'}
          />
        </TouchableOpacity>

        {/* Category Tag */}
        {product.categoryName && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{product.categoryName}</Text>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>{product.name}</Text>
        
        {/* Rating */}
        <View style={styles.ratingRow}>
          <Star size={12} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.ratingText}>4.8 (124)</Text>
        </View>

        {/* Price & Add Button */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formattedPrice}</Text>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addToCart(product, 'M', 1)}
          >
            <ShoppingBag size={14} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  imageContainer: {
    width: '100%',
    height: cardWidth * 1.1,
    backgroundColor: COLORS.background,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  details: {
    padding: SPACING.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
