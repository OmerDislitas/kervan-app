import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Animated, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/constants/theme';

export function OfflineNotice() {
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  
  const [status, setStatus] = useState<'none' | 'offline' | 'online'>('none');
  
  // Track previous connection state to detect transition from offline to online
  const prevConnected = useRef<boolean | null>(null);
  
  // Animated value for slide-in (Y translation)
  const animValue = useRef(new Animated.Value(-150)).current;
  
  // Pulse animation for the offline icon to add a micro-animation effect
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    
    if (status === 'offline') {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    } else {
      pulseAnim.setValue(1);
    }
    
    return () => {
      if (pulseLoop) {
        pulseLoop.stop();
      }
    };
  }, [status]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected;
      const prev = prevConnected.current;

      // Always update the tracked previous state
      prevConnected.current = isConnected;

      // First event: initial connection status on mount
      if (prev === null) {
        // Only show banner if offline at startup; do nothing if already online
        if (isConnected === false) {
          setStatus('offline');
          animateIn();
        }
        return;
      }

      // Connection went offline
      if (isConnected === false && prev !== false) {
        setStatus('offline');
        animateIn();
      }
      // Connection restored (went online from offline)
      else if (isConnected === true && prev === false) {
        setStatus('online');
        animateIn();
        // Automatically hide the green success banner after 3 seconds
        const timer = setTimeout(() => {
          animateOut(() => setStatus('none'));
        }, 3000);
        return () => clearTimeout(timer);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const animateIn = () => {
    Animated.spring(animValue, {
      toValue: 0,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  };

  const animateOut = (callback?: () => void) => {
    Animated.timing(animValue, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(callback);
  };

  if (status === 'none') return null;

  const isOffline = status === 'offline';
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: animValue }],
          top: insets.top > 0 ? insets.top + 8 : 16,
          backgroundColor: isOffline ? themeColors.error : themeColors.success,
        },
      ]}
    >
      <View style={styles.content}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }], marginRight: 10 }}>
          <Ionicons
            name={isOffline ? 'cloud-offline' : 'checkmark-circle'}
            size={20}
            color="#FFF"
          />
        </Animated.View>
        <Text style={styles.text}>
          {isOffline ? 'İnternet bağlantınız yoktur.' : 'İnternet bağlantısı sağlandı.'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 99999, // Ensure it sits on top of navigation
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
