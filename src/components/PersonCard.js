import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { FadeInDown, ZoomIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Droppable, Draggable } from 'react-native-reanimated-dnd';
import { calculatePersonTotal } from '../utils';

const PersonCard = ({ person, assignments, onDrop, getItemAssignmentInfo, quantityAssignments, onStartDrag, onEndDrag, disabled = false, grayed = false, index = 0, shouldAnimateEntrance = true, onAddPress, onRemove, onDeleteModeChange, deleteMode = false }) => {
  const assignedItems = assignments[person.id] || [];
  
  const totalAmount = calculatePersonTotal(person, assignedItems, quantityAssignments, assignments);

  // console.debug('Rendering person card:', person.name, 'items:', assignedItems.length);

  const enterDelay = (index || 0) * 60;

  const rotation = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rotation.value}deg` }] }));
  useEffect(() => {
    if (deleteMode) {
      rotation.value = withRepeat(withTiming(1.6, { duration: 90 }), -1, true);
    } else {
      rotation.value = withTiming(0, { duration: 120 });
    }
  }, [deleteMode, rotation]);


  if (person.isAddButton) {
    return (
      <Animated.View
        entering={shouldAnimateEntrance ? FadeInDown.springify().damping(16).stiffness(180).delay(enterDelay) : undefined}
        style={[
          styles.addPersonCard,
          grayed && styles.grayedCard,
          disabled && styles.disabledCard
        ]}
      >
        <TouchableOpacity activeOpacity={0.8} onPress={onAddPress} style={{ width: '100%', alignItems: 'center' }}>
          <View pointerEvents="none" style={styles.personCardShadow} />
          <LinearGradient
            colors={[Colors.cardTop, Colors.cardMid, Colors.cardBottom]}
            locations={[0, 0.6, 1]}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={styles.cardGradient}
          />
          <View style={[styles.avatarContainer, styles.addPersonContainer, grayed && styles.grayedAvatar]}>
            <Ionicons 
              name="person-add" 
              size={32} 
              color={grayed ? Colors.textOnLightSecondary : Colors.textOnLightPrimary} 
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  const isCurrentUser = person.name === 'You';

  const cardContent = (
    <>
      <View pointerEvents="none" style={styles.personCardShadow} />
      <LinearGradient
        colors={[Colors.cardTop, Colors.cardMid, Colors.cardBottom]}
        locations={[0, 0.6, 1]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={styles.cardGradient}
      />
      <View style={[styles.avatarContainer, grayed && styles.grayedAvatar]}>
        <Animated.Image
          entering={shouldAnimateEntrance ? ZoomIn.springify().damping(16).stiffness(220).delay(enterDelay + 80) : undefined}
          source={{ uri: person.avatar }}
          style={[styles.avatar, grayed && styles.grayedImage]}
        />
      </View>
      <Text style={[styles.personName, grayed && styles.grayedText]}>{person.name}</Text>
      {(parseFloat(totalAmount) > 0 || assignedItems.length > 0 || person.hasFood) && (
        <Text style={styles.personAmount}>{totalAmount}</Text>
      )}
      
      <View style={styles.itemsContainer}>
        {assignedItems.map((item, idx) => {
          const assignmentInfo = getItemAssignmentInfo(item.id);
          const personQuantity = quantityAssignments[item.id]?.[person.id] || 1;
          const showQuantityIndicator = item.quantity > 1;
          
          return (
            <Draggable
              key={`assigned-${item.id}`}
              data={{ item, person }}
              style={{ marginRight: idx < assignedItems.length - 1 ? 8 : 0, position: 'relative', zIndex: 1000000 }}
              draggingStyle={styles.draggingOverlaySmall}
              onDragStart={disabled ? undefined : () => onStartDrag && onStartDrag({ person, item })}
              onDragEnd={disabled ? undefined : () => onEndDrag && onEndDrag()}
              disabled={disabled}
            >
              <Animated.View entering={shouldAnimateEntrance ? ZoomIn.springify().damping(14).stiffness(220).delay(enterDelay + 120 + idx * 40) : undefined} style={styles.personImageContainer}>
                <Animated.Image 
                  entering={shouldAnimateEntrance ? ZoomIn.springify().damping(16).stiffness(260).delay(enterDelay + 150 + idx * 40) : undefined}
                  source={{ uri: item.image }} 
                  style={[styles.personItemImage, grayed && styles.grayedImage]}
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
              </Animated.View>
            </Draggable>
          );
        })}
        
        {person.hasFood && !assignedItems.length && (
          <Animated.Image 
            entering={shouldAnimateEntrance ? ZoomIn.springify().damping(16).stiffness(240).delay(enterDelay + 120) : undefined}
            source={{ uri: person.foodImage }} 
            style={styles.personItemImage} 
          />
        )}
      </View>
    </>
  );

  if (disabled) {
    return (
      <Animated.View
        entering={shouldAnimateEntrance ? FadeInDown.springify().damping(16).stiffness(180).delay(enterDelay) : undefined}
        style={[
          styles.personCard,
          (person.hasFood || assignedItems.length > 0) && styles.personCardWithFood,
          isCurrentUser && styles.currentUserCard,
          grayed && styles.grayedCard,
          disabled && styles.disabledCard
        ]}
      >
        {cardContent}
      </Animated.View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => {
        // If already in delete mode, cancel it
        if (deleteMode && !disabled && !person.isAddButton && person.name !== 'You') {
          onDeleteModeChange && onDeleteModeChange(person.id, false);
        }
      }}
      onLongPress={() => {
        if (!disabled && !person.isAddButton && person.name !== 'You') {
          onDeleteModeChange && onDeleteModeChange(person.id, true);
        }
      }}
      delayLongPress={300}
    >
    <Animated.View entering={shouldAnimateEntrance ? FadeInDown.springify().damping(16).stiffness(180).delay(enterDelay) : undefined} style={shakeStyle}>
      <Droppable
        droppableId={`person-${person.id}`}
        onDrop={(item) => onDrop(item, person)}
        style={[
          styles.personCard,
          (person.hasFood || assignedItems.length > 0) && styles.personCardWithFood,
          isCurrentUser && styles.currentUserCard,
          grayed && styles.grayedCard
        ]}
        activeStyle={styles.personCardActive}
      >
        {cardContent}
        {deleteMode && !disabled && !person.isAddButton && person.name !== 'You' && (
          <Animated.View entering={ZoomIn.springify()} style={styles.removeBtn}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => { 
                onRemove && onRemove(person); 
                onDeleteModeChange && onDeleteModeChange(person.id, false); 
              }}
              style={{ width: 26, height: 26, justifyContent: 'center', alignItems: 'center' }}
            >
              <Ionicons name="close" size={14} color="#ef4444" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </Droppable>
    </Animated.View>
    </TouchableOpacity>
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
    elevation: 0,
    overflow: 'visible',
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.22)',
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
  draggingOverlaySmall: {
    zIndex: 10000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    transform: [{ scale: 1.05 }],
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
  grayedCard: {
    opacity: 0.5,
  },
  disabledCard: {
    pointerEvents: 'none',
  },
  grayedAvatar: {
    opacity: 0.6,
  },
  grayedImage: {
    opacity: 0.6,
  },
  grayedText: {
    opacity: 0.6,
    color: Colors.textOnLightSecondary,
  },
});

export default PersonCard;

