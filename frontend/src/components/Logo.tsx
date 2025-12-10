import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ size = 50 }) => {
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
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}> 
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
    </View>
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

