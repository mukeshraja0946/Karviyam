import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';

const CATEGORIES = [
  { id: 'WOMEN', name: 'Women', icon: '💃' },
  { id: 'MEN', name: 'Men', icon: '👔' },
  { id: 'KIDS & BABY', name: 'Kids & Baby', icon: '🧸' },
  { id: 'ACCESSORIES', name: 'Accessories', icon: '🎒' },
  { id: 'KITCHEN & HOME', name: 'Kitchen & Home', icon: '🏠' },
  { id: 'SCHOOL & OFFICE', name: 'School & Office', icon: '📚' },
];

export default function CategoryGrid({ navigation, selectedCategory, onSelectCategory }) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>SHOP CATEGORIES</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={[styles.pill, !selectedCategory && styles.activePill]}
          onPress={() => onSelectCategory && onSelectCategory('')}
        >
          <Text style={[styles.pillText, !selectedCategory && styles.activePillText]}>⚡ All Drops</Text>
        </TouchableOpacity>

        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.pill, active && styles.activePill]}
              onPress={() => {
                if (onSelectCategory) {
                  onSelectCategory(active ? '' : cat.id);
                } else {
                  navigation.navigate('ShopCatalog', { category: cat.id });
                }
              }}
            >
              <Text style={[styles.pillText, active && styles.activePillText]}>
                {cat.icon} {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  activePill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  activePillText: {
    color: '#FFF',
  },
});

