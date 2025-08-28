import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HeroBanner = ({ content, onPlayPress, onInfoPress }) => {
  return (
    <View style={styles.container}>
      <Image source={{ uri: content.image }} style={styles.image} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']}
        style={styles.gradient}
      />
      <View style={styles.content}>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.description} numberOfLines={3}>
          {content.description}
        </Text>
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.playButton} onPress={onPlayPress}>
            <Ionicons name="play" size={20} color="#000000" />
            <Text style={styles.playButtonText}>再生</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoButton} onPress={onInfoPress}>
            <Ionicons name="information-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.infoButtonText}>詳細情報</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 500,
    position: 'relative',
  },
  image: {
    width: width,
    height: 500,
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  content: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 20,
    lineHeight: 22,
  },
  buttons: {
    flexDirection: 'row',
    gap: 15,
  },
  playButton: {
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
  },
  playButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoButton: {
    backgroundColor: 'rgba(109, 109, 110, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
  },
  infoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default HeroBanner;