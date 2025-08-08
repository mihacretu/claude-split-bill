import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';

const QuantityModal = ({ visible, item, person, maxQuantity, onConfirm, onCancel }) => {
  const [selectedQuantity, setSelectedQuantity] = useState('1');

  const handleConfirm = () => {
    const quantity = parseInt(selectedQuantity) || 1;
    if (quantity > 0 && quantity <= maxQuantity) {
      onConfirm(quantity);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>How many {item?.name}?</Text>
          <Text style={styles.modalSubtitle}>for {person?.name}</Text>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => {
                const newQty = Math.max(1, parseInt(selectedQuantity) - 1);
                setSelectedQuantity(newQty.toString());
              }}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            
            <TextInput
              style={styles.quantityInput}
              value={selectedQuantity}
              onChangeText={setSelectedQuantity}
              keyboardType="numeric"
              maxLength={2}
              selectTextOnFocus={true}
            />
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => {
                const newQty = Math.min(maxQuantity, parseInt(selectedQuantity) + 1);
                setSelectedQuantity(newQty.toString());
              }}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.maxQuantityText}>Max: {maxQuantity}</Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Assign</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 280,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    marginHorizontal: 12,
  },
  maxQuantityText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  confirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#4a90e2',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default QuantityModal;