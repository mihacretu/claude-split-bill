import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Draggable } from 'react-native-reanimated-dnd';

const DraggableFoodItem = ({ item, assignmentInfo, quantityAssignments }) => {
  console.log('🎨 Rendering draggable food item:', item.name);
  
  const getBackgroundStyle = () => {
    if (!assignmentInfo.isAssigned) return null;
    if (assignmentInfo.isShared) return styles.foodItemShared;
    return styles.foodItemAssigned;
  };

  const assignedQuantities = quantityAssignments[item.id] || {};
  const totalAssigned = Object.values(assignedQuantities).reduce((sum, qty) => sum + qty, 0);
  const remainingQuantity = item.quantity - totalAssigned;
  const hasMultipleQuantity = item.quantity > 1;
  const isPartiallyAssigned = totalAssigned > 0 && remainingQuantity > 0;
  const isFullyAssigned = totalAssigned > 0 && remainingQuantity === 0;
  
  return (
    <View style={[styles.foodItem, getBackgroundStyle()]}>
      {assignmentInfo.isShared && (
        <View style={styles.sharedIconContainer}>
          <Ionicons name="people" size={12} color="#ff8c00" />
        </View>
      )}
      <Draggable 
        data={item}
        style={styles.draggableImageContainer}
      >
        <Image source={{ uri: item.image }} style={styles.foodImage} />
      </Draggable>
      <Text style={styles.quantity}>{item.quantity} ×</Text>
      <View style={styles.foodDetails}>
        <Text style={styles.foodName}>{item.name}</Text>
        {hasMultipleQuantity && totalAssigned > 0 && (
          <Text style={styles.assignmentStatus}>
            {remainingQuantity > 0 ? 
              `Assigned: ${totalAssigned} • Remaining: ${remainingQuantity}` : 
              `Fully assigned (${totalAssigned})`
            }
          </Text>
        )}
      </View>
      <Text style={styles.foodPrice}>{item.price}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  foodImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  quantity: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
    minWidth: 24,
  },
  foodDetails: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  assignmentStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  foodPrice: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  foodItemAssigned: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  foodItemShared: {
    backgroundColor: '#fff4e6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff8c00',
  },
  draggableImageContainer: {
    zIndex: 1,
  },
  sharedIconContainer: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default DraggableFoodItem;