import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated, Easing } from 'react-native';

interface LogoProps {
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ size = 50 }) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Continuous gentle pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Initial bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  // Combine animations (without rotation)
  const animatedStyle = {
    opacity: fadeAnim,
    transform: [
      { scale: Animated.multiply(scaleAnim, pulseAnim) },
    ],
  };

  // Attempt to load local asset; fall back to simple emoji-based mark if it fails
  let logoSource: any = null;
  try {
    // Static require may be resolved by Metro; wrap in try/catch to avoid runtime crash
    // when the file exists but is invalid/corrupted.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    logoSource = require('../../assets/elderassist_logo.png');
  } catch (e) {
    logoSource = null;
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        { width: size, height: size, borderRadius: size / 2 },
        animatedStyle
      ]}
    > 
      {logoSource ? (
        <Image
          source={logoSource}
          style={{ width: size, height: size, resizeMode: 'contain' }}
          accessibilityLabel="SeniorSmartAssist logo"
        />
      ) : (
        <View style={styles.fallbackContainer}>
          <Text style={[styles.figure, { fontSize: size * 0.35 }]}>🤝</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%'
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  figure: {
    color: '#fff'
  }
});

export default Logo;

