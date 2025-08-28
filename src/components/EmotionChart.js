import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { isSvgAvailable } from '../utils/featureDetection';

// SVGを条件付きでインポート
let Svg, Circle, Path;
if (isSvgAvailable()) {
  const SvgModule = require('react-native-svg');
  Svg = SvgModule.default;
  Circle = SvgModule.Circle;
  Path = SvgModule.Path;
}

const { width } = Dimensions.get('window');

const EmotionChart = ({ emotions, totalViews = 0 }) => {
  // デフォルト感情データ
  const defaultEmotions = {
    かなしい: 0,
    うれしい: 0,
    おどろき: 0,
    こわい: 0,
    きゅん: 0,
  };

  const emotionData = { ...defaultEmotions, ...emotions };
  
  // 感情カラーマップ
  const emotionColors = {
    かなしい: '#4A90E2',  // 青
    うれしい: '#F5A623',  // オレンジ
    おどろき: '#7ED321',  // 緑
    こわい: '#B71C1C',    // 赤
    きゅん: '#E91E63',    // ピンク
  };

  const chartSize = 160;
  const centerX = chartSize / 2;
  const centerY = chartSize / 2;
  const radius = 60;

  // データの合計を計算
  const total = Object.values(emotionData).reduce((sum, value) => sum + value, 0);

  // パスを作成する関数
  const createPath = (startAngle, endAngle) => {
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  let currentAngle = -Math.PI / 2; // 12時方向から開始

  // SVGが利用できない場合のフォールバック表示
  if (!isSvgAvailable() || !Svg) {
    return (
      <View style={styles.container}>
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>感情分析</Text>
          <View style={styles.fallbackContent}>
            <Text style={styles.fallbackViewCount}>{totalViews} 回視聴</Text>
            {Object.entries(emotionData).map(([emotion, count]) => (
              <View key={emotion} style={styles.fallbackItem}>
                <View style={[styles.fallbackDot, { backgroundColor: emotionColors[emotion] }]} />
                <Text style={styles.fallbackText}>{emotion}: {count}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.fallbackNote}>
            円グラフ表示はDevelopment Clientで利用可能です
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Svg width={chartSize} height={chartSize}>
          {Object.entries(emotionData).map(([emotion, count]) => {
            if (count === 0 || total === 0) return null;
            
            const percentage = count / total;
            const sliceAngle = 2 * Math.PI * percentage;
            const endAngle = currentAngle + sliceAngle;
            
            const path = createPath(currentAngle, endAngle);
            const color = emotionColors[emotion];
            
            currentAngle = endAngle;
            
            return (
              <Path
                key={emotion}
                d={path}
                fill={color}
                stroke="#000080"
                strokeWidth={2}
              />
            );
          })}
          
          {/* 中央の円 */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={35}
            fill="#000080"
            stroke="#fffacd"
            strokeWidth={2}
          />
        </Svg>
        
        {/* 中央の視聴回数 */}
        <View style={styles.centerContent}>
          <Text style={styles.viewCountNumber}>{totalViews}</Text>
          <Text style={styles.viewCountLabel}>視聴回数</Text>
        </View>
      </View>

      {/* 凡例 */}
      <View style={styles.legend}>
        {Object.entries(emotionData).map(([emotion, count]) => (
          <View key={emotion} style={styles.legendItem}>
            <View style={[styles.colorDot, { backgroundColor: emotionColors[emotion] }]} />
            <Text style={styles.emotionLabel}>{emotion}</Text>
            <Text style={styles.emotionCount}>({count})</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  chartContainer: {
    position: 'relative',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewCountNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fffacd',
    textShadowColor: '#000080',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  viewCountLabel: {
    fontSize: 10,
    color: '#fffacd',
    marginTop: 2,
    opacity: 0.9,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: width * 0.8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
    backgroundColor: 'rgba(255, 250, 205, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.2)',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#fffacd',
  },
  emotionLabel: {
    fontSize: 14,
    color: '#fffacd',
    fontWeight: '600',
    marginRight: 4,
  },
  emotionCount: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  // フォールバック用スタイル
  fallbackContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 250, 205, 0.05)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.2)',
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fffacd',
    marginBottom: 15,
  },
  fallbackContent: {
    alignItems: 'center',
    marginBottom: 15,
  },
  fallbackViewCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fffacd',
    marginBottom: 15,
  },
  fallbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingHorizontal: 15,
  },
  fallbackDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#fffacd',
  },
  fallbackText: {
    fontSize: 14,
    color: '#fffacd',
    minWidth: 100,
  },
  fallbackNote: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default EmotionChart;