import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';

const { width } = Dimensions.get('window');
const bannerWidth = width - SPACING.lg * 2;

const BANNERS = [
  {
    id: 1,
    title: 'FESTIVE DROP 2026',
    subtitle: 'Up to 60% Off High-Street Wear & Jewellery',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
    tag: 'LIMITED TIME',
  },
  {
    id: 2,
    title: 'APEX SNEAKERS',
    subtitle: 'Step Up Your Fit with Luxury Kicks',
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800',
    tag: 'NEW ARRIVAL',
  },
  {
    id: 3,
    title: '925 STERLING SILVER',
    subtitle: 'Handcrafted Minimalist Accessories',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800',
    tag: 'POPULAR',
  },
];

export default function BannerSlider() {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event) => {
    const slide = Math.ceil(event.nativeEvent.contentOffset.x / bannerWidth);
    if (slide !== activeIndex && slide >= 0 && slide < BANNERS.length) {
      setActiveIndex(slide);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {BANNERS.map((banner) => (
          <View key={banner.id} style={styles.bannerCard}>
            <Image source={{ uri: banner.image }} style={styles.image} resizeMode="cover" />
            <View style={styles.overlay} />
            <View style={styles.content}>
              <Text style={styles.tag}>{banner.tag}</Text>
              <Text style={styles.title}>{banner.title}</Text>
              <Text style={styles.subtitle}>{banner.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {BANNERS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  bannerCard: {
    width: bannerWidth,
    height: 160,
    borderRadius: 20,
    marginHorizontal: SPACING.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  content: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
  },
  tag: {
    color: '#FFF',
    backgroundColor: COLORS.primary,
    fontSize: 9,
    fontWeight: '900',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  activeDot: {
    width: 20,
    backgroundColor: COLORS.primary,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: COLORS.border,
  },
});
