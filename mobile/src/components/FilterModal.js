import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';
import { X, SlidersHorizontal, Check } from 'lucide-react-native';

export default function FilterModal({ visible, onClose, sortBy, setSortBy, priceRange, setPriceRange, onApply }) {
  const SORT_OPTIONS = [
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Highest Rated', value: 'rating-desc' },
    { label: 'Newest Arrivals', value: 'id-desc' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <SlidersHorizontal size={18} color={COLORS.primary} />
              <Text style={styles.title}>SORT & FILTER</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {/* Sort Section */}
            <Text style={styles.sectionHeading}>SORT BY</Text>
            <View style={styles.optionsList}>
              {SORT_OPTIONS.map((opt) => {
                const selected = sortBy === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionRow, selected && styles.selectedOptionRow]}
                    onPress={() => setSortBy(opt.value)}
                  >
                    <Text style={[styles.optionLabel, selected && styles.selectedOptionLabel]}>
                      {opt.label}
                    </Text>
                    {selected && <Check size={16} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Price Slider Header */}
            <Text style={[styles.sectionHeading, { marginTop: SPACING.lg }]}>MAX PRICE (₹)</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.priceValue}>Max Price: ₹{priceRange}</Text>
              <View style={styles.pricePillsRow}>
                {[1000, 2500, 5000].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.pricePill, priceRange === val && styles.activePricePill]}
                    onPress={() => setPriceRange(val)}
                  >
                    <Text style={[styles.pricePillText, priceRange === val && styles.activePricePillText]}>
                      Up to ₹{val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                onApply && onApply();
                onClose();
              }}
            >
              <Text style={styles.applyButtonText}>APPLY FILTERS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 4,
  },
  body: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  optionsList: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedOptionRow: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedOptionLabel: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  priceContainer: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 8,
  },
  pricePillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pricePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  activePricePill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pricePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  activePricePillText: {
    color: '#FFF',
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
});
