import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { searchMovies } from '../services/movieService';
import { getImageUrl } from '../config/cloudflareImages';

const { width } = Dimensions.get('window');

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);


  const genres = [
    'アクション',
    'コメディ',
    'ドラマ',
    'ホラー',
    'SF',
    'アニメ',
    'ドキュメンタリー',
    'ロマンス',
  ];

  const handleSearch = async () => {
    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
      try {
        const results = await searchMovies(searchQuery);
        // データベースの映画データを画面表示用の形式に変換
        const formattedResults = results.map(movie => ({
          id: movie.id,
          title: movie.title,
          genre: movie.category || 'その他',
          image: getMovieImage(movie),
          videoId: movie.video_id,
          description: movie.description
        }));
        setSearchResults(formattedResults);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleTextChange = (text) => {
    setSearchQuery(text);
    if (text.trim().length === 0) {
      setSearchResults([]);
    }
  };

  const getMovieImage = (movie) => {
    if (movie.image_id) {
      return getImageUrl(movie.image_id, 'public') || `https://imagedelivery.net/a7T4jvSHK-io9LvvC0LMeQ/${movie.image_id}/public`;
    }
    return 'https://via.placeholder.com/200x300/333333/FFFFFF?text=' + encodeURIComponent(movie.title);
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => navigation.navigate('MovieDetail', { movie: item })}
    >
      <Image source={{ uri: item.image }} style={styles.resultImage} />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>{item.title}</Text>
        <Text style={styles.resultGenre}>{item.genre}</Text>
      </View>
    </TouchableOpacity>
  );


  const renderGenre = ({ item }) => (
    <TouchableOpacity
      style={styles.genreButton}
      onPress={async () => {
        setSearchQuery(item);
        // ジャンルボタンをタップした場合は即座に検索実行
        setIsSearching(true);
        try {
          const results = await searchMovies(item);
          const formattedResults = results.map(movie => ({
            id: movie.id,
            title: movie.title,
            genre: movie.category || 'その他',
            image: getMovieImage(movie),
            videoId: movie.video_id,
            description: movie.description
          }));
          setSearchResults(formattedResults);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }}
    >
      <Text style={styles.genreText}>{item}</Text>
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
      <View style={styles.container}>
      {/* Header with Logo */}
      <View style={styles.searchHeader}>
        <Image 
          source={require('../../assets/icon.png')} 
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>検索</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <TouchableOpacity onPress={handleSearch} style={styles.searchIconButton}>
            <Ionicons name="search" size={20} color="#8C8C8C" />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="映画、TV番組、俳優を検索"
            placeholderTextColor="#8C8C8C"
            value={searchQuery}
            onChangeText={handleTextChange}
            onSubmitEditing={handleSearch}
            autoFocus={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}>
              <Ionicons name="close" size={20} color="#8C8C8C" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isSearching ? (
        /* Searching */
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>検索中...</Text>
        </View>
      ) : searchResults.length > 0 ? (
        /* Search Results */
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id.toString()}
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      ) : searchQuery.length > 0 ? (
        /* No Results */
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>「{searchQuery}」に一致する結果が見つかりませんでした</Text>
        </View>
      ) : (
        /* Default Content */
        <View style={styles.defaultContent}>
          {/* Genres */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ジャンル</Text>
            <FlatList
              data={genres}
              renderItem={renderGenre}
              keyExtractor={(item) => item}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.genreRow}
            />
          </View>

        </View>
      )}
      </View>
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
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fffacd',
    letterSpacing: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#001a4d',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#000040',
  },
  searchIconButton: {
    marginRight: 10,
    padding: 2,
  },
  searchInput: {
    flex: 1,
    color: '#fffacd',
    fontSize: 16,
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultItem: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  resultImage: {
    width: 60,
    height: 90,
    borderRadius: 6,
    marginRight: 15,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    color: '#fffacd',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultGenre: {
    color: '#8C8C8C',
    fontSize: 14,
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noResultsText: {
    color: '#fffacd',
    fontSize: 16,
    textAlign: 'center',
  },
  defaultContent: {
    flex: 1,
    paddingHorizontal: 20,
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
  genreRow: {
    justifyContent: 'space-between',
  },
  genreButton: {
    backgroundColor: '#fffacd',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    width: (width - 60) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  genreText: {
    color: '#000080',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SearchScreen;