import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DropProvider, Draggable, Droppable } from 'react-native-reanimated-dnd';

const foodItems = [
  {
    id: 1,
    name: 'Roasted Potato Salad',
    price: '$15.00',
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=100&h=100&fit=crop&crop=center'
  },
  {
    id: 2,
    name: 'Orange Juice',
    price: '8.00',
    quantity: 3,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=100&h=100&fit=crop&crop=center'
  },
  {
    id: 3,
    name: 'Croissant',
    price: '7.50',
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=100&h=100&fit=crop&crop=center'
  },
  {
    id: 4,
    name: 'Hot Cheese Burrito',
    price: '8.00',
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=100&h=100&fit=crop&crop=center'
  }
];

const people = [
  {
    id: 1,
    name: 'You',
    hasFood: false,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face'
  },
  {
    id: 2,
    name: 'Tom',
    hasFood: false,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face'
  },
  {
    id: 3,
    name: 'Jessica',
    hasFood: false,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face'
  },
  {
    id: 4,
    name: 'Add Person',
    isAddButton: true
  }
];

const DraggableFoodItem = ({ item, assignmentInfo, quantityAssignments }) => {
  console.log('🎨 Rendering draggable food item:', item.name);
  
  const getBackgroundStyle = () => {
    if (!assignmentInfo.isAssigned) return null;
    if (assignmentInfo.isShared) return styles.foodItemShared;
    return styles.foodItemAssigned;
  };

  // Calculate assigned quantities for this item
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
      <View style={styles.quantitySection}>
        <Text style={styles.quantity}>{item.quantity} ×</Text>
        {hasMultipleQuantity && totalAssigned > 0 && (
          <View style={styles.assignmentIndicator}>
            <Text style={styles.assignmentText}>
              {totalAssigned}/{item.quantity}
            </Text>
            {remainingQuantity > 0 && (
              <View style={styles.remainingDot}>
                <Text style={styles.remainingText}>{remainingQuantity}</Text>
              </View>
            )}
          </View>
        )}
      </View>
      <Text style={styles.foodName}>{item.name}</Text>
      <Text style={styles.foodPrice}>{item.price}</Text>
    </View>
  );
};

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

