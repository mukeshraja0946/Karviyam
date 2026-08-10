import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { User, Package, MapPin, Settings, HelpCircle, LogOut, ChevronRight, LogIn } from 'lucide-react-native';

export default function AccountScreen({ navigation }) {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Header navigation={navigation} showSearch={false} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Avatar Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.fullName ? user.fullName[0].toUpperCase() : 'A'}
            </Text>
          </View>

          {user ? (
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.fullName}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          ) : (
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Welcome to Karviyam</Text>
              <Text style={styles.userEmail}>Log in to manage orders & addresses</Text>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <Text style={styles.sectionHeader}>ACCOUNT & ORDERS</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => (user ? navigation.navigate('OrderHistory') : navigation.navigate('Login'))}
          >
            <View style={styles.menuLeft}>
              <Package size={18} color={COLORS.primary} />
              <Text style={styles.menuText}>Order History & Tracking</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => (user ? navigation.navigate('Checkout') : navigation.navigate('Login'))}
          >
            <View style={styles.menuLeft}>
              <MapPin size={18} color={COLORS.primary} />
              <Text style={styles.menuText}>Saved Shipping Addresses</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('Contact')}
          >
            <View style={styles.menuLeft}>
              <HelpCircle size={18} color={COLORS.primary} />
              <Text style={styles.menuText}>Customer Support & Contact HQ</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <Settings size={18} color={COLORS.primary} />
              <Text style={styles.menuText}>App Settings & Notifications</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Auth Action Button */}
        {user ? (
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <LogOut size={18} color={COLORS.error} />
            <Text style={styles.logoutText}>LOG OUT</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
            <LogIn size={18} color="#FFF" />
            <Text style={styles.loginBtnText}>LOG IN / REGISTER</Text>
          </TouchableOpacity>
        )}
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
  },
  userInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  menuContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 8,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 14,
    gap: 8,
  },
  loginBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
});
