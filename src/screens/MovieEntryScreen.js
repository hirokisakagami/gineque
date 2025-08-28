import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { formatFileSize } from '../services/uploadService';
import { uploadSelectedVideo, uploadSelectedImage } from '../services/uploadServiceDirect';
import { uploadImage } from '../config/cloudflareImages';
import { createUserMovie } from '../services/movieService';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const { width, height } = Dimensions.get('window');

const MovieEntryScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedThumbnail, setSelectedThumbnail] = useState(null); // 選択された画像（未アップロード）
  const [selectedVideo, setSelectedVideo] = useState(null); // 選択された動画（未アップロード）
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    video: 0,
    thumbnail: 0,
    overall: 0
  });
  
  const { user } = useAuth();
  
  // アニメーション
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  useEffect(() => {
    // 画面表示アニメーション
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleVideoSelect = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Alert.alert(
      'ビデオを選択',
      'ビデオファイルを選択してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'アルバムから選択',
          onPress: () => selectVideoFromGallery()
        },
        {
          text: 'ファイルから選択',
          onPress: () => selectVideoFromFiles()
        },
      ]
    );
  };

  const selectVideoFromGallery = async () => {
    try {
      // メディアライブラリの権限をリクエスト
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('権限が必要です', 'アルバムへのアクセス権限が必要です');
        return;
      }

      // アルバムから動画を選択
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const videoFile = result.assets[0];
        
        // DocumentPickerの形式に合わせてデータを整形
        const formattedVideoFile = {
          uri: videoFile.uri,
          name: videoFile.fileName || `video_${Date.now()}.mp4`,
          size: videoFile.fileSize || 0,
          type: 'video/mp4',
        };

        setSelectedVideo(formattedVideoFile);
        Alert.alert('選択完了', `${formattedVideoFile.name} が選択されました`);
      }
    } catch (error) {
      console.error('Gallery video selection error:', error);
      Alert.alert('エラー', 'アルバムからの動画選択に失敗しました');
    }
  };

  const selectVideoFromFiles = async () => {
    try {
      // ファイルシステムから動画ファイルを選択
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const videoFile = result.assets[0];
        
        setSelectedVideo(videoFile);
        Alert.alert('選択完了', `${videoFile.name} が選択されました`);
      }
    } catch (error) {
      console.error('File video selection error:', error);
      Alert.alert('エラー', 'ファイルからの動画選択に失敗しました');
    }
  };

  const handleThumbnailSelect = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Alert.alert(
      'サムネイルを選択',
      'サムネイル画像を選択してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ギャラリーから選択',
          onPress: () => selectThumbnailFromGallery()
        },
        {
          text: 'カメラで撮影',
          onPress: () => selectThumbnailFromCamera()
        },
      ]
    );
  };

  const selectThumbnailFromGallery = async () => {
    try {
      // 画像選択のみ（アップロードはしない）
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('メディアライブラリへのアクセス権限が必要です');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [140, 190], // 3:4 の縦長
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedThumbnail(result.assets[0]);
        Alert.alert('選択完了', 'サムネイルが選択されました');
      }
    } catch (error) {
      console.error('Thumbnail selection error:', error);
      Alert.alert('エラー', error.message || 'サムネイルの選択に失敗しました');
    }
  };

  const selectThumbnailFromCamera = async () => {
    try {
      // カメラ撮影のみ（アップロードはしない）
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('カメラへのアクセス権限が必要です');
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [140, 190], // 3:4 の縦長
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedThumbnail(result.assets[0]);
        Alert.alert('撮影完了', 'サムネイルが撮影されました');
      }
    } catch (error) {
      console.error('Camera selection error:', error);
      Alert.alert('エラー', error.message || 'カメラでの撮影に失敗しました');
    }
  };

  const handleSubmit = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!title.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('エラー', '概要を入力してください');
      return;
    }
    
    if (!selectedVideo) {
      Alert.alert('エラー', 'ビデオを選択してください');
      return;
    }

    if (!user) {
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Step 1: 動画をアップロード
      setUploadProgress(prev => ({ ...prev, overall: 10, video: 0 }));
      console.log('Uploading video...');
      
      const videoUploadResult = await uploadSelectedVideo(selectedVideo, (progress) => {
        setUploadProgress(prev => ({ ...prev, video: progress, overall: 10 + (progress * 0.4) }));
      });
      setUploadProgress(prev => ({ ...prev, overall: 50, video: 100 }));

      // Step 2: サムネイルをアップロード（選択されている場合のみ）
      let thumbnailUploadResult = null;
      if (selectedThumbnail) {
        console.log('Uploading thumbnail...');
        setUploadProgress(prev => ({ ...prev, overall: 70, thumbnail: 0 }));
        
        thumbnailUploadResult = await uploadSelectedImage(selectedThumbnail, (progress) => {
          setUploadProgress(prev => ({ ...prev, thumbnail: progress, overall: 60 + (progress * 0.2) }));
        });
        
        setUploadProgress(prev => ({ ...prev, overall: 80, thumbnail: 100 }));
      }

      // Step 3: データベースに保存
      setUploadProgress(prev => ({ ...prev, overall: 90 }));
      console.log('Saving to database...');

      const movieData = {
        title: title.trim(),
        description: description.trim(),
        video_id: videoUploadResult.videoId,
        image_id: thumbnailUploadResult?.imageId || null,
        category: '審査中',
        created_at: videoUploadResult.uploadedAt || new Date().toISOString(),
        updated_at: videoUploadResult.uploadedAt || new Date().toISOString()
      };
      
      console.log('Submitting movie data:', movieData);
      
      // データベースに保存
      const savedMovie = await createUserMovie(
        movieData, 
        user.id, 
        user.user_metadata?.user_role || 'filmmaker'
      );
      
      console.log('Movie saved successfully:', savedMovie);
      
      setUploadProgress(prev => ({ ...prev, overall: 100 }));
      
      // 成功メッセージと詳細表示
      Alert.alert(
        '🎉 投稿完了！',
        '作品が正常に投稿されました！\n\n' +
        `📝 タイトル: ${savedMovie.title}\n` +
        `🎬 ビデオID: ${savedMovie.video_id}\n` +
        `🖼️ サムネイルID: ${savedMovie.image_id || '未設定'}\n` +
        `👤 作成者: あなた`,
        [
          {
            text: 'OK',
            onPress: () => {
              // フォームをリセット
              setTitle('');
              setDescription('');
              setSelectedThumbnail(null);
              setSelectedVideo(null);
              setUploadProgress({ video: 0, thumbnail: 0, overall: 0 });
              
              // プロフィール画面に戻る
              navigation.goBack();
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Movie submission error:', error);
      Alert.alert(
        'エラー',
        `作品の投稿に失敗しました：\n${error.message || '不明なエラーが発生しました'}`
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress({ video: 0, thumbnail: 0, overall: 0 });
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000080', '#000066', '#00004d', '#000033']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ヘッダー */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ],
              }
            ]}
          >
            <View style={styles.headerContent}>
              <Image 
                source={require('../../assets/kantoku.png')} 
                style={styles.directorIcon}
                resizeMode="contain"
              />
              <View style={styles.headerText}>
                <Text style={styles.title}>作品を投稿</Text>
                <Text style={styles.subtitle}>あなたの創作を世界に届けましょう</Text>
              </View>
            </View>
          </Animated.View>

          {/* メインフォーム */}
          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            {/* ビデオアップロード */}
            <View style={styles.uploadSection}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="videocam" size={20} color="#fffacd" />
                {' '}ビデオファイル
              </Text>
              <TouchableOpacity
                style={[styles.uploadButton, selectedVideo && styles.uploadButtonSuccess]}
                onPress={handleVideoSelect}
                disabled={isSubmitting}
              >
                {selectedVideo ? (
                  <View style={styles.uploadedContainer}>
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    <Text style={styles.uploadedText}>ビデオが選択されました</Text>
                    <Text style={styles.uploadDetail}>
                      {selectedVideo.name} ({formatFileSize(selectedVideo.size)})
                    </Text>
                    <Text style={styles.uploadHint}>投稿時にアップロードされます</Text>
                  </View>
                ) : (
                  <View style={styles.uploadPrompt}>
                    <Ionicons name="videocam" size={32} color="#fffacd" />
                    <Text style={styles.uploadPromptText}>ビデオファイルを選択</Text>
                    <Text style={styles.uploadHint}>アルバムまたはファイルから選択</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* サムネイルアップロード */}
            <View style={styles.uploadSection}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="image" size={20} color="#fffacd" />
                {' '}サムネイル画像
              </Text>
              <TouchableOpacity
                style={styles.thumbnailUploadButton}
                onPress={handleThumbnailSelect}
                disabled={isSubmitting}
              >
                {selectedThumbnail ? (
                  <View style={styles.thumbnailPreview}>
                    <Image 
                      source={{ uri: selectedThumbnail.uri }} 
                      style={styles.thumbnailImage} 
                    />
                    <View style={styles.thumbnailOverlay}>
                      <Ionicons name="camera" size={20} color="white" />
                      <Text style={styles.thumbnailOverlayText}>変更</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.thumbnailPrompt}>
                    <Ionicons name="camera" size={32} color="#fffacd" />
                    <Text style={styles.thumbnailPromptText}>サムネイルを設定</Text>
                    <Text style={styles.thumbnailHint}>3:4 推奨（縦長）</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* タイトル入力 */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="text" size={20} color="#fffacd" />
                {' '}タイトル
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="作品タイトルを入力してください"
                  placeholderTextColor="#B0B0B0"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
                <Text style={styles.charCounter}>{title.length}/100</Text>
              </View>
            </View>

            {/* 概要入力 */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="document-text" size={20} color="#fffacd" />
                {' '}概要
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.textInput, styles.descriptionInput]}
                  placeholder="作品の概要や見どころを入力してください"
                  placeholderTextColor="#B0B0B0"
                  value={description}
                  onChangeText={setDescription}
                  multiline={true}
                  numberOfLines={4}
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.charCounter}>{description.length}/500</Text>
              </View>
            </View>

            {/* 投稿ボタン */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!title.trim() || !description.trim() || !selectedVideo) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!title.trim() || !description.trim() || !selectedVideo || isSubmitting}
            >
              <LinearGradient
                colors={['#fffacd', '#fff8dc', '#f0e68c']}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isSubmitting ? (
                  <>
                    <ActivityIndicator size="small" color="#000080" />
                    <Text style={styles.submitButtonText}>
                      アップロード＆投稿中... {uploadProgress.overall}%
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="rocket" size={20} color="#000080" />
                    <Text style={styles.submitButtonText}>作品を投稿</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 250, 205, 0.08)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  directorIcon: {
    width: 50,
    height: 50,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fffacd',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    opacity: 0.8,
  },
  formContainer: {
    gap: 25,
  },
  uploadSection: {
    marginBottom: 5,
  },
  inputSection: {
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fffacd',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: 'rgba(255, 250, 205, 0.1)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 250, 205, 0.3)',
    borderStyle: 'dashed',
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  uploadButtonSuccess: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: 'rgba(76, 175, 80, 0.3)',
    borderStyle: 'solid',
  },
  uploadPrompt: {
    alignItems: 'center',
  },
  uploadPromptText: {
    color: '#fffacd',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  uploadHint: {
    color: '#CCCCCC',
    fontSize: 12,
    opacity: 0.7,
  },
  uploadingContainer: {
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fffacd',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  uploadedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadedText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadDetail: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.8,
  },
  thumbnailUploadButton: {
    backgroundColor: 'rgba(255, 250, 205, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.2)',
    overflow: 'hidden',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPreview: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  thumbnailOverlayText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  thumbnailPrompt: {
    alignItems: 'center',
  },
  thumbnailPromptText: {
    color: '#fffacd',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  thumbnailHint: {
    color: '#CCCCCC',
    fontSize: 12,
    opacity: 0.7,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 250, 205, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    color: '#fffacd',
    fontSize: 16,
    paddingVertical: 4,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCounter: {
    color: '#CCCCCC',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
    opacity: 0.6,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  submitButtonText: {
    color: '#000080',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default MovieEntryScreen;