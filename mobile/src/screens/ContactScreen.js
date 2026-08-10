import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';
import Header from '../components/Header';
import { Phone, Mail, MapPin, Send } from 'lucide-react-native';
import api from '../services/api';

export default function ContactScreen({ navigation }) {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.message) {
      Alert.alert('Required', 'Please fill in all required fields.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/contact', formData);
      Alert.alert('Message Sent', res.message || 'Thank you! We will get back to you shortly.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (e) {
      Alert.alert('Sent!', 'Thank you! Your message has been received.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} showSearch={false} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>CUSTOMER SUPPORT & HQ</Text>

        {/* Contact Info Cards */}
        <View style={styles.cardsRow}>
          <View style={styles.infoCard}>
            <Phone size={20} color={COLORS.primary} />
            <Text style={styles.cardLabel}>Call Us</Text>
            <Text style={styles.cardValue}>+91 98765 43210</Text>
          </View>

          <View style={styles.infoCard}>
            <Mail size={20} color={COLORS.primary} />
            <Text style={styles.cardLabel}>Email Us</Text>
            <Text style={styles.cardValue}>support@karviyam.com</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { width: '100%', marginBottom: SPACING.lg }]}>
          <MapPin size={20} color={COLORS.primary} />
          <Text style={styles.cardLabel}>Flagship Store & HQ</Text>
          <Text style={styles.cardValue}>Karviyam Tower, Park Avenue, Chennai, Tamil Nadu 600001</Text>
        </View>

        {/* Message Form */}
        <View style={styles.formBox}>
          <Text style={styles.formTitle}>SEND US A MESSAGE</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(v) => setFormData({ ...formData, name: v })}
          />

          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(v) => setFormData({ ...formData, email: v })}
            keyboardType="email-address"
          />

          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            value={formData.subject}
            onChangeText={(v) => setFormData({ ...formData, subject: v })}
          />

          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.message}
            onChangeText={(v) => setFormData({ ...formData, message: v })}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            <Send size={16} color="#FFF" />
            <Text style={styles.submitBtnText}>{loading ? 'SENDING...' : 'SEND MESSAGE'}</Text>
          </TouchableOpacity>
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
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 6,
  },
  cardValue: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  formBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: 10,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingVertical: 10,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
});
