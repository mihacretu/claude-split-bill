import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, StyleSheet, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Layout, FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { Title, PersonCard } from '../components';
import { formatPrice } from '../utils/calculationUtils';

export default function BillDetailsScreen({ navigation, bill }) {
  const [expandedById, setExpandedById] = useState({});
  const toggleExpanded = (id) => {
    setExpandedById((prev) => {
      // If clicking on the currently expanded person, close it
      if (prev[id]) {
        return {};
      }
      // Otherwise, close all others and open this one
      return { [id]: true };
    });
  };
  // Fallback demo bill if none provided
  const demoBill = useMemo(
    () => ({
      id: 'demo-1',
      time: '03/28',
      title: 'Steak House',
      description: 'You owe $20.50 to Tom',
      createdBy: 'Tom',
      createdAt: '2024-03-28T18:30:00Z',
      paidBy: 'Tom',
      paidAt: '2024-03-28T19:00:00Z',
      totalAmount: 45.50,
      finalAmount: 62.62,
      collectedAmount: 3.00, // Amount already collected
      pendingAmount: 17.50, // Amount still pending
      participants: [
        {
          id: 1,
          name: 'You',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
          items: [
            { id: 'it-1', name: 'Roasted Potato Salad', price: 15.0, quantity: 1 },
            { id: 'it-2', name: 'Orange Juice', price: 8.0, quantity: 1 }
          ],
          netBalance: -20.5, // owes 20.50
          paymentStatus: 'pending'
        },
        {
          id: 2,
          name: 'Tom',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face',
          items: [
            { id: 'it-3', name: 'Grilled Salmon', price: 22.0, quantity: 1 }
          ],
          netBalance: 20.5, // to receive 20.50
          paymentStatus: 'paid'
        },
        {
          id: 3,
          name: 'Jessica',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face',
          items: [
            { id: 'it-4', name: 'Cappuccino', price: 5.5, quantity: 1 }
          ],
          netBalance: 0,
          paymentStatus: 'settled'
        }
      ]
    }),
    []
  );

  const billData = bill || demoBill;

  const receivers = billData.participants?.filter(p => p.netBalance > 0) || [];
  
  // Format dates
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Calculate amounts with null checks
  const totalToCollect = receivers.reduce((sum, receiver) => sum + (receiver.netBalance || 0), 0);
  const collectedAmount = billData.collectedAmount || 0;
  const pendingAmount = billData.pendingAmount || Math.max(0, totalToCollect - collectedAmount);
  
  // Find people who owe money
  const debtors = billData.participants?.filter(p => p.netBalance < 0) || [];
  const currentUser = billData.participants?.find(p => p.name === 'You');
  const userOwes = currentUser && currentUser.netBalance < 0;
  const userOwesTo = userOwes ? receivers.find(r => r.netBalance > 0) : null;

  const handleBack = () => {
    navigation?.goBack?.();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <LinearGradient
          colors={[Colors.backgroundTop, Colors.backgroundMid, Colors.backgroundBottom]}
          locations={[0, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.bgGradient}
        />
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={Colors.textOnLightPrimary} />
        </TouchableOpacity>
        <Title boldText="Bill" regularText=" Details" />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          {/* Restaurant Name */}
          <View style={styles.summaryHeader}>
            <Ionicons name="location" size={18} color={Colors.textOnLightPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.summaryTitle}>{billData.title}</Text>
          </View>
          
          {/* Created Date */}
          <View style={styles.summaryPill}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textOnLightPrimary} />
            <Text style={styles.summaryPillText}>Created: {formatDateTime(billData.createdAt)}</Text>
          </View>

          <View style={styles.summaryRow}>
            {/* Paid by with total amount */}
            <View style={styles.summaryPill}>
              <Ionicons name="card-outline" size={16} color={Colors.textOnLightPrimary} />
              <Text style={styles.summaryPillText}>Paid by {billData.paidBy}</Text>
              {billData.finalAmount && (
                <Text style={styles.summaryPillAmount}>${billData.finalAmount.toFixed(2)}</Text>
              )}
            </View>
            
            {/* To be collected section */}
            {totalToCollect > 0 && (
              <View style={styles.collectionSection}>
                <View style={styles.summaryPill}>
                  <Ionicons name="cash-outline" size={16} color={Colors.textOnLightPrimary} />
                  <Text style={styles.summaryPillText}>To be collected</Text>
                  <Text style={styles.summaryPillAmount}>+${totalToCollect.toFixed(2)}</Text>
                </View>
                
                {/* Collection breakdown */}
                <View style={styles.collectionBreakdown}>
                  {collectedAmount > 0 && (
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>-- collected:</Text>
                      <Text style={styles.breakdownAmount}>${collectedAmount.toFixed(2)}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants</Text>
          <View style={styles.participantsSection}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.participantsContainer}
              style={styles.participantsScrollView}
            >
              {billData.participants.map((person, index) => {
                const expanded = !!expandedById[person.id];
                
                // Calculate person's total from their items
                const personTotal = (person.items || []).reduce((sum, item) => {
                  const price = typeof item.price === 'string' ? parseFloat(item.price.replace('$', '')) : (item.price || 0);
                  const qty = item.quantity || 1;
                  return sum + price * qty;
                }, 0);
                
                // Transform person data to match PersonCard expected format
                const transformedPerson = {
                  ...person,
                  avatar: person.avatar,
                  hasFood: false, // Explicitly set to false to hide food images
                  amount: personTotal.toFixed(2) // Set the calculated total as the amount
                };
                
                // Create empty assignments to hide items in the card
                const assignments = {
                  [person.id]: [] // Empty array to hide items from card display
                };
                
                return (
                  <View key={person.id} style={styles.participantCardWrapper}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => toggleExpanded(person.id)}
                      style={styles.participantCardContainer}
                    >
                      <PersonCard
                        person={transformedPerson}
                        assignments={assignments}
                        index={index}
                        disabled={true}
                        getItemAssignmentInfo={() => ({ isShared: false })}
                        quantityAssignments={{}}
                        shouldAnimateEntrance={false}
                      />
                      
                      {/* Payment Status Label */}
                      {person.paymentStatus === 'paid' && (
                        <View style={[styles.paymentStatusBadge, styles.paymentStatusPaid]}>
                          <Ionicons name="receipt" size={14} color="white" />
                        </View>
                      )}
                      {person.paymentStatus === 'pending' && (
                        <View style={[styles.paymentStatusBadge, styles.paymentStatusPending]}>
                          <Ionicons name="hourglass" size={14} color="white" />
                        </View>
                      )}
                                             {person.paymentStatus === 'settled' && (
                         <View style={[styles.paymentStatusBadge, styles.paymentStatusSettled]}>
                           <Ionicons name="checkmark-done" size={14} color="white" />
                         </View>
                       )}
                      
                      <View style={styles.expandIndicator}>
                        <Animated.View layout={Layout.duration(120)}>
                          <Ionicons 
                            name={expanded ? 'chevron-up' : 'chevron-down'} 
                            size={16} 
                            color={Colors.textOnLightSecondary} 
                          />
                        </Animated.View>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
            
            {/* Expanded items containers - outside of horizontal scroll */}
            {billData.participants.map((person, index) => {
              const expanded = !!expandedById[person.id];
              if (!expanded) return null;
              
              return (
                <Animated.View
                  key={`expanded-${person.id}`}
                  entering={FadeIn.duration(160)}
                  exiting={FadeOut.duration(120)}
                  style={[styles.expandedItemsContainer, { zIndex: 1000 + index }]}
                >
                  {person.items?.length > 0 ? (
                    <View style={styles.expandedItemsList}>
                      <Text style={styles.expandedItemsTitle}>Items</Text>
                      <View style={styles.verticalItemsContainer}>
                        {person.items.map((item) => {
                          const unit = typeof item.price === 'string' ? parseFloat(item.price.replace('$', '')) : (item.price || 0);
                          const subtotal = unit * (item.quantity || 1);
                          return (
                            <View key={item.id} style={styles.verticalItemCard}>
                              <View style={styles.itemImageWrapper}>
                                <Image source={{ uri: item.image }} style={styles.verticalItemImage} />
                              </View>
                              <View style={styles.itemQuantityBadge}>
                                <Text style={styles.itemQuantityText}>{item.quantity || 1} ×</Text>
                              </View>
                              <View style={styles.verticalItemDetails}>
                                <Text style={styles.verticalItemName} numberOfLines={2}>
                                  {item.name}
                                </Text>
                                <Text style={styles.verticalItemPrice}>{formatPrice(subtotal)}</Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.noItemsContainer}>
                      <Text style={styles.noItemsText}>No items assigned</Text>
                    </View>
                  )}
                </Animated.View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: 'transparent'
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20, // Increased from 6 to add more space above summary card
    paddingBottom: 16,
  },
  summaryCard: {
    position: 'relative',
    backgroundColor: 'rgba(79, 209, 197, 0.1)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4FD1C5',
    borderStyle: 'dashed',
    padding: 16,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textOnLightPrimary,
  },
  summarySubtitle: {
    fontSize: 13,
    color: Colors.textOnLightSecondary,
    marginBottom: 10,
  },

  summaryRow: {
    flexDirection: 'column',
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  summaryPillText: {
    color: Colors.textOnLightPrimary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  summaryPillAmount: {
    color: Colors.textOnLightPrimary,
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  collectionSection: {
    gap: 8,
  },
  collectionBreakdown: {
    marginLeft: 32, // Align with the text after the icon
    gap: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    color: Colors.textOnLightSecondary,
    fontWeight: '500',
    flex: 1,
  },
  breakdownAmount: {
    fontSize: 12,
    color: Colors.textOnLightPrimary,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  section: {
    marginTop: 4,
  },
  participantsSection: {
    position: 'relative',
  },
  participantsContainer: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  participantsScrollView: {
    marginTop: 8,
  },
  participantCardWrapper: {
    marginRight: 12,
    alignItems: 'center',
  },
  participantCardContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  paymentStatusBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  paymentStatusPaid: {
    backgroundColor: '#6B7280',
  },
  paymentStatusPending: {
    backgroundColor: '#F08430',
  },
   paymentStatusSettled: {
     backgroundColor: '#4FD1C5',
   },
  paymentStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textOnLightPrimary,
    lineHeight: 12,
  },
  expandIndicator: {
    position: 'absolute',
    bottom: -8,
    left: 50, // PersonCard is 100px wide, so center is at 50px from left
    transform: [{ translateX: -16 }], // Half of indicator width to center it
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  expandedItemsContainer: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  expandedItemsList: {
    gap: 4,
  },
  expandedItemsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textOnLightSecondary,
    marginBottom: 6,
    textAlign: 'center',
  },
  verticalItemsContainer: {
    gap: 4,
  },
  verticalItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
    position: 'relative',
    minHeight: 52,
  },
  itemImageWrapper: {
    width: 44,
    height: 44,
    padding: 2,
    marginRight: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.accentBlue,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalItemImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  itemQuantityBadge: {
    backgroundColor: Colors.quantityPillBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    minWidth: 24,
    marginRight: 8,
    alignSelf: 'center',
  },
  itemQuantityText: {
    fontSize: 10,
    color: Colors.textOnLightSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  verticalItemDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verticalItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textOnLightPrimary,
    lineHeight: 16,
    flex: 1,
    marginRight: 8,
  },
  verticalItemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textOnLightPrimary,
    backgroundColor: Colors.pricePillBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  noItemsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  noItemsText: {
    fontSize: 11,
    color: Colors.textOnLightSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textOnLightPrimary,
    marginBottom: 10,
  },
});


