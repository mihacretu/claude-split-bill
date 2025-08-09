import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Draggable } from 'react-native-reanimated-dnd';

const DraggableFoodItem = ({ item, assignmentInfo, quantityAssignments, onDraggingChange }) => {
  console.log('🎨 Rendering draggable food item:', item.name);
  const [isDragging, setIsDragging] = useState(false);
  
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
    <View style={[styles.foodItem, getBackgroundStyle(), isDragging && styles.foodItemDragging]}> 
      {assignmentInfo.isShared && (
        <View style={styles.sharedIconContainer}>
          <Ionicons name="people" size={12} color="#ff8c00" />
        </View>
      )}
      <Draggable 
        data={item}
        style={styles.draggableImageContainer}
        draggingStyle={styles.draggingOverlay}
        onDragStart={() => {
          setIsDragging(true);
          onDraggingChange && onDraggingChange(true);
        }}
        onDragEnd={() => {
          setIsDragging(false);
          onDraggingChange && onDraggingChange(false);
        }}
      >
        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.image }} style={styles.foodImage} />
        </View>
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
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ececec',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    position: 'relative',
    zIndex: 0,
  },
  foodItemDragging: {
    zIndex: 9999,
    elevation: 50,
  },
  foodImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
  },
  quantity: {
    fontSize: 13,
    color: '#475467',
    marginRight: 8,
    minWidth: 28,
    fontWeight: '600',
    backgroundColor: 'rgba(17, 25, 40, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    textAlign: 'center',
  },
  foodDetails: {
    flex: 1,
    marginRight: 8,
  },
  foodName: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  assignmentStatus: {
    fontSize: 12,
    color: '#667085',
    marginTop: 4,
    fontStyle: 'italic',
  },
  foodPrice: {
    fontSize: 14,
    color: '#101828',
    fontWeight: '700',
    backgroundColor: '#F2F4F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  foodItemAssigned: {
    backgroundColor: '#F5FAFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1E9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#4a90e2',
  },
  foodItemShared: {
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderLeftWidth: 3,
    borderLeftColor: '#ff8c00',
  },
  draggableImageContainer: {
    zIndex: 1,
    position: 'relative',
    elevation: 10,
  },
  imageWrapper: {
    width: 56,
    height: 56,
    padding: 2,
    marginRight: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#4a90e2',
    backgroundColor: '#F9FAFB',
    position: 'relative',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  draggingOverlay: {
    zIndex: 9999,
    elevation: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    transform: [{ scale: 1.02 }],
  },
  sharedIconContainer: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default DraggableFoodItem;