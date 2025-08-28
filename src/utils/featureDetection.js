import { Platform } from 'react-native';
import * as Device from 'expo-device';

// Development Client かどうかを判定
export const isDevClient = () => {
  try {
    // Development Client の特定条件をチェック
    return __DEV__ && (
      Platform.OS === 'ios' || 
      Platform.OS === 'android'
    ) && Device.isDevice;
  } catch (error) {
    return false;
  }
};

// Expo Go かどうかを判定
export const isExpoGo = () => {
  try {
    return !isDevClient();
  } catch (error) {
    return true; // エラーの場合はExpo Goとして扱う
  }
};

// SVG機能が使用可能かチェック
export const isSvgAvailable = () => {
  try {
    require('react-native-svg');
    return true;
  } catch (error) {
    return false;
  }
};

// メディアライブラリが使用可能かチェック（削除済み）
export const isMediaLibraryAvailable = () => {
  return false;
};

// Video機能が使用可能かチェック
export const isVideoAvailable = () => {
  try {
    require('expo-video');
    return true;
  } catch (error) {
    return false;
  }
};

// 触覚フィードバックが使用可能かチェック
export const isHapticsAvailable = () => {
  try {
    require('expo-haptics');
    return true;
  } catch (error) {
    return false;
  }
};

// 使用可能な機能の一覧を取得
export const getAvailableFeatures = () => {
  return {
    isDevClient: isDevClient(),
    isExpoGo: isExpoGo(),
    hasSvg: isSvgAvailable(),
    hasMediaLibrary: isMediaLibraryAvailable(),
    hasVideo: isVideoAvailable(),
    hasHaptics: isHapticsAvailable(),
  };
};

// 機能制限のメッセージを取得
export const getFeatureLimitMessage = (feature) => {
  const messages = {
    svg: 'Expo Go版では感情チャートは表示されません。Development Clientをご利用ください。',
    video: 'Expo Go版では動画再生機能が制限されます。Development Clientをご利用ください。',
  };
  
  return messages[feature] || '一部機能が制限されています。';
};