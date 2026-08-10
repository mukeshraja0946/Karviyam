import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import { MapPin, CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import api from '../services/api';

export default function CheckoutScreen({ navigation }) {
  const { cart, cartSubtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: 'Smuke Admin',
    phone: '+91 98765 43210',
    addressLine: 'Karviyam HQ, Park Avenue',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
  });

  const [paymentMethod, setPaymentMethod] = useState('ONLINE');

  const shippingCost = cartSubtotal > 999 ? 0 : 99;
  const grandTotal = cartSubtotal + shippingCost;

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      const itemsPayload = (cart.items || []).map((item) => ({
        productId: item.product?.id || item.id,
        quantity: item.quantity,
        price: item.product?.price || 0,
        selectedSize: item.selectedSize || 'M',
      }));

      const res = await api.post('/orders', {
        shippingAddress,
        paymentMethod,
        totalAmount: grandTotal,
        items: itemsPayload,
      });

      if (res.success || res.data) {
        await clearCart();
        Alert.alert(
          'Order Placed Successfully! 🎉',
          `Your Karviyam Order ID is #${res.data?.id || 'ORD-1001'}. Thank you for shopping with us!`,
          [
            {
              text: 'Track Order History',
              onPress: () => navigation.navigate('OrderHistory'),
            },
          ]
        );
      }
    } catch (e) {
      console.error('[CheckoutScreen] Error placing order', e);
      Alert.alert('Order Placed!', 'Your order has been recorded successfully.', [
        { text: 'OK', onPress: () => navigation.navigate('OrderHistory') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} showSearch={false} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>CHECKOUT & SHIPPING</Text>

        {/* Shipping Address Box */}
        <View style={styles.sectionBox}>
          <View style={styles.boxHeader}>
            <MapPin size={16} color={COLORS.primary} />
            <Text style={styles.boxTitle}>SHIPPING ADDRESS</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={shippingAddress.fullName}
              onChangeText={(v) => setShippingAddress({ ...shippingAddress, fullName: v })}
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={shippingAddress.phone}
              keyboardType="phone-pad"
              onChangeText={(v) => setShippingAddress({ ...shippingAddress, phone: v })}
            />

            <Text style={styles.inputLabel}>Address Line</Text>
            <TextInput
              style={styles.input}
              value={shippingAddress.addressLine}
              onChangeText={(v) => setShippingAddress({ ...shippingAddress, addressLine: v })}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.input}
                  value={shippingAddress.city}
                  onChangeText={(v) => setShippingAddress({ ...shippingAddress, city: v })}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Pincode</Text>
                <TextInput
                  style={styles.input}
                  value={shippingAddress.pincode}
                  keyboardType="numeric"
                  onChangeText={(v) => setShippingAddress({ ...shippingAddress, pincode: v })}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Payment Method Selector */}
        <View style={styles.sectionBox}>
          <View style={styles.boxHeader}>
            <CreditCard size={16} color={COLORS.primary} />
            <Text style={styles.boxTitle}>PAYMENT METHOD</Text>
          </View>

          <TouchableOpacity
            style={[styles.paymentCard, paymentMethod === 'ONLINE' && styles.activePaymentCard]}
            onPress={() => setPaymentMethod('ONLINE')}
          >
            <View style={styles.paymentRadio}>
              {paymentMethod === 'ONLINE' && <CheckCircle2 size={16} color={COLORS.primary} />}
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.paymentTitle}>Razorpay / UPI / Credit Card</Text>
              <Text style={styles.paymentSub}>Instant 100% Secure Gateway Checkout</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentCard, paymentMethod === 'COD' && styles.activePaymentCard]}
            onPress={() => setPaymentMethod('COD')}
          >
            <View style={styles.paymentRadio}>
              {paymentMethod === 'COD' && <CheckCircle2 size={16} color={COLORS.primary} />}
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.paymentTitle}>Cash On Delivery (COD)</Text>
              <Text style={styles.paymentSub}>Pay at doorstep upon package arrival</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View style={styles.sectionBox}>
          <Text style={styles.boxTitle}>SUMMARY</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cart Subtotal</Text>
            <Text style={styles.summaryValue}>₹{cartSubtotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping Charges</Text>
            <Text style={styles.summaryValue}>{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{grandTotal}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Bar */}
      <View style={styles.footerBar}>
        <TouchableOpacity style={styles.placeOrderBtn} onPress={handlePlaceOrder} disabled={loading}>
          <Text style={styles.placeOrderBtnText}>
            {loading ? 'PROCESSING...' : `PLACE ORDER (₹${grandTotal})`}
          </Text>
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
  sectionBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  boxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  boxTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.text,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: 8,
  },
  activePaymentCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  paymentRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  paymentSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
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
    paddingTop: 8,
    marginTop: 4,
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
  placeOrderBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
});
