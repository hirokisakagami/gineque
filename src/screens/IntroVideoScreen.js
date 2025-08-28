import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Text,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const IntroVideoScreen = ({ navigation }) => {
  const { markIntroAsSeen } = useAuth();
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // start.mp4の動画プレイヤーを設定
  const player = useVideoPlayer(require('../../assets/start.mp4'), player => {
    player.loop = false;
    player.muted = false; // 音声も再生
  });

  useEffect(() => {
    // 動画読み込み完了時のアニメーション
    if (isVideoLoaded) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [isVideoLoaded]);

  useEffect(() => {
    // 動画プレイヤーの初期化
    if (player) {
      console.log('Video player initialized');
      setIsVideoLoaded(true);
      player.play();
      
      // 動画終了を監視するタイマー
      const checkVideoEnd = setInterval(() => {
        if (player.duration > 0 && player.currentTime >= player.duration - 0.1) {
          console.log('Video ended');
          clearInterval(checkVideoEnd);
          handleVideoEnd();
        }
      }, 500);
      
      return () => {
        clearInterval(checkVideoEnd);
      };
    }
  }, [player]);

  const handleVideoEnd = async () => {
    console.log('Video ended, navigating to Welcome');
    
    // イントロ視聴完了をマーク
    await markIntroAsSeen();
    
    // 触覚フィードバック
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.log('Haptic feedback error:', error);
    }

    // フェードアウトアニメーション
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      navigation.replace('Welcome');
    });
  };


  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* 背景グラデーション */}
      <LinearGradient
        colors={['#000000', '#000033', '#000066']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* メイン動画 */}
      <Animated.View 
        style={[
          styles.videoContainer,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          contentFit="contain"
          nativeControls={false}
        />
      </Animated.View>

      {/* 動画読み込み中のスプラッシュ */}
      {!isVideoLoaded && (
        <View style={styles.loadingContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.brandText}>GINEQUE</Text>
            <Text style={styles.taglineText}>究極の映画体験へようこそ</Text>
          </View>
          
          <View style={styles.loadingIndicator}>
            <View style={styles.loadingBar}>
              <Animated.View style={styles.loadingProgress} />
            </View>
            <Text style={styles.loadingText}>動画を読み込み中...</Text>
          </View>
        </View>
      )}


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  videoContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  brandText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fffacd',
    letterSpacing: 6,
    textShadowColor: '#000080',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    marginBottom: 20,
  },
  taglineText: {
    fontSize: 16,
    color: '#fffacd',
    opacity: 0.8,
    letterSpacing: 2,
  },
  loadingIndicator: {
    alignItems: 'center',
  },
  loadingBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 250, 205, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 15,
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#fffacd',
    borderRadius: 2,
    width: '70%', // アニメーション効果
  },
  loadingText: {
    color: '#fffacd',
    fontSize: 14,
    opacity: 0.7,
  },
});

export default IntroVideoScreen;