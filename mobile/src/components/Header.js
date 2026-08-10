import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../theme/colors';
import { Search, MapPin, Bell } from 'lucide-react-native';

export default function Header({ navigation, title, showSearch = true }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* Top Bar */}
      <View style={styles.topRow}>
        {/* Karviyam Brand Logo */}
        <TouchableOpacity style={styles.logoContainer} onPress={() => navigation.navigate('Home')}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>K</Text>
          </View>
          <View>
            <Text style={styles.logoText}>KARVIYAM</Text>
            <Text style={styles.taglineText}>QUALITY YOU CAN TRUST</Text>
          </View>
        </TouchableOpacity>

        {/* Deliver To Location Button */}
        <TouchableOpacity style={styles.locationButton}>
          <MapPin size={14} color={COLORS.primary} />
          <View style={{ marginLeft: 4 }}>
            <Text style={styles.locationLabel}>Deliver to</Text>
            <Text style={styles.locationValue}>Chennai 600001</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      {showSearch && (
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Search')}
        >
          <Search size={18} color={COLORS.textMuted} />
          <Text style={styles.placeholderText}>Search Oversized Tees, Sneakers, Jewellery...</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoBadgeText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 18,
  },
  logoText: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  taglineText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 7,
    letterSpacing: 1,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  locationValue: {
    fontSize: 10,
    color: COLORS.text,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 42,
    marginTop: 4,
  },
  placeholderText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 8,
    fontWeight: '500',
  },
});
