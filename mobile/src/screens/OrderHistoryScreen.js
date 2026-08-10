import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';
import Header from '../components/Header';
import SkeletonLoader from '../components/SkeletonLoader';
import api from '../services/api';
import { Package, Clock, CheckCircle2, ChevronRight } from 'lucide-react-native';

export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (e) {
      console.error('[OrderHistoryScreen] Fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} showSearch={false} />

      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>YOUR ORDER HISTORY</Text>
      </View>

      {loading ? (
        <SkeletonLoader count={4} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Package size={32} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySub}>Your completed and active orders will show up here.</Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('ShopCatalog')}
          >
            <Text style={styles.exploreButtonText}>SHOP DROPS NOW</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.orderCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('OrderDetail', { order: item })}
            >
              {/* Order Header */}
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.orderId}>Order #{item.id}</Text>
                  <Text style={styles.trackingNo}>({item.trackingNumber || 'Tracking Active'})</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status || 'PROCESSING'}</Text>
                </View>
              </View>

              {/* Items Preview */}
              <View style={styles.itemsPreview}>
                {(item.items || []).slice(0, 2).map((it, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Image
                      source={{ uri: it.productImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500' }}
                      style={styles.itemThumb}
                    />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{it.productName}</Text>
                      <Text style={styles.itemSub}>Qty: {it.quantity} x ₹{it.priceAtTime}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Card Footer */}
              <View style={styles.cardBottom}>
                <Text style={styles.dateText}>
                  Placed on {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                </Text>
                <View style={styles.totalRow}>
                  <Text style={styles.totalText}>Total: ₹{item.totalAmount}</Text>
                  <ChevronRight size={16} color={COLORS.primary} />
                </View>
              </View>
            </TouchableOpacity>
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
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
  },
  trackingNo: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  statusBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '900',
  },
  itemsPreview: {
    gap: 8,
    marginBottom: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.sm,
  },
  dateText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  totalText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
  },
});
