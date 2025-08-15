import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, StyleSheet, Text, Image, Dimensions, TouchableOpacity, Alert, Modal } from 'react-native';
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

  const data = useMemo(
    () => [
      {
        time: '03/28',
        title: 'Steak House',
        description: 'You owe $20.50 to Tom',
        icon: (
          <View style={styles.avatarRow}>
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=5' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=12' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=13' }} style={styles.avatar} />
          </View>
        ),
        bill: {
          time: '03/28',
          title: 'Steak House',
          description: 'You owe $20.50 to Tom',
          paidBy: 'Tom',
          participants: [
            { 
              id: 1, 
              name: 'You', 
              avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face', 
              items: [
                { id: 'it-1', name: 'Roasted Potato Salad', price: 15, quantity: 1 },
                { id: 'it-2', name: 'Orange Juice', price: 8, quantity: 2 },
                { id: 'it-3', name: 'Croissant', price: 7.5, quantity: 1 },
                { id: 'it-4', name: 'Fries', price: 3.5, quantity: 2 },
                { id: 'it-5', name: 'Cappuccino', price: 5.5, quantity: 1 }
              ], 
              netBalance: -20.5,
              paymentStatus: 'pending'
            },
            { 
              id: 2, 
              name: 'Tom', 
              avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face', 
              items: [
                { id: 'it-6', name: 'Grilled Salmon', price: 22, quantity: 1 },
                { id: 'it-7', name: 'Caesar Salad', price: 12.5, quantity: 1 },
                { id: 'it-8', name: 'Chocolate Cake', price: 9, quantity: 1 }
              ], 
              netBalance: 20.5,
              paymentStatus: 'paid'
            },
          ]
        }
      },
      {
        time: '03/19',
        title: 'Pizza Kingdom',
        description: 'Left to receive $28.50',
        icon: (
          <View style={styles.avatarRow}>
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=2' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=7' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=9' }} style={styles.avatar} />
          </View>
        ),
        bill: {
          time: '03/19',
          title: 'Pizza Kingdom',
          description: 'Left to receive $28.50',
          paidBy: 'You',
          participants: [
            { id: 1, name: 'You', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face', items: [{ id: 'it-3', name: 'Margherita Pizza', price: 16.5, quantity: 1 }], netBalance: 28.5, paymentStatus: 'paid' },
            { id: 3, name: 'Jessica', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face', items: [{ id: 'it-4', name: 'Orange Juice', price: 8, quantity: 1 }], netBalance: -10, paymentStatus: 'pending' },
            { id: 4, name: 'Alex', avatar: 'https://i.pravatar.cc/36?img=9', items: [{ id: 'it-5', name: 'Chocolate Cake', price: 9, quantity: 1 }], netBalance: -9.5, paymentStatus: 'settled' },
          ]
        }
      },
      {
        time: '03/12',
        title: 'Nobu Sushi',
        description: 'You owe $5.00 to Dmitry',
        icon: (
          <View style={styles.avatarRow}>
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=14' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=15' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=16' }} style={styles.avatar} />
          </View>
        ),
      },
      {
        time: '03/10',
        title: 'Cafe Aroma',
        description: 'You received $12.00 from Alex',
        icon: (
          <View style={styles.avatarRow}>
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=20' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=21' }} style={styles.avatar} />
          </View>
        ),
      },
      {
        time: '03/08',
        title: 'Burger Joint',
        description: 'Left to receive $8.75',
        icon: (
          <View style={styles.avatarRow}>
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=11' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=22' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=23' }} style={styles.avatar} />
          </View>
        ),
      },
      {
        time: '03/06',
        title: 'Vegan Garden',
        description: 'You owe $9.20 to Mia',
        icon: (
          <View style={styles.avatarRow}>
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=24' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=25' }} style={styles.avatar} />
          </View>
        ),
      },
      {
        time: '03/05',
        title: 'BBQ Shack',
        description: 'You received $14.80 from Sam',
        icon: (
          <View style={styles.avatarRow}>
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=26' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=27' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=28' }} style={styles.avatar} />
          </View>
        ),
      },
      {
        time: '03/03',
        title: 'Tacos El Rey',
        description: 'You owe $6.40 to Luis',
        icon: (
          <View style={styles.avatarRow}>
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=29' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=30' }} style={styles.avatar} />
          </View>
        ),
      },
      {
        time: '03/02',
        title: 'Pasta Palace',
        description: 'Left to receive $19.10',
        icon: (
          <View style={styles.avatarRow}>
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=31' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=32' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=33' }} style={styles.avatar} />
          </View>
        ),
      },
      {
        time: '02/28',
        title: 'Curry Corner',
        description: 'You owe $7.95 to Priya',
        icon: (
          <View style={styles.avatarRow}>
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=34' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=35' }} style={styles.avatar} />
          </View>
        ),
      },
      {
        time: '02/25',
        title: 'Bagel Bros',
        description: 'You received $4.60 from Emma',
        icon: (
          <View style={styles.avatarRow}>
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=36' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=37' }} style={styles.avatar} />
          </View>
        ),
      },
      {
        time: '02/22',
        title: 'Ramen Place',
        description: 'Left to receive $11.30',
        icon: (
          <View style={styles.avatarRow}>
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=38' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=39' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=40' }} style={styles.avatar} />
          </View>
        ),
      },
      {
        time: '02/20',
        title: 'Dumpling Den',
        description: 'You owe $10.25 to Chen',
        icon: (
          <View style={styles.avatarRow}>
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=41' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=42' }} style={styles.avatar} />
          </View>
        ),
      },
      {
        time: '02/17',
        title: 'Bistro 21',
        description: 'You received $16.40 from Zoe',
        icon: (
          <View style={styles.avatarRow}>
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=43' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=44' }} style={styles.avatar} />
          </View>
        ),
      },
      {
        time: '02/14',
        title: 'Kebab House',
        description: 'Left to receive $23.90',
        icon: (
          <View style={styles.avatarRow}>
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=45' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=46' }} style={styles.avatar} />
            <Image source={{ uri: 'https://i.pravatar.cc/36?img=47' }} style={styles.avatar} />
          </View>
        ),
      },
    ],
    []
  );

  const renderDetail = (rowData) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation?.navigate?.('BillDetailsScreen', { bill: rowData.bill })}
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
});