const PersonCard = ({ person, assignments, onDrop, getItemAssignmentInfo, quantityAssignments }) => {
  const assignedItems = assignments[person.id] || [];
  
  // Calculate total amount for assigned items based on quantities
  const assignedTotal = assignedItems.reduce((sum, item) => {
    const price = parseFloat(item.price.replace('$', '')) || 0;
    const personQuantity = quantityAssignments[item.id]?.[person.id] || 1;
    
    if (item.quantity > 1) {
      // For items with quantity > 1, calculate price per unit * assigned quantity
      const pricePerUnit = price / item.quantity;
      return sum + (pricePerUnit * personQuantity);
    } else {
      // For single quantity items, use full price
      return sum + price;
    }
  }, 0);
  
  // Add original person amount if exists
  const originalAmount = person.amount ? parseFloat(person.amount) : 0;
  const totalAmount = (originalAmount + assignedTotal).toFixed(2);

  console.log('🎯 Rendering person card:', person.name, 'assigned items:', assignedItems.length);

  if (person.isAddButton) {
    return (
      <View style={styles.addPersonCard}>
        <View style={[styles.avatarContainer, styles.addPersonContainer]}>
          <Ionicons name="person-add" size={32} color="#666" />
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
      <View style={styles.avatarContainer}>
        <Image source={{ uri: person.avatar }} style={styles.avatar} />
      </View>
      <Text style={styles.personName}>{person.name}</Text>
      {(parseFloat(totalAmount) > 0 || assignedItems.length > 0 || person.hasFood) && (
        <Text style={styles.personAmount}>{totalAmount}</Text>
      )}
      
      <View style={styles.itemsContainer}>
        {/* Show existing assigned items with proper spacing */}
        {assignedItems.map((item, index) => {
          const assignmentInfo = getItemAssignmentInfo(item.id);
          const personQuantity = quantityAssignments[item.id]?.[person.id] || 1;
          const showQuantityIndicator = item.quantity > 1 && assignmentInfo.isShared;
          
          return (
            <View key={`assigned-${item.id}-${index}`} style={styles.personImageContainer}>
              <Image 
                source={{ uri: item.image }} 
                style={[styles.personItemImage, { marginRight: index < assignedItems.length - 1 ? 8 : 0 }]} 
              />
              {showQuantityIndicator && (
                <View style={styles.quantityIndicator}>
                  <Text style={styles.quantityIndicatorText}>{personQuantity}</Text>
                </View>
              )}
              {assignmentInfo.isShared && !showQuantityIndicator && (
                <View style={styles.sharedIndicator} />
              )}
            </View>
          );
        })}
        
        {/* Show original food item if person already has food */}
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

export default function SplitScreen() {
  const [assignments, setAssignments] = useState({});
  const [quantityAssignments, setQuantityAssignments] = useState({});
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState(null);

  const handleDrop = (draggedItem, targetPerson) => {
    console.log('🎯 Drop event:', draggedItem?.name, 'on', targetPerson?.name);
    
    if (draggedItem && targetPerson && !targetPerson.isAddButton) {
      // Check if person already has this item
      const currentAssignments = assignments[targetPerson.id] || [];
      const alreadyHasItem = currentAssignments.some(item => item.id === draggedItem.id);
      
      if (alreadyHasItem) {
        console.log('❌ Person already has this item');
        return; // Don't assign if already has the item
      }

      // Check if item has quantity > 1
      const hasMultipleQuantity = draggedItem.quantity > 1;
      
      if (hasMultipleQuantity) {
        // Calculate remaining quantity available
        const assignedQuantities = quantityAssignments[draggedItem.id] || {};
        const totalAssigned = Object.values(assignedQuantities).reduce((sum, qty) => sum + qty, 0);
        const remainingQuantity = draggedItem.quantity - totalAssigned;
        
        if (remainingQuantity > 0) {
          // Show quantity selection modal for items with quantity > 1
          setPendingAssignment({
            item: draggedItem,
            person: targetPerson,
            maxQuantity: remainingQuantity
          });
          setShowQuantityModal(true);
        }
      } else {
        // Normal assignment for items with quantity 1
        console.log('✅ Assigning item to person');
        setAssignments(prev => ({
          ...prev,
          [targetPerson.id]: [...(prev[targetPerson.id] || []), draggedItem]
        }));
      }
    }
  };

  const handleQuantityConfirm = (quantity) => {
    if (pendingAssignment) {
      const { item, person } = pendingAssignment;
      
      // Assign the item to the person
      setAssignments(prev => ({
        ...prev,
        [person.id]: [...(prev[person.id] || []), item]
      }));
      
      // Set the specific quantity assignment
      setQuantityAssignments(prev => ({
        ...prev,
        [item.id]: {
          ...prev[item.id],
          [person.id]: quantity
        }
      }));
      
      console.log(`✅ Assigned ${quantity} ${item.name} to ${person.name}`);
    }
    
    setShowQuantityModal(false);
    setPendingAssignment(null);
  };

  const handleQuantityCancel = () => {
    setShowQuantityModal(false);
    setPendingAssignment(null);
  };

  // Get assignment counts for each item
  const getItemAssignmentInfo = (itemId) => {
    const assignedPeople = [];
    Object.entries(assignments).forEach(([personId, items]) => {
      if (items.some(item => item.id === itemId)) {
        assignedPeople.push(personId);
      }
    });
    return {
      count: assignedPeople.length,
      people: assignedPeople,
      isAssigned: assignedPeople.length > 0,
      isShared: assignedPeople.length > 1
    };
  };

  // Get all assigned item IDs to check assignment status
  const assignedItemIds = Object.values(assignments).flat().map(item => item.id);

  return (
    <DropProvider key={`provider-${assignedItemIds.length}`}>
      <SafeAreaView style={styles.container}>
        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>
            <Text style={styles.titleBold}>Split</Text>
            <Text style={styles.titleRegular}> order</Text>
          </Text>
          
          <View style={styles.foodItemsContainer}>
            {foodItems.map((item) => (
              <DraggableFoodItem 
                key={item.id} 
                item={item}
                assignmentInfo={getItemAssignmentInfo(item.id)}
                quantityAssignments={quantityAssignments}
              />
            ))}
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.peopleContainer}
            style={styles.peopleScrollView}
            scrollEnabled={true}
            nestedScrollEnabled={false}
          >
            {people.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                assignments={assignments}
                onDrop={handleDrop}
                getItemAssignmentInfo={getItemAssignmentInfo}
                quantityAssignments={quantityAssignments}
              />
            ))}
          </ScrollView>
          
        </View>
        
        <QuantityModal
          visible={showQuantityModal}
          item={pendingAssignment?.item}
          person={pendingAssignment?.person}
          maxQuantity={pendingAssignment?.maxQuantity}
          onConfirm={handleQuantityConfirm}
          onCancel={handleQuantityCancel}
        />
      </SafeAreaView>
    </DropProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8e8e8',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flex: 1,
  },
  backButton: {
    marginBottom: 16,
  },
  backArrow: {
    fontSize: 28,
    color: '#333',
    fontWeight: '300',
  },
  title: {
    fontSize: 36,
    color: '#1a1a1a',
    marginBottom: 40,
  },
  titleBold: {
    fontWeight: 'bold',
  },
  titleRegular: {
    fontWeight: 'normal',
  },
  foodItemsContainer: {
    marginBottom: 40,
  },
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
    minWidth: 24,
    textAlign: 'center',
  },
  foodName: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
    fontWeight: '500',
  },
  foodPrice: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  peopleContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'flex-start',
  },
  peopleScrollView: {
    flexGrow: 0,
  },
  personCard: {
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 8,
    width: 100,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  personCardWithFood: {
    paddingBottom: 10,
  },
  addPersonCard: {
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 8,
    width: 100,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    elevation: 2,
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
    color: '#1a1a1a',
    fontWeight: '500',
    marginBottom: 0,
    textAlign: 'center',
  },
  personAmount: {
    fontSize: 16,
    color: '#1a1a1a',
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
    marginBottom: 4,
  },
  addPersonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragging: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  beingDragged: {
    backgroundColor: '#f0f0f0',
  },
  personCardActive: {
    backgroundColor: '#e8f4fd',
    borderColor: '#4a90e2',
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  dragPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#4a90e2',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
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
  personImageContainer: {
    position: 'relative',
  },
  sharedIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff8c00',
    borderWidth: 1,
    borderColor: '#fff',
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
  currentUserCard: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
    backgroundColor: '#faf7ff',
  },
  quantityIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff8c00',
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
  quantitySection: {
    alignItems: 'center',
    marginRight: 8,
  },
  assignmentIndicator: {
    marginTop: 2,
    alignItems: 'center',
  },
  assignmentText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  remainingDot: {
    marginTop: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: 'bold',
  },
});