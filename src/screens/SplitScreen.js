import React, { useState, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { DropProvider, Droppable } from 'react-native-reanimated-dnd';
import { DraggableFoodItem, QuantityModal, PersonCard, BackButton, Title } from '../components';
import { unassignItemFromPerson } from '../services';
import { foodItems, people, getItemAssignmentInfo, handleItemDrop, handleQuantityAssignment } from '../services';





export default function SplitScreen() {
  const [assignments, setAssignments] = useState({});
  const [quantityAssignments, setQuantityAssignments] = useState({});
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState(null);
  const [isAnyDragging, setIsAnyDragging] = useState(false);
  const [dragNonce, setDragNonce] = useState(0);
  const [deleteZoneVisible, setDeleteZoneVisible] = useState(false);
  const [draggedFromPerson, setDraggedFromPerson] = useState(null); // { person, item }
  const scrollRef = useRef(null);

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

    // Force a provider refresh to ensure any temporary drag previews are cleaned up
    setDragNonce((n) => n + 1);
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
  const hasAnyAssignments = assignedItemIds.length > 0;
  const showDeleteZone = hasAnyAssignments; // Always show when there's anything assigned

  return (
    <DropProvider key={`provider-${assignedItemIds.length}-${dragNonce}`}>
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
        <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <BackButton style={styles.backInline} />
            <Title boldText="Split" regularText=" order" style={styles.titleInline} />
          </View>
          <View style={styles.hintRow}>
            <Ionicons name="hand-right" size={14} color={'rgba(79, 209, 197, 0.8)'} />
            <Text style={styles.hintText}>Drag a dish image onto a person to assign</Text>
          </View>
          
          <View style={[styles.foodItemsContainer, isAnyDragging && styles.foodItemsContainerDragging]}>
            {foodItems.map((item) => (
              <DraggableFoodItem 
                key={item.id} 
                item={item}
                assignmentInfo={getItemAssignmentInfo(item.id, assignments)}
                quantityAssignments={quantityAssignments}
                onDraggingChange={(dragging) => {
                  setIsAnyDragging(dragging);
                  if (dragging) {
                    // Dragging from the menu; ensure delete zone is not considered
                    setDraggedFromPerson(null);
                    setDeleteZoneVisible(false);
                  }
                }}
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
                // When a drag starts inside a person card, reveal delete zone
                onStartDrag={(payload) => {
                  setDeleteZoneVisible(true);
                  setDraggedFromPerson(payload); // { person, item }
                  // Ensure the delete area and spacer are visible
                  requestAnimationFrame(() => {
                    if (scrollRef.current) {
                      scrollRef.current.scrollToEnd({ animated: true });
                    }
                  });
                }}
                // When drag ends, hide delete zone if not dropped to delete
                onEndDrag={() => setDeleteZoneVisible(false)}
                getItemAssignmentInfo={(itemId) => getItemAssignmentInfo(itemId, assignments)}
                quantityAssignments={quantityAssignments}
              />
            ))}
          </ScrollView>

          {hasAnyAssignments && <View style={styles.deleteSpacer} />}

          <View
            style={[
              styles.deleteZoneWrapper,
              !showDeleteZone && styles.deleteZoneHidden,
            ]}
            // Disable interactions while dragging from the menu list
            pointerEvents={showDeleteZone ? (isAnyDragging && !draggedFromPerson ? 'none' : 'box-none') : 'none'}
          >
            {showDeleteZone && (
              <Droppable
                droppableId="delete-zone"
                onDrop={(data) => {
                  // Only allow drops from assigned thumbnails (which carry { person, item })
                  const isValidPayload = data && data.person && data.item;
                  const payload = isValidPayload ? data : draggedFromPerson;
                  if (payload) {
                    const result = unassignItemFromPerson(
                      payload.person,
                      payload.item,
                      assignments,
                      quantityAssignments
                    );
                    if (result.shouldUpdate) {
                      setAssignments(result.newAssignments);
                      setQuantityAssignments(result.newQuantityAssignments);
                    }
                  }
                  setDeleteZoneVisible(false);
                  setDraggedFromPerson(null);
                }}
                style={styles.deleteZoneRect}
                activeStyle={styles.deleteZoneRectActive}
              >
                <Text pointerEvents="none" style={styles.deleteZoneLabel}>Drag here to unassign</Text>
              </Droppable>
            )}
          </View>
        </ScrollView>
        
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
  backInline: {
    marginBottom: 0,
    marginRight: 14,
  },
  titleInline: {
    marginBottom: 0,
    fontSize: 36,
  },
  // Removed white card. Content sits directly on the grey background.
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
  deleteSpacer: {
    height: 140,
  },
  deleteZoneWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 48,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    zIndex: 0,
  },
  deleteZoneHidden: {
    // reserve layout space but keep it behind content so draggables stay above
    zIndex: 0,
  },
  deleteZoneRect: {
    width: 200,
    height: 72,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(220, 53, 69, 0.45)',
    backgroundColor: 'rgba(220, 53, 69, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteZoneRectActive: {
    borderColor: 'rgba(220, 53, 69, 0.75)',
    backgroundColor: 'rgba(220, 53, 69, 0.12)',
    transform: [{ scale: 1.03 }],
  },
  deleteIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(220, 53, 69, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 1,
  },
  deleteIconCircleActive: {
    backgroundColor: 'rgba(220, 53, 69, 1)',
    transform: [{ scale: 1.06 }],
  },
  deleteZoneLabel: {
    color: 'rgba(220, 53, 69, 0.9)',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});