import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { DropProvider } from 'react-native-reanimated-dnd';
import { DraggableFoodItem, QuantityModal, PersonCard, BackButton, Title, SwapBarPager, AddFriendsPanel } from '../components';
import { unassignItemFromPerson, removePersonAndUnassign } from '../services';
import { foodItems, people, nearbyFriends, getItemAssignmentInfo, handleItemDrop, handleQuantityAssignment } from '../services';





export default function SplitScreen({ navigation }) {
  const [assignments, setAssignments] = useState({});
  const [quantityAssignments, setQuantityAssignments] = useState({});
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState(null);
  const [isAnyDragging, setIsAnyDragging] = useState(false);
  // Remount nonce to clear DnD overlays; we'll preserve carousel position manually
  const [dragNonce, setDragNonce] = useState(0);
  const peopleScrollRef = useRef(null);
  const peopleScrollXRef = useRef(0);
  const hasAnimatedOnceRef = useRef(false);
  const [draggedFromPerson, setDraggedFromPerson] = useState(null); // { person, item }
  const [showAddFriends, setShowAddFriends] = useState(false);
  const [availableFriends, setAvailableFriends] = useState(nearbyFriends);
  const [peopleList, setPeopleList] = useState(people);
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef(null);
  const [activeDeletePersonId, setActiveDeletePersonId] = useState(null);

  // Pagination logic for vertical list
  const itemsPerPage = 4;
  const totalPages = Math.ceil(foodItems.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFoodItems = foodItems.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleDrop = (draggedItem, targetPerson) => {
    // If user drops a friend tile from AddFriendsPanel onto the people strip, append a new person
    if (draggedItem?.type === 'person' && draggedItem?.person) {
      // Avoid duplicates by name/id
      const exists = peopleList.some((p) => p.name === draggedItem.person.name || p.id === draggedItem.person.id);
      if (!exists) {
        const newPerson = { id: Date.now(), name: draggedItem.person.name, avatar: draggedItem.person.avatar, hasFood: false };
        setPeopleList((prev) => {
          const addIdx = Math.max(0, prev.findIndex((p) => p.isAddButton));
          const arr = prev.slice();
          arr.splice(addIdx, 0, newPerson);
          return arr;
        });
        setAvailableFriends((prev) => prev.filter((f) => f.id !== draggedItem.person.id));
      }
      setShowAddFriends(false);
      setDragNonce((n) => n + 1);
      return;
    }
    const result = handleItemDrop(
      draggedItem, 
      targetPerson, 
      assignments, 
      quantityAssignments,
      (pendingData) => {
        setPendingAssignment(pendingData);
        setShowQuantityModal(true);
        // Clear any lingering drag preview while the quantity modal is open
        setDragNonce((n) => n + 1);
      }
    );
    
    if (result.shouldUpdate) {
      setAssignments(result.newAssignments);
      if (result.newQuantityAssignments) {
        setQuantityAssignments(result.newQuantityAssignments);
      }
      // A successful drop consumed the drag, clear the dragged-from state
      setDraggedFromPerson(null);
    }
    // Always clear any lingering drag preview after drop
    requestAnimationFrame(() => setDragNonce((n) => n + 1));

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
    // Also clear any temporary previews after confirming quantity
    requestAnimationFrame(() => setDragNonce((n) => n + 1));
  };

  const handleQuantityCancel = () => {
    setShowQuantityModal(false);
    setPendingAssignment(null);
  };


  // Get all assigned item IDs to check assignment status
  const assignedItemIds = Object.values(assignments).flat().map(item => item.id);

  useEffect(() => {
    hasAnimatedOnceRef.current = true;
  }, []);

  // After provider remount, restore people carousel scroll offset
  useEffect(() => {
    requestAnimationFrame(() => {
      if (peopleScrollRef.current) {
        try {
          peopleScrollRef.current.scrollTo({ x: peopleScrollXRef.current, animated: false });
        } catch (_) {}
      }
    });
  }, [dragNonce]);


  // Cancel delete mode for all cards
  const cancelAllDeleteModes = useCallback(() => {
    if (activeDeletePersonId !== null) {
      setActiveDeletePersonId(null);
    }
  }, [activeDeletePersonId]);

  // Memoize the onRemove callback to prevent unnecessary re-renders
  const handleRemovePerson = useCallback((p) => {
    if (p.name === 'You' || p.isAddButton) {
      return;
    }
    
    const result = removePersonAndUnassign(p, assignments, quantityAssignments);
    if (result.shouldUpdate) {
      setAssignments(result.newAssignments);
      setQuantityAssignments(result.newQuantityAssignments);
    }
    
    // Remove from people list (immutable)
    setPeopleList((prev) => prev.filter((pp) => pp.id !== p.id));
    
    // Clear delete mode
    setActiveDeletePersonId(null);
  }, [peopleList, assignments, quantityAssignments]);

  return (
    <DropProvider key={`provider-${dragNonce}`}>
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
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isAnyDragging}
        >
          <View style={styles.headerRow}>
            <BackButton style={styles.backInline} onPress={() => navigation.goBack()} />
            <Title boldText="Split" regularText=" order" style={styles.titleInline} />
          </View>
          <View style={styles.hintRow}>
            <Ionicons name="hand-right" size={14} color={'rgba(79, 209, 197, 0.8)'} />
            <Text style={styles.hintText}>Drag a dish image onto a person to assign</Text>
          </View>
          
          <View style={[styles.foodItemsContainer, isAnyDragging && styles.foodItemsContainerDragging]}>
            {currentFoodItems.map((item) => (
              <DraggableFoodItem 
                key={item.id} 
                item={item}
                assignmentInfo={getItemAssignmentInfo(item.id, assignments)}
                quantityAssignments={quantityAssignments}
                onDraggingChange={(dragging) => {
                  setIsAnyDragging(dragging);
                  if (dragging) {
                    // Dragging from the menu
                    setDraggedFromPerson(null);
                  }
                }}
              />
            ))}
          </View>

          <SwapBarPager
            key={`swapbar-${totalPages}`}
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={handlePreviousPage}
            onNext={handleNextPage}
            onSetPage={(p) => setCurrentPage(p)}
          />
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.peopleContainer}
            style={styles.peopleScrollView}
            ref={peopleScrollRef}
            scrollEnabled={!isAnyDragging}
            nestedScrollEnabled={false}
            onScroll={(e) => { peopleScrollXRef.current = e.nativeEvent.contentOffset.x; }}
            scrollEventThrottle={16}
          >
            {peopleList.map((person, idx) => (
              <PersonCard
                key={`person-${person.id}-${person.name}`}
                index={idx}
                shouldAnimateEntrance={!hasAnimatedOnceRef.current}
                person={person}
                assignments={assignments}
                onDrop={handleDrop}
                onAddPress={() => setShowAddFriends(true)}
                onDeleteModeChange={(personId, active) => {
                  if (active) {
                    // Only one person can be in delete mode at a time
                    setActiveDeletePersonId(personId);
                  } else {
                    if (activeDeletePersonId === personId) {
                      setActiveDeletePersonId(null);
                    }
                  }
                }}
                deleteMode={activeDeletePersonId === person.id}
                onRemove={handleRemovePerson}
                // When a drag starts inside a person card
                onStartDrag={(payload) => {
                  setDraggedFromPerson(payload); // { person, item }
                }}
                // When drag ends, handle auto-unassign if not dropped on valid target
                onEndDrag={() => {
                  // If we have a dragged item and it wasn't consumed by a valid drop, unassign it
                  if (draggedFromPerson) {
                    const result = unassignItemFromPerson(
                      draggedFromPerson.person,
                      draggedFromPerson.item,
                      assignments,
                      quantityAssignments
                    );
                    if (result.shouldUpdate) {
                      setAssignments(result.newAssignments);
                      setQuantityAssignments(result.newQuantityAssignments);
                    }
                  }
                  setDraggedFromPerson(null);
                }}
                getItemAssignmentInfo={(itemId) => getItemAssignmentInfo(itemId, assignments)}
                quantityAssignments={quantityAssignments}
              />
            ))}
          </ScrollView>
        </ScrollView>
        
        <QuantityModal
          visible={showQuantityModal}
          item={pendingAssignment?.item}
          person={pendingAssignment?.person}
          maxQuantity={pendingAssignment?.maxQuantity}
          onConfirm={handleQuantityConfirm}
          onCancel={handleQuantityCancel}
        />
        <AddFriendsPanel
          visible={showAddFriends}
          friends={availableFriends}
          onClose={() => setShowAddFriends(false)}
          onStartDrag={() => setIsAnyDragging(true)}
          onEndDrag={() => setIsAnyDragging(false)}
        />
      </SafeAreaView>
    </DropProvider>
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
  // removed layered overlays to ensure a consistent full-height gradient
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addFriendsBtn: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backInline: {
    marginBottom: 0,
    marginRight: 14,
  },
  titleInline: {
    marginBottom: 0,
    fontSize: 36,
  },
  // Food items container (back to original vertical layout)
  foodItemsContainer: {
    marginBottom: 20,
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
    backgroundColor: 'rgba(79, 209, 197, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(79, 209, 197, 0.35)',
    alignSelf: 'flex-start',
  },
  hintText: {
    marginLeft: 6,
    color: Colors.textOnLightSecondary,
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
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  paginationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paginationButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
    opacity: 0.5,
  },
  pageIndicator: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pageText: {
    color: Colors.textOnLightPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
});