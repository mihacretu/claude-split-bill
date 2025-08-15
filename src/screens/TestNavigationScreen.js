import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { Title } from '../components';

export default function TestNavigationScreen({ navigation }) {
  const navigateToSplitScreen = () => {
    navigation.navigate('SplitScreen');
  };

  const navigateToChooseYoursScreen = () => {
    navigation.navigate('ChooseYoursScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <LinearGradient
          colors={[Colors.backgroundTop, Colors.backgroundMid, Colors.backgroundBottom]}
          locations={[0, 0.6, 1]}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={styles.bgGradient}
        />
      </View>
      
      <View style={styles.content}>
        <Title boldText="Test" regularText=" Navigation" style={styles.title} />
        <Text style={styles.subtitle}>Choose a screen to test</Text>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.navigationButton} onPress={navigateToSplitScreen}>
            <View style={styles.buttonContent}>
              <Ionicons name="people" size={24} color={Colors.textOnLightPrimary} />
              <Text style={styles.buttonTitle}>Split Order</Text>
              <Text style={styles.buttonSubtitle}>Assign items to multiple people</Text>
            </View>
            <View style={styles.buttonShadow} />
            <LinearGradient
              colors={[Colors.cardTop, Colors.cardMid, Colors.cardBottom]}
              locations={[0, 0.6, 1]}
              start={{ x: 0.3, y: 0 }}
              end={{ x: 0.7, y: 1 }}
              style={styles.buttonGradient}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navigationButton} onPress={navigateToChooseYoursScreen}>
            <View style={styles.buttonContent}>
              <Ionicons name="person" size={24} color={Colors.textOnLightPrimary} />
              <Text style={styles.buttonTitle}>Choose Yours</Text>
              <Text style={styles.buttonSubtitle}>Select items for yourself only</Text>
            </View>
            <View style={styles.buttonShadow} />
            <LinearGradient
              colors={[Colors.cardTop, Colors.cardMid, Colors.cardBottom]}
              locations={[0, 0.6, 1]}
              start={{ x: 0.3, y: 0 }}
              end={{ x: 0.7, y: 1 }}
              style={styles.buttonGradient}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundMid,
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textOnLightSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    gap: 20,
  },
  navigationButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.personCardStroke,
    overflow: 'hidden',
    position: 'relative',
  },
  buttonContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    zIndex: 1,
  },
  buttonShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.personCardOutline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    zIndex: -1,
  },
  buttonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    zIndex: 0,
  },
  buttonTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textOnLightPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: Colors.textOnLightSecondary,
    textAlign: 'center',
  },
});