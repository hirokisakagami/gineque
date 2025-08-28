import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const characterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // アニメーション開始
    Animated.sequence([
      // テキストのフェードイン
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
      // キャラクターのフェードイン（少し遅れて）
      Animated.timing(characterAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = async () => {
    // タプティックエンジン始動
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate('SignUp');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000080', '#000066', '#00004d', '#000033']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.content}>
        {/* ようこそテキスト */}
        <Animated.View 
          style={[
            styles.welcomeContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={styles.welcomeTitle}>ようこそ</Text>
          <Text style={styles.welcomeSubtitle}>GINEQUE へ</Text>
        </Animated.View>

        {/* キャラクター画像 */}
        <Animated.View 
          style={[
            styles.characterContainer,
            {
              opacity: characterAnim,
            }
          ]}
        >
          <Image 
            source={require('../../assets/youkoso.png')} 
            style={styles.characterImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* メッセージテキスト */}
        <Animated.View 
          style={[
            styles.messageContainer,
            {
              opacity: characterAnim,
            }
          ]}
        >
          <Text style={styles.messageText}>
            流行りの映画だけじゃ満足できない？{'\n'}
            いいですね。{'\n'}
            あなたはこの映画館に入る資格があります。{'\n'}
            さあ、足を踏み入れましょう。
          </Text>
        </Animated.View>

        {/* 続行ボタン */}
        <Animated.View 
          style={[
            styles.buttonContainer,
            {
              opacity: characterAnim,
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>映画館に入る</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 80,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fffacd',
    textAlign: 'center',
    letterSpacing: 4,
    textShadowColor: '#000080',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  welcomeSubtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fffacd',
    textAlign: 'center',
    letterSpacing: 6,
    marginTop: 10,
    opacity: 0.9,
  },
  characterContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  characterImage: {
    width: width * 0.6,
    height: width * 0.6,
    maxWidth: 250,
    maxHeight: 250,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  messageText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#fffacd',
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#fff8dc',
  },
  continueButtonText: {
    color: '#000080',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
});

export default WelcomeScreen;