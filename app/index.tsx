import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  ReduceMotion,
  runOnJS,
} from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { markSplashDone } from '@/lib/splashState';

const AnimatedImage = Animated.createAnimatedComponent(Image);

// KERVAN yazısının yaklaşık yüksekliği — logo bu kadar yukarı kayacak
const TEXT_BLOCK_HEIGHT = 40;

export default function Index() {
  const logoTranslateY = useSharedValue(0);
  const textOpacity    = useSharedValue(0);

  useEffect(() => {
    // Native splash'i React ekranı hazır olur olmaz gizle
    SplashScreen.hideAsync().catch(() => {});

    // 1) Logo yukarı kayıyor — 2000ms
    logoTranslateY.value = withTiming(-TEXT_BLOCK_HEIGHT, {
      duration: 2000,
      easing: Easing.inOut(Easing.ease),
      reduceMotion: ReduceMotion.Never,
    });

    // 2) Kayma bittikten (2000ms) + 2000ms sonra KERVAN yazısı belirir
    // Animasyon tamamlanınca markSplashDone() ile _layout.tsx'e sinyal gönderilir
    textOpacity.value = withDelay(
      4000,
      withTiming(
        1,
        {
          duration: 1200,
          easing: Easing.out(Easing.ease),
          reduceMotion: ReduceMotion.Never,
        },
        (finished) => {
          if (finished) runOnJS(markSplashDone)();
        },
      ),
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <AnimatedImage
          source={require('../assets/images/splash-icon.png')}
          style={[styles.logo, logoStyle]}
          resizeMode="contain"
        />
        <Animated.Text style={[styles.brandText, textStyle]}>
          KERVAN
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F1923',
    letterSpacing: 8,
  },
});
