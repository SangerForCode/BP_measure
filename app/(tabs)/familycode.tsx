import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

export default function FamilyCodePage() {
  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>👨‍👩‍👧‍👦</Text>
          </View>
          <Text style={styles.title}>Family Code</Text>
          <Text style={styles.subtitle}>Connect with your family members</Text>
        </View>

        {/* Coming Soon Card */}
        <View style={styles.card}>
          <View style={styles.comingSoonIcon}>
            <Text style={styles.comingSoonIconText}>🚧</Text>
          </View>
          
          <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
          
          <Text style={styles.description}>
            We're working hard to bring you family sharing features. Soon you'll be able to:
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔗</Text>
              <Text style={styles.featureText}>Share health data with family members</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>👀</Text>
              <Text style={styles.featureText}>Monitor loved ones' vital signs</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔔</Text>
              <Text style={styles.featureText}>Get alerts for family health updates</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💬</Text>
              <Text style={styles.featureText}>Send health reminders and messages</Text>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Feature in development</Text>
          </View>
        </View>

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Stay tuned for updates! We'll notify you when this feature is ready.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  wrapper: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 32,
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#10B981',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  headerIconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 24,
  },
  comingSoonIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#FEF3C7',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  comingSoonIconText: {
    fontSize: 40,
  },
  comingSoonTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresList: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  backButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#2563EB',
    textAlign: 'center',
    lineHeight: 20,
  },
});