import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadImage, getImageUrl } from '../config/cloudflareImages';
import { uploadVideoToStream } from '../config/cloudflare';

// アップロード用の共通サービス

// 画像選択とアップロード（サムネイル用）
export const selectAndUploadThumbnail = async () => {
  try {
    // メディアライブラリの権限をリクエスト
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('メディアライブラリへのアクセス権限が必要です');
    }

    // 画像を選択
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [140, 190], // 3:4 の縦長（サムネイル仕様）
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (result.canceled) {
      return null;
    }

    const selectedImage = result.assets[0];
    
    // 画像のサイズをチェック（推奨サイズに近いかどうか）
    const { width, height } = selectedImage;
    const aspectRatio = width / height;
    const targetAspectRatio = 140 / 190;
    
    console.log('Selected image dimensions:', { width, height, aspectRatio, targetAspectRatio });

    // Cloudflare Imagesにアップロード
    const uploadResult = await uploadImage({
      uri: selectedImage.uri,
      mimeType: selectedImage.mimeType || 'image/jpeg',
      name: `thumbnail_${Date.now()}.jpg`
    }, {
      title: 'Movie Thumbnail'
    });

    if (!uploadResult.success) {
      throw new Error('画像アップロードに失敗しました');
    }

    return {
      imageId: uploadResult.result.id,
      url: uploadResult.result.variants?.[0] || getImageUrl(uploadResult.result.id, 'public'),
      originalUri: selectedImage.uri,
      dimensions: { width, height },
      uploadedAt: uploadResult.result.uploaded || new Date().toISOString() // Cloudflareのアップロード時刻
    };

  } catch (error) {
    console.error('Thumbnail upload error:', error);
    throw error;
  }
};

// 動画選択とアップロード
export const selectAndUploadVideo = async (onProgress) => {
  try {
    // ドキュメントピッカーで動画ファイルを選択
    const result = await DocumentPicker.getDocumentAsync({
      type: ['video/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return null;
    }

    const selectedVideo = result.assets[0];
    
    console.log('Selected video:', {
      name: selectedVideo.name,
      size: selectedVideo.size,
      mimeType: selectedVideo.mimeType,
      uri: selectedVideo.uri
    });

    // ファイルサイズチェック（100MB制限）
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (selectedVideo.size > maxSize) {
      throw new Error('動画ファイルのサイズが大きすぎます（100MB以下にしてください）');
    }

    // プログレス処理のためのwrapper
    let uploadProgress = 0;
    const progressInterval = setInterval(() => {
      uploadProgress += 5;
      if (uploadProgress <= 95 && onProgress) {
        onProgress(uploadProgress);
      }
    }, 200);

    try {
      // Cloudflare Streamにアップロード
      const uploadResult = await uploadVideoToStream({
        uri: selectedVideo.uri,
        mimeType: selectedVideo.mimeType || 'video/mp4',
        name: selectedVideo.name || `video_${Date.now()}.mp4`
      });

      clearInterval(progressInterval);

      if (onProgress) {
        onProgress(100);
      }

      if (!uploadResult.success) {
        throw new Error('動画アップロードに失敗しました');
      }

      return {
        videoId: uploadResult.result.uid,
        streamUrl: uploadResult.result.playback?.hls || uploadResult.result.preview,
        thumbnailUrl: uploadResult.result.thumbnail,
        duration: uploadResult.result.duration,
        originalName: selectedVideo.name,
        fileSize: selectedVideo.size,
        uploadedAt: uploadResult.result.created || new Date().toISOString() // Cloudflareのアップロード時刻
      };

    } catch (uploadError) {
      clearInterval(progressInterval);
      throw uploadError;
    }

  } catch (error) {
    console.error('Video upload error:', error);
    throw error;
  }
};

// カメラで写真を撮影してアップロード
export const takePhotoAndUpload = async () => {
  try {
    // カメラの権限をリクエスト
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('カメラへのアクセス権限が必要です');
    }

    // カメラを起動
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [140, 190], // 3:4 の縦長
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    const photo = result.assets[0];

    // Cloudflare Imagesにアップロード
    const uploadResult = await uploadImage({
      uri: photo.uri,
      mimeType: photo.mimeType || 'image/jpeg',
      name: `photo_${Date.now()}.jpg`
    }, {
      title: 'Camera Photo Thumbnail'
    });

    if (!uploadResult.success) {
      throw new Error('写真アップロードに失敗しました');
    }

    return {
      imageId: uploadResult.result.id,
      url: uploadResult.result.variants?.[0] || getImageUrl(uploadResult.result.id, 'public'),
      originalUri: photo.uri,
      dimensions: { width: photo.width, height: photo.height },
      uploadedAt: uploadResult.result.uploaded || new Date().toISOString() // Cloudflareのアップロード時刻
    };

  } catch (error) {
    console.error('Camera photo upload error:', error);
    throw error;
  }
};

// アップロードの進行状況を管理するためのユーティリティ
export const createProgressTracker = () => {
  let progress = 0;
  let interval = null;
  
  const start = (onProgress, duration = 5000) => {
    progress = 0;
    const steps = 100;
    const stepDuration = duration / steps;
    
    interval = setInterval(() => {
      progress += 1;
      if (progress <= 95) {
        onProgress(progress);
      } else {
        clearInterval(interval);
      }
    }, stepDuration);
  };
  
  const complete = (onProgress) => {
    if (interval) {
      clearInterval(interval);
    }
    progress = 100;
    if (onProgress) {
      onProgress(100);
    }
  };
  
  const stop = () => {
    if (interval) {
      clearInterval(interval);
    }
  };
  
  return { start, complete, stop };
};

// ファイルサイズのフォーマット
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// MIMEタイプから拡張子を取得
export const getFileExtensionFromMimeType = (mimeType) => {
  const mimeToExt = {
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/x-ms-wmv': 'wmv',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
  };
  return mimeToExt[mimeType] || 'unknown';
};