import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const BackButton = ({ onPress, style }) => {
  return (
    <TouchableOpacity style={[styles.backButton, style]} onPress={onPress}>
      <Text style={styles.backArrow}>‹</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    marginBottom: 16,
  },
  backArrow: {
    fontSize: 28,
    color: '#333',
    fontWeight: '300',
  },
});

export default BackButton;