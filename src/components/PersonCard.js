import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Droppable } from 'react-native-reanimated-dnd';
import { calculatePersonTotal } from '../utils';

const PersonCard = ({ person, assignments, onDrop, getItemAssignmentInfo, quantityAssignments }) => {
  const assignedItems = assignments[person.id] || [];
  
  const totalAmount = calculatePersonTotal(person, assignedItems, quantityAssignments, assignments);

  console.log('🎯 Rendering person card:', person.name, 'assigned items:', assignedItems.length);

  if (person.isAddButton) {
    return (
      <View style={styles.addPersonCard}>
        <View pointerEvents="none" style={styles.personCardShadow} />
        <LinearGradient
          colors={[Colors.cardTop, Colors.cardMid, Colors.cardBottom]}
          locations={[0, 0.6, 1]}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={styles.cardGradient}
        />
        <View style={[styles.avatarContainer, styles.addPersonContainer]}>
          <Ionicons name="person-add" size={32} color={Colors.textOnLightPrimary} />
        </View>
      </View>
    );
  }

  const isCurrentUser = person.name === 'You';

  return (
    <Droppable
      droppableId={`person-${person.id}`}
      onDrop={(item) => onDrop(item, person)}
      style={[
        styles.personCard,
        (person.hasFood || assignedItems.length > 0) && styles.personCardWithFood,
        isCurrentUser && styles.currentUserCard
      ]}
      activeStyle={styles.personCardActive}
    >
      <View pointerEvents="none" style={styles.personCardShadow} />
      <LinearGradient
        colors={[Colors.cardTop, Colors.cardMid, Colors.cardBottom]}
        locations={[0, 0.6, 1]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={styles.cardGradient}
      />
      <View style={styles.avatarContainer}>
        <Image source={{ uri: person.avatar }} style={styles.avatar} />
      </View>
      <Text style={styles.personName}>{person.name}</Text>
      {(parseFloat(totalAmount) > 0 || assignedItems.length > 0 || person.hasFood) && (
        <Text style={styles.personAmount}>{totalAmount}</Text>
      )}
      
      <View style={styles.itemsContainer}>
        {assignedItems.map((item, index) => {
          const assignmentInfo = getItemAssignmentInfo(item.id);
          const personQuantity = quantityAssignments[item.id]?.[person.id] || 1;
          const showQuantityIndicator = item.quantity > 1;
          
          return (
            <View key={`assigned-${item.id}-${index}`} style={[styles.personImageContainer, { marginRight: index < assignedItems.length - 1 ? 8 : 0 }]}>
              <Image 
                source={{ uri: item.image }} 
                style={styles.personItemImage}
              />
              {showQuantityIndicator && (
                <View style={styles.quantityIndicator}>
                  <Text style={styles.quantityIndicatorText}>{personQuantity}</Text>
                </View>
              )}
              {assignmentInfo.isShared && !showQuantityIndicator && (
                <View style={styles.sharedIndicator}>
                  <Ionicons name="people" size={8} color="#fff" />
                </View>
              )}
            </View>
          );
        })}
        
        {person.hasFood && !assignedItems.length && (
          <Image 
            source={{ uri: person.foodImage }} 
            style={styles.personItemImage} 
          />
        )}
      </View>
    </Droppable>
  );
};

const styles = StyleSheet.create({
  personCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 8,
    width: 100,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.personCardStroke,
    zIndex: 0,
    overflow: 'visible',
  },
  // Soft darker contour similar to menu items but with darker tone
  personCardShadow: {
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
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    zIndex: -1,
  },
  personCardWithFood: {
    paddingBottom: 10,
  },
  addPersonCard: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 8,
    width: 100,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'visible',
    zIndex: 0,
  },
  selectedPersonCard: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 0,
    zIndex: 0,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 6,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  personName: {
    fontSize: 14,
    color: Colors.textOnLightPrimary,
    fontWeight: '600',
    marginBottom: 0,
    textAlign: 'center',
  },
  personAmount: {
    fontSize: 16,
    color: Colors.textOnLightPrimary,
    fontWeight: 'bold',
    marginTop: 2,
    marginBottom: 0,
  },
  itemsContainer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  personItemImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  addPersonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  personCardActive: {
    backgroundColor: Colors.surfaceStrong,
    borderColor: Colors.accentBlue,
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
    backgroundColor: Colors.surfaceStrong,
  },
  quantityIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F08430',
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityIndicatorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  personImageContainer: {
    position: 'relative',
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  sharedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F08430',
    borderWidth: 1,
    borderColor: '#fff',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PersonCard;