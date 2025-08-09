import React from 'react';
import { Text, StyleSheet } from 'react-native';

const Title = ({ boldText, regularText, style }) => {
  return (
    <Text style={[styles.title, style]}>
      <Text style={styles.titleBold}>{boldText}</Text>
      <Text style={styles.titleRegular}>{regularText}</Text>
    </Text>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    color: '#1a1a1a',
    marginBottom: 0,
  },
  titleBold: {
    fontWeight: 'bold',
  },
  titleRegular: {
    fontWeight: 'normal',
  },
});

export default Title;