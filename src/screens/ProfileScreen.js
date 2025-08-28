import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { useDataUpdate } from '../contexts/DataUpdateContext';
import { getProfile, updateProfile, createProfile } from '../services/profileService';
import { getUserViewingHistory } from '../services/viewingHistoryService';
import { getMyList } from '../services/myListService';
import { getImageUrl } from '../config/cloudflareImages';
import { supabase } from '../config/supabase';
import NicknameEditModal from '../components/NicknameEditModal';
import ProfileLoadingScreen from '../components/ProfileLoadingScreen';

const ProfileScreen = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [viewingHistory, setViewingHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [myList, setMyList] = useState([]);
  const [loadingMyList, setLoadingMyList] = useState(false);
  const [myWorks, setMyWorks] = useState([]);
  const [loadingMyWorks, setLoadingMyWorks] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [lastVisitTime, setLastVisitTime] = useState(null);
  const { user, signOut, resetIntroStatus } = useAuth();
  const { 
    myListNeedsUpdate, 
    viewingHistoryNeedsUpdate, 
    clearUpdateFlags 
  } = useDataUpdate();

  useEffect(() => {
    if (user) {
      loadProfile();
      loadViewingHistory();
      loadMyList();
      
      // 初回読み込み完了後にフラグを更新
      setTimeout(() => {
        setIsInitialLoad(false);
      }, 1000);
    }
  }, [user]);

  // 画面にフォーカスした時にデータを再取得（必要な場合のみ）
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user && !isInitialLoad) {
        const currentTime = Date.now();
        const timeSinceLastVisit = lastVisitTime ? currentTime - lastVisitTime : 0;
        
        // 以下の条件で更新が必要
        const shouldRefresh = 
          needsRefresh || // 明示的に更新が必要とマークされている
          myListNeedsUpdate || // マイリストに変更あり
          viewingHistoryNeedsUpdate || // 視聴履歴に変更あり
          timeSinceLastVisit > 5 * 60 * 1000 || // 5分以上経過
          !profile || // プロフィールデータがない（初回のみ）
          viewingHistory.length === 0 || // 視聴履歴がない
          myList.length === 0; // マイリストがない（初回読み込み）
        
        if (shouldRefresh) {
          console.log('ProfileScreen focused, refreshing data...', {
            needsRefresh,
            myListNeedsUpdate,
            viewingHistoryNeedsUpdate,
            timeSinceLastVisit,
            hasProfile: !!profile,
            historyCount: viewingHistory.length,
            myListCount: myList.length
          });
          refreshAllData();
        } else {
          console.log('ProfileScreen focused, using cached data');
        }
        
        setLastVisitTime(currentTime);
      }
    });
    return unsubscribe;
  }, [navigation, user, isInitialLoad, needsRefresh, lastVisitTime, profile, viewingHistory, myList, myListNeedsUpdate, viewingHistoryNeedsUpdate]);

  // DataUpdateContextのフラグが変更された時にもリフレッシュをチェック
  useEffect(() => {
    if (user && !isInitialLoad && (myListNeedsUpdate || viewingHistoryNeedsUpdate)) {
      console.log('DataUpdate flags changed, checking refresh...', {
        myListNeedsUpdate,
        viewingHistoryNeedsUpdate
      });
      refreshAllData();
    }
  }, [myListNeedsUpdate, viewingHistoryNeedsUpdate, user, isInitialLoad]);

  // マイリストと視聴履歴のみ再取得する関数
  const refreshAllData = async () => {
    setRefreshing(true);
    setNeedsRefresh(false); // 更新フラグをクリア
    clearUpdateFlags(); // Context の更新フラグもクリア
    try {
      await Promise.all([
        loadViewingHistory(),
        loadMyList()
      ]);
    } catch (error) {
      console.error('Failed to refresh profile data:', error);
    } finally {
      // 最低0.8秒は読み込み画面を表示
      setTimeout(() => {
        setRefreshing(false);
      }, 800);
    }
  };

  const loadProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    console.log('Loading profile for user ID:', user.id);
    const { data, error } = await getProfile(user.id);
    
    if (error) {
      console.error('Profile load error:', error);
      // プロフィールが存在しない場合、作成する
      if (error.code === 'PGRST116') {
        console.log('Profile not found, creating new profile...');
        const userRole = user.user_metadata?.user_role || 'viewer';
        console.log('Creating profile with role:', userRole, 'from user metadata:', user.user_metadata);
        const { data: newProfile, error: createError } = await createProfile(user.id, {
          nickname: user.email.split('@')[0],
          user_role: userRole
        });
        
        if (createError) {
          console.error('Profile creation error:', createError);
        } else {
          console.log('New profile created:', newProfile);
          setProfile(newProfile);
        }
      }
    } else {
      console.log('Profile loaded:', data);
      // プロフィールにuser_roleが設定されていない場合、user_metadataから更新
      if (data && !data.user_role && user.user_metadata?.user_role) {
        console.log('Profile missing user_role, updating with:', user.user_metadata.user_role);
        const { data: updatedProfile, error: updateError } = await updateProfile(user.id, {
          user_role: user.user_metadata.user_role
        });
        if (updateError) {
          console.error('Profile update error:', updateError);
          setProfile(data);
        } else {
          console.log('Profile updated with user_role:', updatedProfile);
          setProfile(updatedProfile);
        }
      } else {
        setProfile(data);
      }
    }
    setLoading(false);
  };

  const loadViewingHistory = async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    try {
      const history = await getUserViewingHistory();
      console.log('Viewing history loaded:', history);
      setViewingHistory(history);
    } catch (error) {
      console.error('Failed to load viewing history:', error);
    }
    setLoadingHistory(false);
  };

  const loadMyList = async () => {
    setLoadingMyList(true);
    try {
      const myListData = await getMyList();
      console.log('My list loaded:', myListData);
      
      // データを画面表示用に変換
      const formattedMyList = myListData.map(item => ({
        id: item.movie_id,
        title: item.movies?.title || 'Unknown Movie',
        image: getMovieImage(item.movies || {}),
        videoId: item.movies?.video_id,
        description: item.movies?.description,
        addedAt: item.added_at
      }));
      
      setMyList(formattedMyList);
    } catch (error) {
      console.error('Failed to load my list:', error);
    }
    setLoadingMyList(false);
  };

  const getMovieImage = (movie) => {
    console.log('Getting movie image for:', movie);
    if (movie.image_id) {
      const imageUrl = getImageUrl(movie.image_id, 'public') || `https://imagedelivery.net/a7T4jvSHK-io9LvvC0LMeQ/${movie.image_id}/public`;
      console.log('Generated image URL:', imageUrl);
      return imageUrl;
    }
    console.log('No image_id, using placeholder');
    return 'https://via.placeholder.com/300x400/000080/FFFFFF?text=No+Image';
  };

  const handleNicknameSave = async (newNickname) => {
    if (!user || !profile) return;

    const { data, error } = await updateProfile(user.id, { 
      nickname: newNickname 
    });

    if (error) {
      throw new Error('更新に失敗しました');
    } else {
      setProfile(data);
      Alert.alert('成功', 'ニックネームを更新しました');
    }
  };

  const handleImageUpload = async () => {
    try {
      // カメラロールの権限をリクエスト
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('権限が必要です', 'アルバムへのアクセス権限が必要です');
        return;
      }

      // 画像選択オプション
      Alert.alert(
        'プロフィール画像を変更',
        '画像を選択してください',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: 'アルバムから選択',
            onPress: () => pickImageFromLibrary()
          },
        ]
      );
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('エラー', '画像の選択に失敗しました');
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // 正方形
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('エラー', '画像の選択に失敗しました');
    }
  };

  const uploadProfileImage = async (imageAsset) => {
    if (!user || !profile) return;

    setUploadingImage(true);
    try {
      // ファイル名を生成
      const fileName = `profile-${user.id}-${Date.now()}.jpg`;
      const filePath = `profiles/${fileName}`;

      // FormDataでファイルをアップロード
      const formData = new FormData();
      formData.append('file', {
        uri: imageAsset.uri,
        type: 'image/jpeg',
        name: fileName,
      });

      // Supabase Storageにアップロード（avatarsバケットを使用）
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, formData, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      // 公開URLを取得
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // プロフィールを更新
      const { data, error } = await updateProfile(user.id, {
        profile_image_url: urlData.publicUrl
      });

      if (error) {
        throw new Error('プロフィール更新に失敗しました');
      } else {
        setProfile(data);
        Alert.alert('成功', 'プロフィール画像を更新しました');
      }
    } catch (error) {
      console.error('Upload profile image error:', error);
      Alert.alert('エラー', 'プロフィール画像の更新に失敗しました');
    } finally {
      setUploadingImage(false);
    }
  };

  const getProfileImage = () => {
    if (profile?.profile_image_url) {
      return profile.profile_image_url;
    }
    
    // ロール別デフォルト画像
    const role = profile?.user_role || user?.user_metadata?.user_role || 'viewer';
    switch (role) {
      case 'filmmaker':
        return require('../../assets/kantoku.png');
      case 'actor':
        return require('../../assets/actor.png');
      case 'viewer':
      default:
        return require('../../assets/guest.png');
    }
  };

  const getUserRoleDisplay = () => {
    const role = profile?.user_role || user?.user_metadata?.user_role || 'viewer';
    console.log('Current user role debug:', {
      profileRole: profile?.user_role,
      userMetadataRole: user?.user_metadata?.user_role,
      finalRole: role,
      fullProfile: profile,
      fullUserMetadata: user?.user_metadata
    });
    switch (role) {
      case 'filmmaker':
        return '映像作家';
      case 'actor':
        return '役者';
      case 'viewer':
      default:
        return '視聴者';
    }
  };

  const getUserRoleIcon = () => {
    const role = profile?.user_role || user?.user_metadata?.user_role || 'viewer';
    switch (role) {
      case 'filmmaker':
        return 'videocam';
      case 'actor':
        return 'person-circle';
      case 'viewer':
      default:
        return 'play-circle';
    }
  };

  const handleLogout = () => {
    console.log('Logout button pressed');
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: 'ログアウト', 
          style: 'destructive',
          onPress: async () => {
            console.log('Logging out user...');
            try {
              const { error } = await signOut();
              if (error) {
                console.error('Logout error:', error);
                Alert.alert('エラー', 'ログアウトに失敗しました');
              } else {
                console.log('Logout successful');
              }
            } catch (error) {
              console.error('Logout exception:', error);
              Alert.alert('エラー', 'ログアウトに失敗しました');
            }
          }
        }
      ]
    );
  };

  // 開発用: イントロ動画をリセット
  const resetIntroVideo = async () => {
    Alert.alert(
      '開発用機能',
      'イントロ動画の視聴状態をリセットしますか？\n次回アプリ起動時にイントロ動画が表示されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: 'リセット', 
          style: 'destructive',
          onPress: async () => {
            try {
              await resetIntroStatus();
              Alert.alert('完了', 'イントロ動画の状態をリセットしました！\nアプリを再起動してください。');
            } catch (error) {
              console.error('Reset intro error:', error);
              Alert.alert('エラー', 'リセットに失敗しました');
            }
          }
        }
      ]
    );
  };


  const getImageSource = () => {
    const profileImage = getProfileImage();
    // URLの場合はuriオブジェクトを返す
    if (typeof profileImage === 'string') {
      return { uri: profileImage };
    }
    // require()の場合はそのまま返す
    return profileImage;
  };

  const userProfile = {
    name: profile?.nickname || user?.email?.split('@')[0] || '映画愛好家',
    avatar: getImageSource(),
    followers: 1234,
    following: 567,
    watchTime: '128時間',
    favoriteGenres: ['アクション', 'SF', 'アニメ']
  };


  // 初回読み込み中または認証ローディング中
  if (loading) {
    return <ProfileLoadingScreen />;
  }

  // データ再取得中の読み込み画面
  if (refreshing) {
    return <ProfileLoadingScreen />;
  }

  // 視聴履歴を画面表示用の形式に変換
  const formatViewingHistory = viewingHistory.map(item => ({
    id: item.movie_id,
    title: item.movies?.title || 'Unknown Movie',
    image: getMovieImage(item.movies || {}),
    progress: Math.round(item.progress_percentage || 0),
    videoId: item.movies?.video_id,
    description: item.movies?.description,
    lastWatched: item.last_watched_at
  }));


  const achievements = [
    { id: 1, title: 'シリーズマラソン', description: '一つのシリーズを完走', icon: 'trophy' },
    { id: 2, title: 'ジャンル探検家', description: '5つのジャンルを視聴', icon: 'compass' },
    { id: 3, title: 'コミュニティ活動家', description: '50回の投稿', icon: 'people' },
  ];

  const menuItems = [
    { id: 1, title: 'マイリスト', icon: 'bookmark', onPress: () => {} },
    { id: 2, title: '視聴履歴', icon: 'time', onPress: () => {} },
    { id: 3, title: 'ダウンロード', icon: 'download', onPress: () => {} },
    { id: 4, title: '設定', icon: 'settings', onPress: () => {} },
    { id: 5, title: 'ヘルプ', icon: 'help-circle', onPress: () => {} },
  ];

  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => navigation.navigate('MovieDetail', { movie: item })}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.historyImage}
        onError={(error) => {
          console.log('History image load error for:', item.title, error.nativeEvent.error);
        }}
        onLoad={() => {
          console.log('History image loaded successfully for:', item.title);
        }}
      />
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${item.progress}%` }]} />
      </View>
      <Text style={styles.historyTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderMyListItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => navigation.navigate('MovieDetail', { movie: item })}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.listImage}
        onError={(error) => {
          console.log('My list image load error for:', item.title, error.nativeEvent.error);
        }}
        onLoad={() => {
          console.log('My list image loaded successfully for:', item.title);
        }}
      />
      <Text style={styles.listTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderMyWorkItem = ({ item }) => (
    <TouchableOpacity
      style={styles.workItem}
      onPress={() => navigation.navigate('MovieDetail', { movie: item })}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.workImage}
        onError={(error) => {
          console.log('My work image load error for:', item.title, error.nativeEvent.error);
        }}
        onLoad={() => {
          console.log('My work image loaded successfully for:', item.title);
        }}
      />
      <View style={styles.workInfo}>
        <Text style={styles.workTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.workStatus}>
          <Ionicons name="eye" size={12} color="#fffacd" />
          <Text style={styles.workViews}>{item.views || 0} 回視聴</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderAchievement = ({ item }) => (
    <View style={styles.achievementItem}>
      <View style={styles.achievementIcon}>
        <Ionicons name={item.icon} size={24} color="#000080" />
      </View>
      <View style={styles.achievementInfo}>
        <Text style={styles.achievementTitle}>{item.title}</Text>
        <Text style={styles.achievementDescription}>{item.description}</Text>
      </View>
    </View>
  );

  const renderMenuItem = ({ item }) => (
    <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
      <View style={styles.menuIcon}>
        <Ionicons name={item.icon} size={24} color="#fffacd" />
      </View>
      <Text style={styles.menuText}>{item.title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#8C8C8C" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#000080', '#000066', '#00004d', '#000033']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandText}>GINEQUE</Text>
          </View>
        <TouchableOpacity onPress={handleImageUpload} style={styles.avatarContainer}>
          <Image 
            source={userProfile.avatar} 
            style={styles.avatar}
          />
          {uploadingImage ? (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="small" color="#fffacd" />
            </View>
          ) : (
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={20} color="#000080" />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.nameContainer}>
          <Text style={styles.userName}>{userProfile.name}</Text>
          <TouchableOpacity 
            style={styles.editNicknameButton}
            onPress={() => setShowNicknameModal(true)}
          >
            <Ionicons name="pencil" size={16} color="#fffacd" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.userRoleContainer}>
          <Ionicons name={getUserRoleIcon()} size={16} color="#CCCCCC" />
          <Text style={styles.userRoleText}>{getUserRoleDisplay()}</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userProfile.followers}</Text>
            <Text style={styles.statLabel}>フォロワー</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userProfile.following}</Text>
            <Text style={styles.statLabel}>フォロー中</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userProfile.watchTime}</Text>
            <Text style={styles.statLabel}>視聴時間</Text>
          </View>
        </View>

        <View style={styles.genresContainer}>
          <Text style={styles.genresTitle}>好きなジャンル</Text>
          <View style={styles.genresList}>
            {userProfile.favoriteGenres.map((genre, index) => (
              <View key={index} style={styles.genreTag}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>プロフィールを編集</Text>
        </TouchableOpacity>

        {/* 映像作家専用: 作品エントリーボタン */}
        {(profile?.user_role === 'filmmaker' || user?.user_metadata?.user_role === 'filmmaker') && (
          <TouchableOpacity 
            style={styles.entryButton}
            onPress={() => navigation.navigate('MovieEntry')}
          >
            <View style={styles.entryButtonContent}>
              <Image 
                source={require('../../assets/kantoku.png')} 
                style={styles.entryButtonIcon}
                resizeMode="contain"
              />
              <Text style={styles.entryButtonText}>作品をエントリーする</Text>
              <Text style={styles.entryButtonSubtext}>映像作家専用機能</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* My Works - 映像作家専用 */}
      {(profile?.user_role === 'filmmaker' || user?.user_metadata?.user_role === 'filmmaker') && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>自分の作品</Text>
            <Ionicons name="videocam" size={20} color="#fffacd" />
          </View>
          {myWorks.length > 0 ? (
            <FlatList
              data={myWorks}
              renderItem={renderMyWorkItem}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Image 
                source={require('../../assets/kantoku.png')} 
                style={styles.emptyIcon}
                resizeMode="contain"
              />
              <Text style={styles.emptyText}>
                作品をエントリーして、世界中で上映しましょう
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Continue Watching */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>視聴履歴</Text>
          {loadingHistory && <ActivityIndicator size="small" color="#fffacd" />}
        </View>
        {formatViewingHistory.length > 0 ? (
          <FlatList
            data={formatViewingHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loadingHistory ? '読み込み中...' : '視聴履歴がありません'}
            </Text>
          </View>
        )}
      </View>

        {/* My List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>マイリスト</Text>
            {loadingMyList && <ActivityIndicator size="small" color="#fffacd" />}
          </View>
          {myList.length > 0 ? (
            <FlatList
              data={myList}
              renderItem={renderMyListItem}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {loadingMyList ? '読み込み中...' : 'マイリストがありません'}
              </Text>
            </View>
          )}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アチーブメント</Text>
          {achievements.map((item) => (
            <View key={item.id}>
              {renderAchievement({ item })}
            </View>
          ))}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>設定</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingText}>通知</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#333333', true: '#4ECDC4' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingText}>自動再生</Text>
            <Switch
              value={autoPlayEnabled}
              onValueChange={setAutoPlayEnabled}
              trackColor={{ false: '#333333', true: '#4ECDC4' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          {menuItems.map((item) => (
            <View key={item.id}>
              {renderMenuItem({ item })}
            </View>
          ))}
        </View>


        {/* Development Button - 開発用リセット */}
        {__DEV__ && (
          <TouchableOpacity style={styles.devButton} onPress={resetIntroVideo}>
            <Text style={styles.devButtonText}>開発用リセット</Text>
          </TouchableOpacity>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>ログアウト</Text>
        </TouchableOpacity>

        {/* Nickname Edit Modal */}
        <NicknameEditModal
          visible={showNicknameModal}
          currentNickname={profile?.nickname || ''}
          onClose={() => setShowNicknameModal(false)}
          onSave={handleNicknameSave}
        />

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#000080', // 一瞬の白画面を防ぐため
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 100, // ログアウトボタン用の余白
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 40,
  },
  brandLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  brandText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fffacd',
    letterSpacing: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#001a4d',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fffacd',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000080',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    color: '#fffacd',
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 10,
  },
  editNicknameButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 250, 205, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.2)',
  },
  userRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 250, 205, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.15)',
  },
  userRoleText: {
    color: '#CCCCCC',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#fffacd',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#8C8C8C',
    fontSize: 14,
    marginTop: 5,
  },
  genresContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  genresTitle: {
    color: '#fffacd',
    fontSize: 16,
    marginBottom: 10,
  },
  genresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  genreTag: {
    backgroundColor: '#fffacd',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    margin: 5,
  },
  genreText: {
    color: '#000080',
    fontSize: 12,
  },
  editButton: {
    backgroundColor: '#fffacd',
    borderRadius: 12,
    paddingHorizontal: 30,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  editButtonText: {
    color: '#000080',
    fontSize: 16,
    fontWeight: 'bold',
  },
  entryButton: {
    backgroundColor: 'rgba(255, 250, 205, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 30,
    paddingVertical: 15,
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#fffacd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  entryButtonContent: {
    alignItems: 'center',
    gap: 5,
  },
  entryButtonText: {
    color: '#fffacd',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  entryButtonSubtext: {
    color: '#fffacd',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
    fontStyle: 'italic',
  },
  entryButtonIcon: {
    width: 24,
    height: 24,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    marginBottom: 10,
  },
  section: {
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#fffacd',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    color: '#8C8C8C',
    fontSize: 16,
  },
  horizontalList: {
    paddingRight: 20,
  },
  historyItem: {
    marginRight: 15,
    width: 120,
  },
  historyImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 250, 205, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.2)',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#001a4d',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fffacd',
    borderRadius: 2,
  },
  historyTitle: {
    color: '#fffacd',
    fontSize: 14,
    textAlign: 'center',
  },
  listItem: {
    marginRight: 15,
    width: 120,
  },
  listImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 250, 205, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.2)',
  },
  listTitle: {
    color: '#fffacd',
    fontSize: 14,
    textAlign: 'center',
  },
  workItem: {
    marginRight: 15,
    width: 140,
  },
  workImage: {
    width: 140,
    height: 210,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 250, 205, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.2)',
  },
  workInfo: {
    flex: 1,
  },
  workTitle: {
    color: '#fffacd',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  workStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  workViews: {
    color: '#fffacd',
    fontSize: 12,
    opacity: 0.8,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#001a4d',
    borderRadius: 10,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fffacd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    color: '#fffacd',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  achievementDescription: {
    color: '#8C8C8C',
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#001a4d',
  },
  settingText: {
    color: '#fffacd',
    fontSize: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#001a4d',
  },
  menuIcon: {
    width: 30,
    marginRight: 15,
  },
  menuText: {
    color: '#fffacd',
    fontSize: 16,
    flex: 1,
  },
  devButton: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    marginHorizontal: 20,
    marginVertical: 5,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    opacity: 0.6,
  },
  devButtonText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: 'normal',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 250, 205, 0.1)',
    marginHorizontal: 20,
    marginVertical: 30,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.3)',
  },
  logoutText: {
    color: '#fffacd',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fffacd',
    fontSize: 16,
    marginTop: 10,
  },
});

export default ProfileScreen;