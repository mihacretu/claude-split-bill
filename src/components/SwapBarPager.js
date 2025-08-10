import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../theme/colors';

export default function SwapBarPager({ currentPage, totalPages, onPrev, onNext, onSetPage }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useSharedValue(0);
  const indicatorWidthSV = useSharedValue(0);
  const dragStartX = useSharedValue(0);

  const getSegmentWidth = () => (trackWidth && totalPages > 0 ? trackWidth / totalPages : 0);

  useEffect(() => {
    if (!trackWidth || totalPages <= 0) return;
    const segment = trackWidth / totalPages;
    const indicatorW = Math.max(64, segment - 16);
    indicatorWidthSV.value = indicatorW;
    const centerOffset = (segment - indicatorW) / 2;
    const target = currentPage * segment + centerOffset;
    translateX.value = withTiming(target, { duration: 220 });
  }, [currentPage, trackWidth, totalPages]);

  const pan = Gesture.Pan()
    .activeOffsetX([-3, 3])
    .hitSlop({ top: 16, bottom: 16, left: 20, right: 20 })
    .onBegin(() => {
      dragStartX.value = translateX.value;
    })
    .onUpdate((e) => {
      const maxX = Math.max(0, trackWidth - indicatorWidthSV.value);
      let next = dragStartX.value + e.translationX;
      if (next < 0) next = 0;
      if (next > maxX) next = maxX;
      translateX.value = next;
    })
    .onEnd(() => {
      const segment = getSegmentWidth();
      if (!segment) return;
      const centerX = translateX.value + indicatorWidthSV.value / 2;
      const idx = Math.min(totalPages - 1, Math.max(0, Math.round(centerX / segment - 0.5)));
      if (typeof onSetPage === 'function') {
        runOnJS(onSetPage)(idx);
      }
    });

  const tap = Gesture.Tap().onEnd((e) => {
    if (!trackWidth || totalPages <= 0) return;
    const segment = getSegmentWidth();
    const x = e.x;
    const idx = Math.min(totalPages - 1, Math.max(0, Math.floor(x / segment)));
    onSetPage && onSetPage(idx);
  });

  const gestures = Gesture.Simultaneous(pan, tap);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: indicatorWidthSV.value,
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gestures}>
        <View style={styles.track} onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
          <LinearGradient
            colors={[Colors.cardTop, Colors.cardMid, Colors.cardBottom]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {totalPages > 1 && (
            <View style={styles.dotsLayer} pointerEvents="none">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <View key={`dot-${idx}`} style={styles.dotSpacer}>
                  <View style={[styles.dot, idx === currentPage && styles.dotActive]} />
                </View>
              ))}
            </View>
          )}
          <Animated.View style={[styles.indicator, indicatorStyle]}>
            <LinearGradient
              colors={[Colors.accentBlue, '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.indicatorFill}
            />
            <View style={styles.thumb} />
          </Animated.View>
        </View>
      </GestureDetector>
      <Text style={styles.hint}>Swipe or tap to navigate</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    paddingHorizontal: 24,
    paddingVertical: 2,
  },
  track: {
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  indicatorFill: {
    flex: 1,
    borderRadius: 12,
  },
  thumb: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignSelf: 'center',
  },
  hint: {
    marginTop: 3,
    textAlign: 'center',
    color: Colors.textOnLightSecondary,
    fontSize: 10,
  },
  dotsLayer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dotSpacer: {
    flex: 1,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  dotActive: {
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
});


