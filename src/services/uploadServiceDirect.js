// 直接アップロード用のサービス（投稿ボタン押下時に使用）
import { uploadImage } from '../config/cloudflareImages';
import { uploadVideoToStream } from '../config/cloudflare';

// 選択済みの動画ファイルを直接アップロード
export const uploadSelectedVideo = async (videoFile, onProgress) => {
  try {
    console.log('Starting video upload to Cloudflare Stream...');
    console.log('Video file details:', {
      name: videoFile.name,
      size: videoFile.size,
      mimeType: videoFile.mimeType,
      uri: videoFile.uri
    });

    // プログレス処理
    let uploadProgress = 0;
    const progressInterval = setInterval(() => {
      uploadProgress += 3;
      if (uploadProgress <= 90 && onProgress) {
        onProgress(uploadProgress);
      }
    }, 500);

    try {
      // Cloudflare Streamにアップロード
      const uploadResult = await uploadVideoToStream({
        uri: videoFile.uri,
        mimeType: videoFile.mimeType || 'video/mp4',
        name: videoFile.name || `video_${Date.now()}.mp4`
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
        originalName: videoFile.name,
        fileSize: videoFile.size,
        uploadedAt: uploadResult.result.created || new Date().toISOString()
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

// 選択済みの画像ファイルを直接アップロード
export const uploadSelectedImage = async (imageFile, onProgress) => {
  try {
    console.log('Uploading selected image:', imageFile);

    if (onProgress) {
      onProgress(50);
    }

    // Cloudflare Imagesにアップロード
    const uploadResult = await uploadImage({
      uri: imageFile.uri,
      mimeType: imageFile.mimeType || 'image/jpeg',
      name: `thumbnail_${Date.now()}.jpg`
    }, {
      title: 'Movie Thumbnail'
    });

    if (onProgress) {
      onProgress(100);
    }

    if (!uploadResult.success) {
      throw new Error('画像アップロードに失敗しました');
    }

    return {
      imageId: uploadResult.result.id,
      url: uploadResult.result.variants?.[0] || `https://imagedelivery.net/a7T4jvSHK-io9LvvC0LMeQ/${uploadResult.result.id}/public`,
      originalUri: imageFile.uri,
      uploadedAt: uploadResult.result.uploaded || new Date().toISOString()
    };

  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};