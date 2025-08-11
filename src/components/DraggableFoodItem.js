import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../theme/colors';
import { Draggable } from 'react-native-reanimated-dnd';

const DraggableFoodItem = ({ item, assignmentInfo, quantityAssignments, onDraggingChange, isLastInPage }) => {
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
    <View style={[styles.foodItem, getBackgroundStyle(), isDragging && styles.foodItemDragging, isLastInPage && styles.lastFoodItem]}>
      {/* Background gradient removed for transparent look */}
      {assignmentInfo.isShared && (
        <View style={styles.sharedIconContainer}>
          <Ionicons name="people" size={12} color="#ff8c00" />
        </View>
      )}
      <Draggable 
        data={item}
        style={[styles.draggableImageContainer, isDragging && styles.draggingOverlay]}
        onDragStart={() => {
          setIsDragging(true);
          onDraggingChange && onDraggingChange(true);
        }}
        onDragEnd={() => {
          setIsDragging(false);
          onDraggingChange && onDraggingChange(false);
        }}
      >
        <View style={[styles.imageWrapper, isDragging && styles.imageWrapperDragging]}>
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
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    zIndex: -1,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    // no shadow for a flat, blended look
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    position: 'relative',
    zIndex: 0,
  },
  foodItemDragging: {
    zIndex: 9999,
    elevation: 50,
  },
  lastFoodItem: {
    marginBottom: 8,
  },
  foodImage: {
    width: 44,
    height: 44,
    // Match the visual rounding of the dashed border on the wrapper.
    // Wrapper has borderRadius: 10 with padding: 2, so inner image
    // radius should be wrapperRadius - padding to align the arc.
    borderRadius: 8,
    overflow: 'hidden',
  },
  quantity: {
    fontSize: 12,
    color: Colors.textOnLightSecondary,
    marginRight: 6,
    minWidth: 24,
    fontWeight: '600',
    backgroundColor: Colors.quantityPillBg,
    paddingHorizontal: 6,
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
    fontSize: 15,
    color: Colors.textOnLightPrimary,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  assignmentStatus: {
    fontSize: 12,
    color: Colors.textOnLightSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  foodPrice: {
    fontSize: 13,
    color: Colors.textOnLightPrimary,
    fontWeight: '700',
    backgroundColor: Colors.pricePillBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  foodItemAssigned: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D5E4D8',
    borderLeftWidth: 3,
    borderLeftColor: Colors.accentBlue,
  },
  foodItemShared: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F7D5A6',
    borderLeftWidth: 3,
    borderLeftColor: Colors.sharedOrange,
  },
  draggableImageContainer: {
    zIndex: 100,
    position: 'relative',
    elevation: 10,
  },
  imageWrapper: {
    width: 48,
    height: 48,
    padding: 2,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.accentBlue,
    backgroundColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
    zIndex: 1,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  draggingOverlay: {
    zIndex: 9999,
    elevation: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    transform: [{ scale: 1.02 }],
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  imageWrapperDragging: {
    marginRight: 0,
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
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
});

export default DraggableFoodItem;