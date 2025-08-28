import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getImageUrl } from '../config/cloudflareImages';
import { getMoviesByCategory } from '../services/movieService';
import { getContinueWatchingMovies } from '../services/viewingHistoryService';
import { useDataUpdate } from '../contexts/DataUpdateContext';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { clearUpdateFlags } = useDataUpdate();
  const [movies, setMovies] = useState({});
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [continueWatching, setContinueWatching] = useState([]);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchMoviesFromDB();
    fetchContinueWatchingMovies();
    startFeaturedImageAnimation();
  }, []);

  const startFeaturedImageAnimation = () => {
    // フェードインアニメーション
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // 拡大縮小アニメーション
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    // 左右のゆれアニメーション
    const swayAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateXAnim, {
          toValue: -8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(translateXAnim, {
          toValue: 8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(translateXAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    breathingAnimation.start();
    swayAnimation.start();
  };

  // 画面にフォーカスした時にデータを再取得
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMoviesFromDB();
      fetchContinueWatchingMovies();
      clearUpdateFlags(); // HomeScreenでもデータ更新時にフラグをクリア
    });
    return unsubscribe;
  }, [navigation]);

  const fetchMoviesFromDB = async () => {
    try {
      const movieData = await getMoviesByCategory();
      console.log('Fetched movies from DB:', movieData);
      
      // フィーチャー映画を設定
      const featuredMovies = movieData['フィーチャー'] || [];
      if (featuredMovies.length > 0) {
        setFeaturedMovie(featuredMovies[0]);
      }
      
      // カテゴリ別映画を設定
      setMovies(movieData);
    } catch (error) {
      console.error('Failed to fetch movies:', error);
      // フォールバック用のダミーデータ
      setFeaturedMovie({
        title: 'マイクを止めるな',
        description: '低予算で制作されたゾンビ映画の撮影現場で巻き起こる予期せぬ出来事',
        image_id: '3b91e694-0008-4ec9-c7e2-2d749f6b4b00'
      });
    }
  };

  const fetchContinueWatchingMovies = async () => {
    try {
      const continueWatchingData = await getContinueWatchingMovies();
      console.log('Continue watching movies:', continueWatchingData);
      
      // 視聴履歴データを画面表示用の形式に変換
      const formattedContinueWatching = continueWatchingData.map(item => {
        const progress = Math.round(item.progress_percentage || 0);
        console.log('Continue watching item:', {
          title: item.movies?.title,
          progress_percentage: item.progress_percentage,
          calculated_progress: progress
        });
        
        return {
          id: item.movie_id,
          title: item.movies?.title || 'Unknown Movie',
          image: getMovieImage(item.movies || {}),
          videoId: item.movies?.video_id,
          description: item.movies?.description,
          progress: progress
        };
      });
      
      setContinueWatching(formattedContinueWatching);
    } catch (error) {
      console.error('Failed to fetch continue watching movies:', error);
    }
  };

  const getMovieImage = (movie) => {
    if (movie.image_id) {
      return getImageUrl(movie.image_id, 'public') || `https://imagedelivery.net/a7T4jvSHK-io9LvvC0LMeQ/${movie.image_id}/public`;
    }
    return 'https://via.placeholder.com/200x300/333333/FFFFFF?text=' + encodeURIComponent(movie.title);
  };

  // DBから取得したデータを画面表示用の形式に変換
  const movieCategories = Object.keys(movies).map(categoryName => ({
    title: categoryName,
    movies: movies[categoryName].map(movie => ({
      id: movie.id,
      title: movie.title,
      image: getMovieImage(movie),
      videoId: movie.video_id,
      description: movie.description
    }))
  }));

  const renderMovieItem = ({ item }) => (
    <TouchableOpacity
      style={styles.movieItem}
      onPress={() => navigation.navigate('MovieDetail', { movie: item })}
    >
      <Image source={{ uri: item.image }} style={styles.movieImage} />
      <Text style={styles.movieTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderContinueWatchingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.continueWatchingItem}
      onPress={() => navigation.navigate('MovieDetail', { movie: item })}
    >
      <Image source={{ uri: item.image }} style={styles.continueWatchingImage} />
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${item.progress}%` }]} />
      </View>
      <Text style={styles.continueWatchingTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }) => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{item.title}</Text>
      <FlatList
        data={item.movies}
        renderItem={renderMovieItem}
        keyExtractor={(movie) => movie.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moviesList}
      />
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#000080', '#000066', '#00004d', '#000033']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* App Logo Header */}
      <View style={styles.logoHeader}>
        <Image 
          source={require('../../assets/icon.png')} 
          style={styles.appLogo}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>GINEQUE</Text>
      </View>

      {/* Featured Content */}
      {featuredMovie && (
        <View style={styles.featuredContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MovieDetail', { 
              movie: {
                ...featuredMovie,
                image: getMovieImage(featuredMovie),
                videoId: featuredMovie.video_id
              }
            })}
            activeOpacity={0.8}
          >
            <Animated.Image 
              source={{ uri: getMovieImage(featuredMovie) }} 
              style={[
                styles.featuredImage,
                {
                  transform: [
                    { scale: scaleAnim },
                    { translateX: translateXAnim }
                  ],
                  opacity: opacityAnim,
                }
              ]}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <View style={styles.featuredContent}>
            <Text style={styles.featuredDescription} numberOfLines={3}>
              {featuredMovie.description || 'No description available'}
            </Text>
            <View style={styles.featuredButtonsCenter}>
              <TouchableOpacity 
                style={styles.playButtonCenter}
                onPress={() => navigation.navigate('MovieDetail', { 
                  movie: {
                    ...featuredMovie,
                    image: getMovieImage(featuredMovie),
                    videoId: featuredMovie.video_id
                  }
                })}
              >
                <Text style={styles.playButtonText}>▶ 詳細を見る</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Continue Watching */}
      {continueWatching.length > 0 && (
        <View style={styles.continueWatchingSection}>
          <Text style={styles.sectionTitle}>視聴を続ける</Text>
          <FlatList
            data={continueWatching}
            renderItem={renderContinueWatchingItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.continueWatchingList}
          />
        </View>
      )}

      {/* Categories */}
      <FlatList
        data={movieCategories}
        renderItem={renderCategory}
        keyExtractor={(category) => category.title}
        scrollEnabled={false}
        style={styles.categoriesContainer}
      />

    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
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
  logoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  appLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fffacd',
    letterSpacing: 2,
  },
  featuredContainer: {
    marginBottom: 15,
  },
  featuredImage: {
    width: '80%',
    aspectRatio: 140 / 190,
    alignSelf: 'center',
    marginTop: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featuredContent: {
    padding: 20,
  },
  featuredDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 20,
    lineHeight: 22,
  },
  featuredButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  featuredButtonsCenter: {
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#fffacd',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#fff8dc',
  },
  playButtonCenter: {
    backgroundColor: '#fffacd',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#fff8dc',
  },
  playButtonText: {
    color: '#000080',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#fffacd',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  categoriesContainer: {
    marginTop: 20,
  },
  categoryContainer: {
    marginBottom: 30,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fffacd',
    marginLeft: 20,
    marginBottom: 15,
  },
  moviesList: {
    paddingHorizontal: 20,
  },
  movieItem: {
    marginRight: 15,
    width: 140,
  },
  movieImage: {
    width: 140,
    height: 190,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  movieTitle: {
    color: '#fffacd',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  continueWatchingSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fffacd',
    marginLeft: 20,
    marginBottom: 15,
  },
  continueWatchingList: {
    paddingHorizontal: 20,
  },
  continueWatchingItem: {
    marginRight: 15,
    width: 140,
  },
  continueWatchingImage: {
    width: 140,
    height: 190,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  continueWatchingTitle: {
    color: '#fffacd',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 4,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 250, 205, 0.2)',
    borderRadius: 2,
    marginTop: 8,
    marginHorizontal: 5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fffacd',
    borderRadius: 2,
  },
  progressText: {
    color: '#CCCCCC',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default HomeScreen;