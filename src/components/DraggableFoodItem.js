import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../theme/colors';
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
      <LinearGradient
        colors={[Colors.backgroundTop, Colors.backgroundMid, Colors.backgroundBottom]}
        locations={[0, 0.6, 1]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={styles.cardGradient}
      />
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
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    zIndex: -1,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
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
    color: Colors.textOnLightSecondary,
    marginRight: 8,
    minWidth: 28,
    fontWeight: '600',
    backgroundColor: Colors.quantityPillBg,
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
    fontSize: 14,
    color: Colors.textOnLightPrimary,
    fontWeight: '700',
    backgroundColor: Colors.pricePillBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  foodItemAssigned: {
    backgroundColor: '#F0F6F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D5E4D8',
    borderLeftWidth: 3,
    borderLeftColor: Colors.accentBlue,
  },
  foodItemShared: {
    backgroundColor: '#FFF7E2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F7D5A6',
    borderLeftWidth: 3,
    borderLeftColor: Colors.shared,
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
    borderColor: Colors.dottedGreen,
    backgroundColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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