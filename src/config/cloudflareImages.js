// Cloudflare Images設定（動画用のStreamとは別サービス）
export const CLOUDFLARE_IMAGES_CONFIG = {
  accountId: '11819e309f3bda41e3c4da6095548018',
  accountHash: '11819e309f3bda41e3c4da6095548018', 
  apiToken: 'tUJxnn_cmSLiFH4cjsNe2kAvycfebnrN7Dh1HkMy',
  deliveryUrl: 'https://imagedelivery.net/a7T4jvSHK-io9LvvC0LMeQ',
  uploadEndpoint: 'https://api.cloudflare.com/client/v4/accounts/11819e309f3bda41e3c4da6095548018/images/v1',
};

// 画像バリアント（サイズ別）
export const IMAGE_VARIANTS = {
  thumbnail: 'thumbnail',    // 小サムネ用
  medium: 'medium',         // 大サムネ用  
  large: 'large',          // フルサイズ用
  public: 'public'         // デフォルト
};

// 画像URL生成
export const getImageUrl = (imageId, variant = 'public') => {
  if (!imageId) return null;
  return `${CLOUDFLARE_IMAGES_CONFIG.deliveryUrl}/${imageId}/${variant}`;
};

// 画像アップロード
export const uploadImage = async (imageFile, metadata = {}) => {
  try {
    const formData = new FormData();
    
    // 画像ファイルを追加
    formData.append('file', {
      uri: imageFile.uri,
      type: imageFile.mimeType || 'image/jpeg',
      name: imageFile.name || 'image.jpg',
    });
    
    // メタデータを追加（オプション）
    if (metadata.title) {
      formData.append('metadata', JSON.stringify({ title: metadata.title }));
    }
    
    console.log('Uploading image to:', CLOUDFLARE_IMAGES_CONFIG.uploadEndpoint);
    
    const response = await fetch(CLOUDFLARE_IMAGES_CONFIG.uploadEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_IMAGES_CONFIG.apiToken}`,
      },
      body: formData,
    });
    
    console.log('Image upload response status:', response.status);
    const result = await response.json();
    console.log('Image upload result:', result);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
    }
    
    return result;
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
};

// 画像一覧取得
export const getImages = async () => {
  try {
    const url = `${CLOUDFLARE_IMAGES_CONFIG.uploadEndpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_IMAGES_CONFIG.apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    return result.result || [];
  } catch (error) {
    console.error('Failed to fetch images:', error);
    return [];
  }
};

// 画像削除
export const deleteImage = async (imageId) => {
  try {
    const response = await fetch(
      `${CLOUDFLARE_IMAGES_CONFIG.uploadEndpoint}/${imageId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_IMAGES_CONFIG.apiToken}`,
        },
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Failed to delete image:', error);
    return false;
  }
};

// サンプル画像ID（「マイクを止めるな」用）
export const SAMPLE_IMAGES = {
  dontStopTheCamera: '3b91e694-0008-4ec9-c7e2-2d749f6b4b00', // マイクを止めるな画像ID
};