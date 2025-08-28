import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import { getImageUrl } from '../config/cloudflareImages';
import { recordViewingHistory } from '../services/viewingHistoryService';
import { addToMyList, removeFromMyList, isInMyList } from '../services/myListService';
import { useDataUpdate } from '../contexts/DataUpdateContext';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const MovieDetailScreen = ({ route, navigation }) => {
  const { movie } = route.params;
  const { markMyListForUpdate, markViewingHistoryForUpdate } = useDataUpdate();
  const [isInMyListState, setIsInMyListState] = useState(false);
  const [myListLoading, setMyListLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('synopsis');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  
  // 映画画像を取得する関数（両方の形式に対応）
  const getMovieImage = (movieData) => {
    // 既に変換済みの場合（小さなサムネから）
    if (movieData.image) {
      return movieData.image;
    }
    // DBから直接の場合（大きなサムネから）
    if (movieData.image_id) {
      return getImageUrl(movieData.image_id, 'public') || `https://imagedelivery.net/a7T4jvSHK-io9LvvC0LMeQ/${movieData.image_id}/public`;
    }
    // フォールバック
    return 'https://via.placeholder.com/400x600/333333/FFFFFF?text=' + encodeURIComponent(movieData.title || 'MOVIE');
  };
  
  // Cloudflare Stream URL構築 - 正しいマニフェスト形式
  const getStreamUrl = (videoId) => {
    if (!videoId) return null;
    
    // 正しいCloudflare Stream HLS URL (あなたのcustomerIdを使用)
    return `https://customer-tuyd0caye2jufpak.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
    
    // 代替案1: DASHマニフェスト
    // return `https://customer-tuyd0caye2jufpak.cloudflarestream.com/${videoId}/manifest/video.mpd`;
  };
  
  // Video player setup
  const videoUrl = getStreamUrl(movie.videoId || movie.video_id);
  console.log('Movie data:', movie);
  console.log('Video ID:', movie.videoId || movie.video_id);
  console.log('Video URL:', videoUrl);
  
  const player = useVideoPlayer(videoUrl, player => {
    player.loop = false;
  });

  // 動画の時間を定期的に取得する
  useEffect(() => {
    let interval;
    
    if (isPlaying && player) {
      interval = setInterval(() => {
        try {
          // playerのcurrentTimeとdurationを直接取得
          const currentTime = player.currentTime || 0;
          const duration = player.duration || 0;
          
          if (currentTime > 0) {
            setCurrentTime(currentTime);
            console.log('Current time updated:', currentTime);
          }
          
          if (duration > 0 && videoDuration === 0) {
            setVideoDuration(duration);
            console.log('Duration updated:', duration);
          }
        } catch (error) {
          console.log('Error getting video time:', error);
        }
      }, 1000); // 1秒ごとに確認
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, player, videoDuration]);

  // マイリスト状態をチェック
  useEffect(() => {
    const checkMyListStatus = async () => {
      try {
        const inMyList = await isInMyList(movie.id);
        setIsInMyListState(inMyList);
      } catch (error) {
        console.error('Failed to check my list status:', error);
      }
    };

    checkMyListStatus();
  }, [movie.id]);

  // マイリストボタンの処理
  const handleMyListPress = async () => {
    try {
      setMyListLoading(true);
      
      // 触覚フィードバック
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (isInMyListState) {
        // マイリストから削除
        await removeFromMyList(movie.id);
        setIsInMyListState(false);
        markMyListForUpdate(); // マイリスト変更を通知
        console.log('Removed from my list');
      } else {
        // マイリストに追加
        await addToMyList(movie.id);
        setIsInMyListState(true);
        markMyListForUpdate(); // マイリスト変更を通知
        console.log('Added to my list');
      }
    } catch (error) {
      console.error('My list operation failed:', error);
      // エラーメッセージを表示（オプション）
    } finally {
      setMyListLoading(false);
    }
  };
  
  const handlePlayPress = async () => {
    setShowVideoPlayer(true);
    setIsPlaying(true);
    
    // 即座に再生開始
    player.play();
    
    
    // 自動的に横向きフルスクリーンに切り替え
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } catch (error) {
      console.log('Screen orientation lock failed:', error);
    }
  };
  
  const handleCloseVideo = async () => {
    // 視聴履歴を記録（動画を閉じる時）
    try {
      const movieId = movie.id;
      console.log('Recording viewing history on close:', { 
        movieId, 
        currentTime, 
        videoDuration,
        percentage: videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0
      });
      await recordViewingHistory(movieId, currentTime, videoDuration);
      markViewingHistoryForUpdate(); // 視聴履歴変更を通知
      console.log('Viewing history recorded successfully');
    } catch (error) {
      console.error('Failed to record viewing history:', error);
    }
    
    setShowVideoPlayer(false);
    setIsPlaying(false);
    player.pause();
    
    // 縦向きに戻す
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } catch (error) {
      console.log('Screen orientation unlock failed:', error);
    }
  };
  
  // ヘッダー表示制御
  useEffect(() => {
    navigation.setOptions({
      headerShown: !showVideoPlayer // 動画再生中はヘッダー非表示
    });
  }, [showVideoPlayer, navigation]);

  // 定期的に視聴履歴を保存（30秒ごと）
  useEffect(() => {
    let interval;
    if (isPlaying && videoDuration > 0) {
      interval = setInterval(async () => {
        try {
          await recordViewingHistory(movie.id, currentTime, videoDuration);
          markViewingHistoryForUpdate(); // 定期保存でも視聴履歴更新を通知
          console.log('Periodic viewing history saved:', { currentTime, videoDuration });
        } catch (error) {
          console.error('Failed to save periodic viewing history:', error);
        }
      }, 30000); // 30秒ごと
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, currentTime, videoDuration, movie.id]);

  // コンポーネントのクリーンアップ時に画面向きをリセット
  useEffect(() => {
    return () => {
      ScreenOrientation.unlockAsync();
      // コンポーネント終了時にヘッダーを復元
      navigation.setOptions({ headerShown: true });
    };
  }, [navigation]);

  // Sample detailed movie data
  const movieDetails = {
    ...movie,
    director: '監督: ダファー兄弟',
    cast: ['ミリー・ボビー・ブラウン', 'フィン・ヴォルフハルト', 'ゲイテン・マタラッツォ'],
    year: '2016',
    duration: '8エピソード',
    rating: '★ 8.7',
    genre: 'SF・ホラー・ドラマ',
    description: movie.description || '1980年代のインディアナ州の小さな町で、少年が行方不明になる。母親、警察署長、友人たちが真実を探る中で、政府の秘密実験や超自然現象に遭遇する。',
  };

  // 視聴者コメントのダミーデータ
  const viewerComments = [
    {
      id: 1,
      user: '映画好きA',
      comment: 'この映画は本当に素晴らしかった！感動して涙が出ました。',
      date: '2024年1月20日',
      likes: 12
    },
    {
      id: 2,
      user: 'シネマファン',
      comment: '演技が自然で引き込まれました。特に主演の演技が光っていた。',
      date: '2024年1月18日',
      likes: 8
    },
    {
      id: 3,
      user: 'ドラマ愛好家',
      comment: 'ストーリー展開が予想できなくて最後まで楽しめた！',
      date: '2024年1月15日',
      likes: 15
    },
  ];


  const relatedMovies = [
    { id: 1, title: 'ダークナイト', image: 'https://via.placeholder.com/140x200/333333/FFFFFF?text=DK' },
    { id: 2, title: 'インセプション', image: 'https://via.placeholder.com/140x200/444444/FFFFFF?text=INC' },
    { id: 3, title: 'インターステラー', image: 'https://via.placeholder.com/140x200/555555/FFFFFF?text=INT' },
  ];

  const reviews = [
    {
      id: 1,
      user: '映画レビュアー',
      avatar: 'https://via.placeholder.com/40x40/E50914/FFFFFF?text=U1',
      rating: 5,
      comment: '素晴らしいSF作品！80年代のノスタルジアと現代的な演出が完璧に融合している。',
      date: '2024年1月15日'
    },
    {
      id: 2,
      user: 'ドラマファン',
      avatar: 'https://via.placeholder.com/40x40/B91C1C/FFFFFF?text=U2',
      rating: 4,
      comment: 'キャラクター開発が素晴らしい。特に子役たちの演技が光っている。',
      date: '2024年1月10日'
    },
  ];


  const renderRelatedMovie = ({ item }) => (
    <TouchableOpacity
      style={styles.relatedItem}
      onPress={() => navigation.push('MovieDetail', { movie: item })}
    >
      <Image source={{ uri: item.image }} style={styles.relatedImage} />
      <Text style={styles.relatedTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderViewerComment = ({ item }) => (
    <LinearGradient
      colors={['rgba(255, 250, 205, 0.08)', 'rgba(255, 250, 205, 0.03)']}
      style={styles.commentItem}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.commentHeader}>
        <Text style={styles.commentUser}>{item.user}</Text>
        <Text style={styles.commentDate}>{item.date}</Text>
      </View>
      <Text style={styles.commentText}>{item.comment}</Text>
      <View style={styles.commentActions}>
        <TouchableOpacity style={styles.likeButton}>
          <Ionicons name="heart-outline" size={16} color="#fffacd" />
          <Text style={styles.likeCount}>{item.likes}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  // 動画再生中はスクロール無効 - Netflix風フルスクリーン
  if (showVideoPlayer && videoUrl) {
    return (
      <View style={styles.fullscreenVideoContainer}>
        <VideoView
          style={styles.netflixVideoPlayer}
          player={player}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          startsPictureInPictureAutomatically={false}
          contentFit="contain"
          nativeControls={true}
        />
        <TouchableOpacity 
          style={styles.netflixCloseButton}
          onPress={handleCloseVideo}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <Image 
          source={{ uri: getMovieImage(movie) }} 
          style={styles.heroImage} 
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)', '#000000']}
          style={styles.gradient}
        />
        
        <View style={styles.heroContent}>
          <View style={styles.movieTitleContainer}>
            <Text style={styles.movieTitle}>{movieDetails.title}</Text>
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.movieLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.movieMeta}>
            <Text style={styles.movieYear}>{movieDetails.year}</Text>
            <Text style={styles.movieRating}>{movieDetails.rating}</Text>
            <Text style={styles.movieDuration}>{movieDetails.duration}</Text>
          </View>
          <Text style={styles.movieGenre}>{movieDetails.genre}</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.playButton} onPress={handlePlayPress}>
              <Ionicons name="play" size={24} color="#000000" />
              <Text style={styles.playButtonText}>再生</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.listButton}
              onPress={handleMyListPress}
              disabled={myListLoading}
            >
              <Ionicons 
                name={isInMyListState ? 'checkmark' : 'add'} 
                size={24} 
                color="#000080" 
              />
              <Text style={styles.listButtonText}>
                {myListLoading 
                  ? '処理中...' 
                  : isInMyListState 
                    ? 'マイリストに追加済み' 
                    : 'マイリストに追加'
                }
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={24} color="#000080" />
              <Text style={styles.shareButtonText}>シェア</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>


      {/* Tab Navigation */}
      <View style={styles.simpleTabContainer}>
        <TouchableOpacity
          style={styles.simpleTab}
          onPress={() => setActiveTab('synopsis')}
        >
          <Text style={[styles.simpleTabText, activeTab === 'synopsis' && styles.activeSimpleTabText]}>
            あらすじ
          </Text>
          {activeTab === 'synopsis' && <View style={styles.simpleActiveIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.simpleTab}
          onPress={() => setActiveTab('comments')}
        >
          <Text style={[styles.simpleTabText, activeTab === 'comments' && styles.activeSimpleTabText]}>
            コメント
          </Text>
          {activeTab === 'comments' && <View style={styles.simpleActiveIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'synopsis' && (
          <View style={styles.synopsisContainer}>
            {/* あらすじカード */}
            <LinearGradient
              colors={['rgba(255, 250, 205, 0.1)', 'rgba(255, 250, 205, 0.05)']}
              style={styles.descriptionCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.descriptionTitle}>あらすじ</Text>
              <Text style={styles.description}>{movieDetails.description}</Text>
            </LinearGradient>
            
            {/* 映画情報カード */}
            <View style={styles.infoCards}>
              <LinearGradient
                colors={['rgba(255, 250, 205, 0.08)', 'rgba(255, 250, 205, 0.03)']}
                style={styles.infoCard}
              >
                <Ionicons name="person" size={20} color="#fffacd" />
                <Text style={styles.infoLabel}>監督</Text>
                <Text style={styles.infoValue}>{movieDetails.director}</Text>
              </LinearGradient>
              
              <LinearGradient
                colors={['rgba(255, 250, 205, 0.08)', 'rgba(255, 250, 205, 0.03)']}
                style={styles.infoCard}
              >
                <Ionicons name="time" size={20} color="#fffacd" />
                <Text style={styles.infoLabel}>上映時間</Text>
                <Text style={styles.infoValue}>{movieDetails.runtime || '120分'}</Text>
              </LinearGradient>
            </View>

            {/* キャストセクション */}
            <LinearGradient
              colors={['rgba(255, 250, 205, 0.1)', 'rgba(255, 250, 205, 0.05)']}
              style={styles.castCard}
            >
              <View style={styles.castHeader}>
                <Ionicons name="people" size={20} color="#fffacd" />
                <Text style={styles.castTitle}>主要キャスト</Text>
              </View>
              <View style={styles.castGrid}>
                {movieDetails.cast.map((actor, index) => (
                  <View key={index} style={styles.castItem}>
                    <Text style={styles.castMember}>{actor}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        )}

        {activeTab === 'comments' && (
          <View style={styles.commentsContainer}>
            {/* コメントヘッダー */}
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>
                <Ionicons name="chatbubbles" size={18} color="#fffacd" /> 視聴者コメント ({viewerComments.length})
              </Text>
            </View>
            
            {/* コメントリスト */}
            <FlatList
              data={viewerComments}
              renderItem={renderViewerComment}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000080',
  },
  // Netflix風フルスクリーン動画プレイヤー（ヘッダー完全非表示）
  fullscreenVideoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  netflixVideoPlayer: {
    width: '100%',
    height: '100%',
  },
  netflixCloseButton: {
    position: 'absolute',
    top: 30,
    right: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  heroContainer: {
    height: height * 0.6,
    position: 'relative',
  },
  heroImage: {
    width: width,
    height: height * 0.6,
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  movieTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  movieTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fffacd',
    flex: 1,
  },
  movieLogo: {
    width: 32,
    height: 32,
    marginLeft: 12,
    opacity: 0.8,
  },
  movieMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  movieYear: {
    color: '#CCCCCC',
    fontSize: 16,
    marginRight: 15,
  },
  movieRating: {
    color: '#4ECDC4',
    fontSize: 16,
    marginRight: 15,
  },
  movieDuration: {
    color: '#CCCCCC',
    fontSize: 16,
  },
  movieGenre: {
    color: '#CCCCCC',
    fontSize: 16,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  playButton: {
    backgroundColor: '#fffacd',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  listButton: {
    backgroundColor: 'rgba(109, 109, 110, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 6,
    flex: 2,
    justifyContent: 'center',
  },
  listButtonText: {
    color: '#fffacd',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  shareButton: {
    backgroundColor: 'rgba(109, 109, 110, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 6,
    justifyContent: 'center',
  },
  shareButtonText: {
    color: '#fffacd',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tabContent: {
    padding: 20,
  },
  description: {
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  detailsSection: {
    marginBottom: 30,
  },
  director: {
    color: '#fffacd',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  castSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  castTitle: {
    color: '#fffacd',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  castList: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  castMember: {
    color: '#CCCCCC',
    fontSize: 16,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fffacd',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  relatedList: {
    paddingRight: 20,
  },
  relatedItem: {
    marginRight: 15,
    width: 140,
  },
  relatedImage: {
    width: 140,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  relatedTitle: {
    color: '#fffacd',
    fontSize: 14,
    textAlign: 'center',
  },
  reviewItem: {
    backgroundColor: '#fffacd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUser: {
    color: '#fffacd',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewDate: {
    color: '#8C8C8C',
    fontSize: 12,
  },
  reviewComment: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
  },
  writeReviewButton: {
    backgroundColor: '#001a4d',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  writeReviewText: {
    color: '#fffacd',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // シンプルなタブスタイル
  simpleTabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 40,
  },
  simpleTab: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: 'relative',
  },
  simpleTabText: {
    color: '#8C8C8C',
    fontSize: 16,
    fontWeight: '500',
  },
  activeSimpleTabText: {
    color: '#fffacd',
    fontWeight: '600',
  },
  simpleActiveIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#fffacd',
    borderRadius: 1,
  },
  
  // あらすじコンテナ
  synopsisContainer: {
    padding: 20,
    paddingTop: 10,
  },
  descriptionCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.2)',
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fffacd',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    color: '#CCCCCC',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'justify',
  },
  
  // 情報カード
  infoCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  infoCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.15)',
  },
  infoLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    color: '#fffacd',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // キャストカード
  castCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.2)',
  },
  castHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  castTitle: {
    color: '#fffacd',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  castGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  castItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 250, 205, 0.08)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  castMember: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
  },
  
  // 関連作品セクション
  relatedSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fffacd',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  
  // コメントコンテナ
  commentsContainer: {
    padding: 20,
    paddingTop: 10,
  },
  commentsHeader: {
    marginBottom: 20,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fffacd',
  },
  
  // コメントアイテム
  commentItem: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.15)',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentUser: {
    color: '#fffacd',
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentDate: {
    color: '#999999',
    fontSize: 12,
  },
  commentText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  likeCount: {
    color: '#fffacd',
    fontSize: 12,
    marginLeft: 4,
  },
});

export default MovieDetailScreen;