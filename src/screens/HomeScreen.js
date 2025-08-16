import React, { useMemo, useState, useEffect } from 'react';
import { SafeAreaView, View, StyleSheet, Text, Image, Dimensions, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Timeline from 'react-native-timeline-flatlist';
import Colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useBackendServices } from '../../lib/backend-integration';

const HEADER_EXPANDED_HEIGHT = 132;
const HEADER_COLLAPSED_HEIGHT = 72;
const FAB_SIZE = 64;
// Timeline alignment constants
const TIMELINE_TITLE_LINE_HEIGHT = 18;
const TIMELINE_CIRCLE_SIZE = 10;
const TIMELINE_CARD_PADDING_TOP = 6; // matches styles.card paddingVertical top
const TIMELINE_CIRCLE_TOP = TIMELINE_CARD_PADDING_TOP + (TIMELINE_TITLE_LINE_HEIGHT - TIMELINE_CIRCLE_SIZE) / 2;

export default function HomeScreen({ navigation }) {
  const { signOut, user } = useAuth();
  const scrollY = useSharedValue(0);
  const [titleWidth, setTitleWidth] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hangouts, setHangouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const screenWidth = Dimensions.get('window').width;
  const sidePadding = 20;
  const centerShift = Math.max(0, screenWidth / 2 - titleWidth / 2 - sidePadding);

  const handleLogout = () => {
    console.log('handleLogout called - showing custom modal');
    setShowLogoutModal(true);
  };

  const performLogout = async () => {
    console.log('User confirmed logout - starting sign out process...');
    setShowLogoutModal(false);
    try {
      const { error } = await signOut();
      if (error) {
        console.log('Logout error:', error);
      } else {
        console.log('Logout successful - should navigate to login screen');
        // The auth context should handle the navigation automatically
      }
    } catch (error) {
      console.log('Logout exception:', error);
    }
  };

  const cancelLogout = () => {
    console.log('Logout cancelled by user');
    setShowLogoutModal(false);
  };

  // Fetch hangouts data from backend
  const fetchHangouts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching hangouts for user:', user?.id);
      console.log('🔄 User object:', JSON.stringify(user, null, 2));
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const services = await useBackendServices();
      if (!services) {
        throw new Error('Backend services not available. Please check your connection.');
      }

      const result = await services.hangoutService.getUserHangouts(user.id, {
        limit: 50,
        offset: 0
      });

      console.log('✅ Fetched hangouts:', result);
      
      if (result && result.data) {
        setHangouts(result.data);
      } else {
        console.warn('No data returned from hangout service');
        setHangouts([]);
      }
      
    } catch (err) {
      console.error('❌ Error fetching hangouts:', err);
      
      // Provide more user-friendly error messages
      let errorMessage = 'Failed to load hangouts';
      
      if (err.message.includes('not authenticated')) {
        errorMessage = 'Please sign in to view your hangouts';
      } else if (err.message.includes('Backend services not available')) {
        errorMessage = 'Connection problem. Please check your internet connection.';
      } else if (err.message.includes('500')) {
        errorMessage = 'Server error. Please try again in a moment.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setHangouts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load hangouts when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      fetchHangouts();
    }
  }, [user?.id]);

  // Helper function to format date for timeline
  const formatTimelineDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}`;
  };

  // Helper function to generate participant avatars
  const generateParticipantAvatars = (hangout) => {
    // For now, use placeholder avatars - in a real app you'd use actual participant data
    const avatarIds = [5, 12, 13, 14, 15, 16, 20, 21, 22];
    const numAvatars = Math.min(3, hangout.participants_count || 1);
    
    return (
      <View style={styles.avatarRow}>
        {Array.from({ length: numAvatars }, (_, index) => (
          <Image 
            key={index}
            source={{ uri: `https://i.pravatar.cc/36?img=${avatarIds[index % avatarIds.length]}` }} 
            style={styles.avatar} 
          />
        ))}
      </View>
    );
  };

  // Helper function to generate description based on bill status
  const generateDescription = (hangout) => {
    if (!hangout.has_bill) {
      return 'No bill added yet';
    }

    const total = hangout.bill_total || 0;
    
    // Simple logic - in a real app you'd calculate actual user balance
    if (hangout.bill_status === 'settled') {
      return 'All settled up! ✅';
    } else {
      return `Bill total: $${total.toFixed(2)}`;
    }
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(scrollY.value, [0, 160], [HEADER_EXPANDED_HEIGHT, HEADER_COLLAPSED_HEIGHT], Extrapolation.CLAMP);
    return { height };
  });

  const titleContainerStyle = useAnimatedStyle(() => {
    // Follow the scroll 1:1 so it stays synced with the finger
    const translateY = interpolate(scrollY.value, [0, 240], [8, -36], Extrapolation.CLAMP);
    const translateX = interpolate(scrollY.value, [0, 240], [0, centerShift], Extrapolation.CLAMP);
    const scale = interpolate(scrollY.value, [0, 240], [1, 0.9], Extrapolation.CLAMP);
    return {
      transform: [{ translateY }, { translateX }, { scale }],
    };
  });

  const underlineAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 10, 40], [1, 0.3, 0], Extrapolation.CLAMP);
    const width = interpolate(scrollY.value, [0, 40], [84, 0], Extrapolation.CLAMP);
    return { opacity, width };
  });

  // Transform hangouts data for timeline display
  const data = useMemo(() => {
    if (loading || !hangouts.length) {
      return [];
    }

    return hangouts.map(hangout => ({
      time: formatTimelineDate(hangout.hangout_date || hangout.created_at),
      title: hangout.location_name || hangout.title,
      description: generateDescription(hangout),
      icon: generateParticipantAvatars(hangout),
      hangout: hangout, // Store the full hangout data for navigation
      bill: hangout.has_bill ? {
        id: hangout.id,
        time: formatTimelineDate(hangout.hangout_date || hangout.created_at),
        title: hangout.location_name || hangout.title,
        description: generateDescription(hangout),
        total: hangout.bill_total,
        status: hangout.bill_status,
        // Add more bill details as needed
      } : null
    }));
  }, [hangouts, loading]);

  const renderDetail = (rowData) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (rowData.bill) {
            navigation?.navigate?.('BillDetailsScreen', { bill: rowData.bill });
          } else {
            console.log('Navigate to hangout details:', rowData.hangout);
            // You can navigate to a hangout details screen here
            // navigation?.navigate?.('HangoutDetailsScreen', { hangout: rowData.hangout });
          }
        }}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="location" size={16} color={Colors.textOnLightPrimary} style={{ marginRight: 6 }} />
          <Text style={styles.cardTitle}>{rowData.title}</Text>
        </View>
        {rowData.icon}
        <Text style={styles.cardSubtitle}>{rowData.description}</Text>
      </TouchableOpacity>
    );
  };

  // Render loading state
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.accentBlue} />
      <Text style={styles.loadingText}>Loading your hangouts...</Text>
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color={Colors.textOnLightSecondary} />
      <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchHangouts}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="restaurant-outline" size={48} color={Colors.textOnLightSecondary} />
      <Text style={styles.emptyTitle}>No hangouts yet!</Text>
      <Text style={styles.emptyMessage}>Start by creating your first hangout and splitting a bill with friends.</Text>
      <TouchableOpacity 
        style={styles.createButton} 
        onPress={() => navigation?.navigate?.('TestNavigation')}
      >
        <Text style={styles.createButtonText}>Create Hangout</Text>
      </TouchableOpacity>
    </View>
  );

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

      <Animated.View style={[styles.header, headerAnimatedStyle]} pointerEvents="box-none">
        {/* Opaque header background to prevent timeline showing through */}
        <LinearGradient
          pointerEvents="none"
          colors={[Colors.backgroundTop, Colors.backgroundMid, Colors.backgroundBottom]}
          locations={[0, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.topIconsRow} pointerEvents="box-none">
          <View style={styles.leftIcons}>
            <Text style={styles.welcomeText}>Hi, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}!</Text>
          </View>
          <View style={styles.rightIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={22} color={Colors.textOnLightPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="settings-outline" size={22} color={Colors.textOnLightPrimary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.iconButton, styles.logoutButton]} 
              onPress={() => {
                console.log('Logout button touched!');
                handleLogout();
              }}
              activeOpacity={0.5}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="log-out-outline" size={22} color={Colors.textOnLightPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        <Animated.View style={[styles.titleContainer, titleContainerStyle]}>
          <Text style={styles.title} onLayout={(e) => setTitleWidth(e.nativeEvent.layout.width)}>Hangouts</Text>
          <Animated.View style={[styles.titleUnderline, underlineAnimatedStyle]} />
        </Animated.View>
        {/* Subtle top fade to mask any seam between header and timeline */}
        <LinearGradient
          pointerEvents="none"
          colors={[
            'rgba(244,246,250,1)',
            'rgba(244,246,250,0.6)',
            'rgba(244,246,250,0)'
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, bottom: -24, height: 32 }}
        />
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: HEADER_EXPANDED_HEIGHT + 12, paddingBottom: 120 }}
        onScroll={onScroll}
        scrollEventThrottle={1}
      >
        <View style={styles.timelineContainer}>
          {loading ? (
            renderLoadingState()
          ) : error ? (
            renderErrorState()
          ) : data.length === 0 ? (
            renderEmptyState()
          ) : (
            <Timeline
              data={data}
              circleSize={TIMELINE_CIRCLE_SIZE}
              showTime
              timeStyle={styles.timeLabel}
              timeContainerStyle={styles.timeContainer}
              lineColor={Colors.personCardStroke}
              circleColor={Colors.personCardStroke}
              dotColor={Colors.personCardStroke}
              innerCircle={'dot'}
              circleStyle={styles.circleAlign}
              eventDetailStyle={{ paddingTop: 0, paddingBottom: 6 }}
              renderDetail={renderDetail}
              options={{ showsVerticalScrollIndicator: false }}
              isUsingFlatlist={false}
            />
          )}
        </View>
      </Animated.ScrollView>

      <View style={styles.bottomNav}>
        <View style={styles.bottomBar}>
          <View style={styles.menuRow}>
            <TouchableOpacity activeOpacity={0.7} style={styles.menuItem}>
              <View style={styles.activeIndicator} />
              <Ionicons name="home-outline" size={24} color={Colors.textOnLightPrimary} />
            </TouchableOpacity>
            <View style={styles.centerSpacer} />
            <TouchableOpacity activeOpacity={0.7} style={styles.menuItem}>
              <View style={styles.activeIndicatorSpacer} />
              <Ionicons name="people-outline" size={24} color={Colors.textOnLightPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Bottom fade mask to prevent timeline peeking behind the nav bar */}
        <LinearGradient
          pointerEvents="none"
          colors={['transparent', Colors.backgroundMid]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: -18, height: 24 }}
        />
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Scan"
          onPress={() => navigation?.navigate?.('TestNavigation')}
        >
          <Ionicons name="scan" size={26} color={Colors.textOnLightPrimary} />
        </TouchableOpacity>
      </View>

      {/* Custom Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to sign out?</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={cancelLogout}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={performLogout}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    paddingBottom: 8,
  },
  topIconsRow: {
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftIcons: {
    flex: 1,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.textOnLightPrimary,
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textOnLightPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: Colors.textOnLightSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.cardMid,
    borderWidth: 1,
    borderColor: Colors.personCardOutline,
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textOnLightPrimary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  titleContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'column',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.textOnLightPrimary,
  },
  titleUnderline: {
    marginTop: 6,
    height: 6,
    width: 84,
    backgroundColor: Colors.accentBlue,
    borderRadius: 3,
  },
  timelineContainer: {
    paddingHorizontal: 20,
  },
  timeContainer: {
    minWidth: 54,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginTop: TIMELINE_CARD_PADDING_TOP,
    height: TIMELINE_TITLE_LINE_HEIGHT,
  },
  circleAlign: {
    top: TIMELINE_CIRCLE_TOP,
  },
  timeLabel: {
    color: Colors.textOnLightSecondary,
    fontSize: 12,
    textAlign: 'right',
    lineHeight: TIMELINE_TITLE_LINE_HEIGHT,
  },
  card: {
    paddingVertical: 6,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    marginBottom: 30,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textOnLightPrimary,
  },
  cardSubtitle: {
    color: Colors.textOnLightSecondary,
    fontSize: 13,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 12,
    paddingTop: 6,
    alignItems: 'center',
    pointerEvents: 'box-none',
    backgroundColor: Colors.backgroundMid,
  },
  bottomBar: {
    height: 68,
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.personCardOutline,
    backgroundColor: Colors.cardTop,
    paddingHorizontal: 20,
    paddingVertical: 6,
    justifyContent: 'center',
    zIndex: 0,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
    height: 56,
    position: 'relative',
  },
  activeIndicator: {
    width: 28,
    height: 6,
    backgroundColor: Colors.accentBlue,
    borderRadius: 3,
    position: 'absolute',
    top: 4,
    alignSelf: 'center',
  },
  activeIndicatorSpacer: {
    width: 28,
    height: 6,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 4,
    alignSelf: 'center',
  },
  centerSpacer: {
    width: FAB_SIZE + 20,
  },
  fab: {
    position: 'absolute',
    bottom: 22,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentBlue,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    zIndex: 2,
  },
  // Loading state styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textOnLightSecondary,
    textAlign: 'center',
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textOnLightPrimary,
    textAlign: 'center',
  },
  errorMessage: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textOnLightSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.accentBlue,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textOnLightPrimary,
    textAlign: 'center',
  },
  emptyMessage: {
    marginTop: 8,
    fontSize: 16,
    color: Colors.textOnLightSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  createButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: Colors.accentBlue,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});


