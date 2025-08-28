import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Alert,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { getStreamUrl, getThumbnailUrl } from '../config/cloudflare';

const { width } = Dimensions.get('window');

const VideoPlayer = ({ 
  videoId, 
  title, 
  autoplay = false, 
  showControls = true,
  style = {},
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showControlsOverlay, setShowControlsOverlay] = useState(false);
  
  const streamUrl = getStreamUrl(videoId);
  const thumbnailUrl = getThumbnailUrl(videoId);

  const player = useVideoPlayer(streamUrl, (player) => {
    player.loop = false;
    player.muted = false;
    player.play();
  });

  const handlePlayPause = () => {
    try {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      console.error('Play/Pause error:', error);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.videoContainer}
        onPress={() => setShowControlsOverlay(!showControlsOverlay)}
        activeOpacity={1}
      >
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Ionicons name="refresh" size={40} color="#4ECDC4" />
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        )}

        {/* Controls Overlay */}
        {(showControls && showControlsOverlay) && (
          <View style={styles.controlsOverlay}>
            {/* Play/Pause Button */}
            <TouchableOpacity 
              style={styles.playButton}
              onPress={handlePlayPause}
            >
              <Ionicons 
                name={player.playing ? 'pause' : 'play'} 
                size={60} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>
                {formatTime(player.currentTime || 0)}
              </Text>
              
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${
                        ((player.currentTime || 0) / (player.duration || 1)) * 100
                      }%` 
                    }
                  ]} 
                />
              </View>
              
              <Text style={styles.timeText}>
                {formatTime(player.duration || 0)}
              </Text>
            </View>

            {/* Volume Control */}
            <View style={styles.volumeContainer}>
              <TouchableOpacity
                onPress={() => {
                  try {
                    player.muted = !player.muted;
                  } catch (error) {
                    console.error('Volume error:', error);
                  }
                }}
              >
                <Ionicons 
                  name={player.muted ? 'volume-mute' : 'volume-high'} 
                  size={24} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Video Title */}
      {title && (
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2F2F2F',
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoContainer: {
    position: 'relative',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(47, 47, 47, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(78, 205, 196, 0.8)',
    borderRadius: 50,
    padding: 15,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    minWidth: 40,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginHorizontal: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 2,
  },
  volumeContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  titleContainer: {
    padding: 15,
    backgroundColor: '#696969',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VideoPlayer;