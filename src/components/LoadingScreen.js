import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const LoadingScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimations = () => {
      // フェードインとスケールアニメーション
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // 回転アニメーション（鍵を開ける動作）
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startAnimations();
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000080', '#000066', '#00004d', '#000033']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.content}>
        {/* ブランドロゴ */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.appIcon}
            resizeMode="contain"
          />
          <Text style={styles.brandText}>GINEQUE</Text>
        </Animated.View>

        {/* 鍵を開けるキャラクター */}
        <Animated.View 
          style={[
            styles.characterContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { rotate: rotateInterpolate },
              ],
            }
          ]}
        >
          <Image 
            source={require('../../assets/login.png')} 
            style={styles.characterImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* ローディングテキスト */}
        <Animated.View 
          style={[
            styles.loadingTextContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <Text style={styles.loadingText}>読み込み中...</Text>
          <View style={styles.dotsContainer}>
            <Animated.Text style={[styles.dot, { opacity: fadeAnim }]}>●</Animated.Text>
            <Animated.Text style={[styles.dot, { opacity: fadeAnim }]}>●</Animated.Text>
            <Animated.Text style={[styles.dot, { opacity: fadeAnim }]}>●</Animated.Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  brandText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fffacd',
    letterSpacing: 4,
    textShadowColor: '#000080',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  characterContainer: {
    marginBottom: 60,
  },
  characterImage: {
    width: width * 0.6,
    height: width * 0.6,
    maxWidth: 280,
    maxHeight: 280,
  },
  loadingTextContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#fffacd',
    marginBottom: 10,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    color: '#fffacd',
    fontSize: 16,
  },
});

export default LoadingScreen;