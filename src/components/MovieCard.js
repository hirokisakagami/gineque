import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MovieCard = ({ movie, onPress, showAddButton = false, onAddPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: movie.image }} style={styles.image} />
        {showAddButton && (
          <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {movie.title}
      </Text>
      {movie.genre && (
        <Text style={styles.genre}>{movie.genre}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 15,
    width: 140,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 140,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#696969',
  },
  addButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  genre: {
    color: '#8C8C8C',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default MovieCard;