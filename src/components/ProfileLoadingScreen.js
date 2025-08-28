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

const ProfileLoadingScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const bookAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // フェードインとスケールアニメーション
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // 本をめくるような微細なアニメーション
    const bookAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bookAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(bookAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    bookAnimation.start();

    return () => {
      bookAnimation.stop();
    };
  }, []);

  const bookRotate = bookAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '2deg'],
  });

  const bookScale = bookAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.02, 1],
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

        {/* 本を読んでいるキャラクター */}
        <Animated.View 
          style={[
            styles.characterContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { rotate: bookRotate },
                { scale: bookScale }
              ],
            }
          ]}
        >
          <Image 
            source={require('../../assets/yomikomi.png')} 
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
    marginBottom: 50,
  },
  appIcon: {
    width: 50,
    height: 50,
    marginBottom: 15,
  },
  brandText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fffacd',
    letterSpacing: 3,
    textShadowColor: '#000080',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  characterContainer: {
    marginBottom: 50,
  },
  characterImage: {
    width: width * 0.5,
    height: width * 0.5,
    maxWidth: 200,
    maxHeight: 200,
  },
  loadingTextContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#fffacd',
    marginBottom: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    color: '#fffacd',
    fontSize: 14,
  },
});

export default ProfileLoadingScreen;