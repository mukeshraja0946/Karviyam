import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';

const { width } = Dimensions.get('window');
const cardWidth = (width - SPACING.lg * 2 - SPACING.md) / 2;

export default function SkeletonLoader({ count = 4 }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.imagePlaceholder} />
          <View style={styles.content}>
            <View style={styles.lineLong} />
            <View style={styles.lineShort} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  card: {
    width: cardWidth,
    height: 220,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.border,
  },
  content: {
    padding: SPACING.sm,
  },
  lineLong: {
    width: '80%',
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginBottom: 6,
  },
  lineShort: {
    width: '40%',
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: 4,
  },
});
