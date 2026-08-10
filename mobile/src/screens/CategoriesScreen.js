import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';
import Header from '../components/Header';
import { ChevronRight } from 'lucide-react-native';
import api from '../services/api';

const DEFAULT_CATEGORIES = [
  {
    id: 'WOMEN',
    name: 'Women Collection',
    desc: 'Sarees, Kurtis, Lehengas & Party Wear',
    count: 'Popular',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500',
  },
  {
    id: 'MEN',
    name: 'Men Collection',
    desc: 'Formal Shirts, Jeans, Dhotis & Fabrics',
    count: 'Trending',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500',
  },
  {
    id: 'KIDS & BABY',
    name: 'Kids & Baby',
    desc: 'Baby Clothing, Essentials & Toys',
    count: 'New',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500',
  },
  {
    id: 'ACCESSORIES',
    name: 'Fashion Accessories',
    desc: 'Bags, Slippers, Jewelry, Belts & Watches',
    count: 'Curated',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500',
  },
  {
    id: 'KITCHEN & HOME',
    name: 'Kitchenware & Home',
    desc: 'Brassware, Clay Pots, Racks & Home Essentials',
    count: 'Essential',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500',
  },
  {
    id: 'SCHOOL & OFFICE',
    name: 'School & Office',
    desc: 'School Bags, Water Bottles, Stationery & Printers',
    count: 'Office',
    image: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=500',
  },
];

export default function CategoriesScreen({ navigation }) {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    try {
      const res = await api.get('/categories/tree');
      if (res.success && res.data && res.data.length > 0) {
        const mapped = res.data.map(cat => ({
          id: cat.id.toString(),
          name: cat.name,
          desc: (cat.children || []).map(c => c.name).slice(0, 3).join(', ') || cat.description || 'Quality Products',
          count: (cat.children || []).length > 0 ? `${cat.children.length} Subcategories` : 'Popular',
          image: cat.imageUrl || cat.bannerUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
        }));
        setCategories(mapped);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title="CATEGORIES" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>EXPLORE ALL CATEGORIES</Text>

        {categories.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ShopCatalog', { category: item.id })}
          >
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <Text style={styles.countTag}>{item.count}</Text>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
            </View>
            <View style={styles.arrowCircle}>
              <ChevronRight size={18} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  cardContent: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  countTag: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  desc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
});

