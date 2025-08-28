// 開発用: イントロ動画の視聴状態をリセットするスクリプト
// Metro bundlerのコンソールで以下を実行:
// require('./reset_intro.js')

import AsyncStorage from '@react-native-async-storage/async-storage';

const resetIntroStatus = async () => {
  try {
    await AsyncStorage.removeItem('hasSeenIntro');
    console.log('✅ イントロ視聴状態をリセットしました！アプリを再起動してください。');
  } catch (error) {
    console.error('❌ リセットエラー:', error);
  }
};

// 実行
resetIntroStatus();

export default resetIntroStatus;