import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { DropProvider } from 'react-native-reanimated-dnd';
import { DraggableFoodItem, QuantityModal, PersonCard, BackButton, Title } from '../components';
import { foodItems, people, getItemAssignmentInfo, handleItemDrop, handleQuantityAssignment } from '../services';





export default function SplitScreen() {
  const [assignments, setAssignments] = useState({});
  const [quantityAssignments, setQuantityAssignments] = useState({});
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState(null);

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
          
          <View style={styles.foodItemsContainer}>
            {foodItems.map((item) => (
              <DraggableFoodItem 
                key={item.id} 
                item={item}
                assignmentInfo={getItemAssignmentInfo(item.id, assignments)}
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
  },
  foodItemsContainer: {
    marginBottom: 40,
  },
  peopleContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'flex-start',
  },
  peopleScrollView: {
    flexGrow: 0,
  },
});