import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { Draggable } from 'react-native-reanimated-dnd';

export default function AddFriendsPanel({ visible, friends, onClose, onStartDrag, onEndDrag }) {
  if (!visible) return null;
  return (
    <Animated.View
      entering={SlideInRight.springify().damping(20)}
      exiting={SlideOutRight.springify().damping(20)}
      style={styles.container}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headBold}>Friends</Text>
          <Text style={styles.headLight}>nearby</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color={Colors.textOnLightPrimary} />
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {friends.map((friend) => (
          <Draggable
            key={`friend-${friend.id}`}
            data={{ type: 'person', person: friend }}
            style={styles.tile}
            draggingStyle={styles.dragging}
            onDragStart={onStartDrag}
            onDragEnd={onEndDrag}
          >
            <View style={styles.avatarCircle}>
              <Image source={{ uri: friend.avatar }} style={styles.avatar} />
            </View>
            <Text style={styles.tileName}>{friend.name}</Text>
          </Draggable>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '78%',
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderColor: Colors.border,
    paddingTop: 16,
    paddingHorizontal: 16,
    zIndex: 200000,
    elevation: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headBold: { color: Colors.textOnLightPrimary, fontWeight: '800', fontSize: 28 },
  headLight: { color: Colors.textOnLightPrimary, opacity: 0.7, fontWeight: '600', fontSize: 22, marginTop: -6 },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { width: '46%', alignItems: 'center', marginBottom: 18, paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.6)' },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  avatar: {
    width: '100%',
    height: '100%',
  },
  tileName: { color: Colors.textOnLightPrimary, fontWeight: '600' },
  dragging: {
    zIndex: 2147483646,
    elevation: 1000,
    transform: [{ scale: 1.04 }],
  },
});


