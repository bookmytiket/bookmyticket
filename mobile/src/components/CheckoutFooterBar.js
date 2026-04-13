import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Linking, SafeAreaView } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Feather } from '@expo/vector-icons';

export default function CheckoutFooterBar() {
  const footers = useQuery(api.checkoutFooters.listActive);
  const [modalItem, setModalItem] = useState(null);

  if (!footers || footers.length === 0) return null;

  const handlePress = async (item) => {
    if (item.actionType === 'redirect' && item.redirectUrl) {
      const supported = await Linking.canOpenURL(item.redirectUrl);
      if (supported) {
        await Linking.openURL(item.redirectUrl);
      } else {
        // Fallback for internal paths if they aren't deep links
        console.log("Could not open URL: ", item.redirectUrl);
      }
    } else if (item.actionType === 'modal') {
      setModalItem(item);
    }
  };

  // Map common Lucide icons to Feather equivalents for Expo
  const getIconName = (name) => {
    const map = {
      'LifeBuoy': 'life-buoy',
      'Shield': 'shield',
      'ShieldAlert': 'shield',
      'CreditCard': 'credit-card',
      'Tag': 'tag',
      'Percent': 'percent',
      'Info': 'info',
      'HelpCircle': 'help-circle'
    };
    return map[name] || 'info';
  };

  return (
    <>
      <View style={styles.container}>
        {footers.map((item) => (
          <TouchableOpacity 
            key={item._id} 
            style={styles.navItem} 
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            <Feather name={getIconName(item.iconName)} size={20} color="#64748b" style={styles.icon} />
            <Text style={styles.navTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.navDesc} numberOfLines={1}>{item.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Modal Popup for internal info (like Refund Policy) */}
      <Modal
        visible={!!modalItem}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Feather name={modalItem ? getIconName(modalItem.iconName) : 'info'} size={24} color="#f43f5e" />
                <Text style={styles.modalTitle}>{modalItem?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalItem(null)}>
                <Feather name="x" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalText}>{modalItem?.modalContent}</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalItem(null)}>
              <Text style={styles.modalCloseBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 8,
    // Add safe area padding if placed at absolute bottom, but we'll stack it below scroll layout
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    padding: 6,
  },
  icon: {
    marginBottom: 4,
  },
  navTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 2
  },
  navDesc: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginLeft: 8
  },
  modalText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 24
  },
  modalCloseBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center'
  },
  modalCloseBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  }
});
