import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';
import { Truck, RotateCcw, ShieldCheck, Tag, Headphones } from 'lucide-react-native';

const BADGES = [
  { icon: Truck, title: 'Free Delivery', sub: 'On orders above ₹499' },
  { icon: RotateCcw, title: '30 Days Return', sub: 'Easy exchange policy' },
  { icon: ShieldCheck, title: '100% Secure', sub: 'Encrypted checkout' },
  { icon: Tag, title: 'Best Price', sub: 'Unmatched value' },
  { icon: Headphones, title: '24/7 Support', sub: 'Dedicated assistance' },
];

export default function TrustBadges() {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {BADGES.map((b, i) => {
          const Icon = b.icon;
          return (
            <View key={i} style={styles.badgeCard}>
              <View style={styles.iconCircle}>
                <Icon size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>{b.title}</Text>
              <Text style={styles.sub}>{b.sub}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
  },
  badgeCard: {
    alignItems: 'center',
    marginRight: 20,
    width: 100,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  sub: {
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});
