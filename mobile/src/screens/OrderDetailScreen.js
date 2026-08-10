import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';
import Header from '../components/Header';
import { ArrowLeft, CheckCircle2, Clock, Truck, PackageCheck, Shield } from 'lucide-react-native';

const TIMELINE = [
  { step: 'Order Placed', time: 'Completed', active: true },
  { step: 'Processing in Warehouse', time: 'Completed', active: true },
  { step: 'Shipped via Express', time: 'In Transit', active: true },
  { step: 'Out for Delivery', time: 'Pending', active: false },
  { step: 'Delivered to Customer', time: 'Pending', active: false },
];

export default function OrderDetailScreen({ navigation, route }) {
  const { order } = route.params || {};

  if (!order) return null;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>ORDER TRACKING & TAX BILL</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Header */}
        <View style={styles.statusBox}>
          <Text style={styles.statusHeader}>Order #{order.id}</Text>
          <Text style={styles.trackingText}>Tracking Code: {order.trackingNumber || 'KV-TRK-98210'}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{order.status || 'SHIPPED IN TRANSIT'}</Text>
          </View>
        </View>

        {/* Stepper Timeline */}
        <Text style={styles.sectionHeader}>LIVE DELIVERY TRACKING</Text>
        <View style={styles.timelineBox}>
          {TIMELINE.map((t, idx) => (
            <View key={idx} style={styles.timelineRow}>
              <View style={styles.stepperCol}>
                <View style={[styles.circle, t.active && styles.activeCircle]}>
                  {t.active && <CheckCircle2 size={12} color="#FFF" />}
                </View>
                {idx < TIMELINE.length - 1 && (
                  <View style={[styles.line, t.active && styles.activeLine]} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.stepTitle, t.active && styles.activeStepTitle]}>{t.step}</Text>
                <Text style={styles.stepTime}>{t.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Items List */}
        <Text style={styles.sectionHeader}>ORDER ITEMS</Text>
        <View style={styles.itemsBox}>
          {(order.items || []).map((it, i) => (
            <View key={i} style={styles.itemRow}>
              <Image source={{ uri: it.productImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500' }} style={styles.itemImg} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.itemTitle}>{it.productName}</Text>
                <Text style={styles.itemSub}>Size: {it.selectedSize || 'M'} | Qty: {it.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{it.priceAtTime * it.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Total Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Total Paid</Text>
            <Text style={styles.sumVal}>₹{order.totalAmount}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Payment Method</Text>
            <Text style={styles.sumVal}>{order.paymentMethod || 'Online / UPI'}</Text>
          </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 44,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  topTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  content: {
    padding: SPACING.lg,
  },
  statusBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  statusHeader: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  trackingText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  statusPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusPillText: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 11,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  timelineBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 50,
  },
  stepperCol: {
    alignItems: 'center',
    width: 24,
  },
  circle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCircle: {
    backgroundColor: COLORS.primary,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  activeLine: {
    backgroundColor: COLORS.primary,
  },
  timelineContent: {
    marginLeft: 12,
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  activeStepTitle: {
    fontWeight: '900',
    color: COLORS.text,
  },
  stepTime: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  itemsBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImg: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  itemSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
  },
  summaryBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sumLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  sumVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
});
