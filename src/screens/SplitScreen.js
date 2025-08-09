import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DropProvider } from 'react-native-reanimated-dnd';
import { DraggableFoodItem, QuantityModal, PersonCard, BackButton, Title } from '../components';
import { foodItems, people, getItemAssignmentInfo, handleItemDrop, handleQuantityAssignment } from '../services';





export default function SplitScreen() {
  const [assignments, setAssignments] = useState({});
  const [quantityAssignments, setQuantityAssignments] = useState({});
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState(null);
  const [isAnyDragging, setIsAnyDragging] = useState(false);

  const handleDrop = (draggedItem, targetPerson) => {
    const result = handleItemDrop(
      draggedItem, 
      targetPerson, 
      assignments, 
      quantityAssignments,
      (pendingData) => {
        setPendingAssignment(pendingData);
        setShowQuantityModal(true);
      }
    );
    
    if (result.shouldUpdate) {
      setAssignments(result.newAssignments);
    }
  };

  const handleQuantityConfirm = (quantity) => {
    const result = handleQuantityAssignment(
      pendingAssignment, 
      quantity, 
      assignments, 
      quantityAssignments
    );
    
    if (result.shouldUpdate) {
      setAssignments(result.newAssignments);
      setQuantityAssignments(result.newQuantityAssignments);
    }
    
    setShowQuantityModal(false);
    setPendingAssignment(null);
  };

  const handleQuantityCancel = () => {
    setShowQuantityModal(false);
    setPendingAssignment(null);
  };


  // Get all assigned item IDs to check assignment status
  const assignedItemIds = Object.values(assignments).flat().map(item => item.id);

  return (
    <DropProvider key={`provider-${assignedItemIds.length}`}>
      <SafeAreaView style={styles.container}>
        <View style={styles.cardContainer}>
          <BackButton />
          
          <Title boldText="Split" regularText=" order" />
          <View style={styles.hintRow}>
            <Ionicons name="hand-right" size={14} color="#4a90e2" />
            <Text style={styles.hintText}>Drag a dish image onto a person to assign</Text>
          </View>
          
          <View style={[styles.foodItemsContainer, isAnyDragging && styles.foodItemsContainerDragging]}>
            {foodItems.map((item) => (
              <DraggableFoodItem 
                key={item.id} 
                item={item}
                assignmentInfo={getItemAssignmentInfo(item.id, assignments)}
                quantityAssignments={quantityAssignments}
                onDraggingChange={setIsAnyDragging}
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
                getItemAssignmentInfo={(itemId) => getItemAssignmentInfo(itemId, assignments)}
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
    position: 'relative',
    overflow: 'visible',
  },
  foodItemsContainer: {
    marginBottom: 40,
    position: 'relative',
    zIndex: 1,
  },
  foodItemsContainerDragging: {
    zIndex: 9998,
    elevation: 40,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: 'rgba(74, 144, 226, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  hintText: {
    marginLeft: 6,
    color: '#2f5fa3',
    fontSize: 12,
    fontWeight: '500',
  },
  peopleContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'flex-start',
    position: 'relative',
    zIndex: 0,
  },
  peopleScrollView: {
    flexGrow: 0,
    position: 'relative',
    zIndex: 0,
  },
});