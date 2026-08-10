import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import { Trash2, ArrowRight, ShoppingBag, Tag } from 'lucide-react-native';

export default function CartScreen({ navigation }) {
  const { cart, itemCount, cartSubtotal, updateQuantity, removeItem } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const discountAmount = appliedCoupon ? 100 : 0;
  const shippingCost = cartSubtotal > 999 || cartSubtotal === 0 ? 0 : 99;
  const finalTotal = Math.max(0, cartSubtotal - discountAmount + shippingCost);

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'KARVIYAM10') {
      setAppliedCoupon({ code: 'KARVIYAM10' });
    }
  };

  if (!cart.items || cart.items.length === 0) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} showSearch={false} />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <ShoppingBag size={32} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Your Bag is Empty</Text>
          <Text style={styles.emptySub}>Looks like you haven't added anything to your bag yet.</Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('ShopCatalog')}
          >
            <Text style={styles.exploreButtonText}>EXPLORE CATALOG →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} showSearch={false} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>SHOPPING BAG ({itemCount})</Text>

        {/* Item Cards */}
        {cart.items.map((item) => {
          const prod = item.product || {};
          return (
            <View key={item.id} style={styles.itemCard}>
              <Image
                source={{ uri: prod.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500' }}
                style={styles.itemImage}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{prod.name}</Text>
                <Text style={styles.itemSize}>Size: {item.selectedSize || 'M'}</Text>
                <Text style={styles.itemPrice}>₹{prod.price}</Text>
              </View>

              {/* Quantity Controls */}
              <View style={styles.quantityBox}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.id)}>
                <Trash2 size={16} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Promo Code Box */}
        <View style={styles.sectionBox}>
          <Text style={styles.boxTitle}>PROMO CODE</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              placeholder="e.g. KARVIYAM10"
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCoupon}>
              <Text style={styles.applyBtnText}>APPLY</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Breakdown */}
        <View style={styles.sectionBox}>
          <Text style={styles.boxTitle}>ORDER SUMMARY</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{cartSubtotal}</Text>
          </View>

          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Promo Discount</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>-₹{discountAmount}</Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Shipping</Text>
            <Text style={styles.summaryValue}>
              {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
            </Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{finalTotal}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button Bar */}
      <View style={styles.footerBar}>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutBtnText}>PROCEED TO CHECKOUT</Text>
          <ArrowRight size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: SPACING.md,
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
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  itemInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  itemSize: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 2,
  },
  quantityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 6,
    color: COLORS.text,
  },
  deleteBtn: {
    padding: 6,
  },
  sectionBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  boxTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  couponRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 12,
    fontWeight: '700',
  },
  applyBtn: {
    backgroundColor: COLORS.text,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  footerBar: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  checkoutBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkoutBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
});
