// Cloudflare Stream設定（動画配信用）
export const CLOUDFLARE_CONFIG = {
  accountId: '11819e309f3bda41e3c4da6095548018',
  apiToken: 'tUJxnn_cmSLiFH4cjsNe2kAvycfebnrN7Dh1HkMy',
  streamEndpoint: 'https://api.cloudflare.com/client/v4/accounts/11819e309f3bda41e3c4da6095548018/stream',
  customerSubdomain: 'customer-tuyd0caye2jufpak.cloudflarestream.com',
};

// 動画アップロード
export const uploadVideoToStream = async (videoFile) => {
  try {
    const formData = new FormData();
    
    formData.append('file', {
      uri: videoFile.uri,
      type: videoFile.mimeType || 'video/mp4',
      name: videoFile.name || 'video.mp4',
    });

    const response = await fetch(CLOUDFLARE_CONFIG.streamEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_CONFIG.apiToken}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
    }

    return result;
  } catch (error) {
    console.error('Video upload failed:', error);
    throw error;
  }
};

// 動画一覧取得
export const getStreamVideos = async () => {
  try {
    const response = await fetch(CLOUDFLARE_CONFIG.streamEndpoint, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_CONFIG.apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result.result || [];
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    return [];
  }
};

// 動画削除
export const deleteStreamVideo = async (videoId) => {
  try {
    const response = await fetch(
      `${CLOUDFLARE_CONFIG.streamEndpoint}/${videoId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_CONFIG.apiToken}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Failed to delete video:', error);
    return false;
  }
};

// サムネイル取得
export const getThumbnailUrl = (videoId) => {
  return `https://${CLOUDFLARE_CONFIG.customerSubdomain}/${videoId}/thumbnails/thumbnail.jpg`;
};

// 認証テスト
export const testCloudflareAuth = async () => {
  try {
    const response = await fetch(CLOUDFLARE_CONFIG.streamEndpoint, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_CONFIG.apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    return false;
  }
};

// Stream サービスチェック
export const checkStreamService = async () => {
  return await testCloudflareAuth();
};

// Stream APIトークンテスト
export const testStreamApiToken = async () => {
  return await testCloudflareAuth();
};