import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { uploadImage, getImageUrl } from '../config/cloudflareImages';

const ImagePicker = ({ 
  onImageUploaded, 
  currentImageId, 
  title = "画像を選択",
  variant = "medium"
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const pickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: false,
      });

      if (!result.cancelled && result.assets && result.assets[0]) {
        const imageFile = result.assets[0];
        setSelectedImage(imageFile);
        
        // 自動アップロード
        await uploadImageFile(imageFile);
      }
    } catch (error) {
      Alert.alert('エラー', 'ファイルの選択に失敗しました');
    }
  };

  const uploadImageFile = async (imageFile) => {
    setUploading(true);
    try {
      const result = await uploadImage(imageFile, {
        title: title
      });
      
      if (result.success && result.result) {
        const imageId = result.result.id;
        Alert.alert('成功', '画像のアップロードが完了しました');
        onImageUploaded(imageId);
      } else {
        throw new Error('アップロードに失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', error.message || '画像のアップロードに失敗しました');
    }
    setUploading(false);
  };

  const currentImageUrl = currentImageId ? getImageUrl(currentImageId, variant) : null;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.pickButton} 
        onPress={pickImage}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#000080" />
        ) : (
          <>
            <Ionicons name="image" size={24} color="#000080" />
            <Text style={styles.pickButtonText}>{title}</Text>
          </>
        )}
      </TouchableOpacity>

      {currentImageUrl && (
        <View style={styles.preview}>
          <Image 
            source={{ uri: currentImageUrl }} 
            style={styles.previewImage}
            resizeMode="cover"
          />
          <Text style={styles.previewText}>現在の画像</Text>
        </View>
      )}

      {selectedImage && !uploading && (
        <View style={styles.preview}>
          <Image 
            source={{ uri: selectedImage.uri }} 
            style={styles.previewImage}
            resizeMode="cover"
          />
          <Text style={styles.previewText}>選択した画像</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  pickButton: {
    backgroundColor: '#fffacd',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  pickButtonText: {
    color: '#000080',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  preview: {
    alignItems: 'center',
    marginBottom: 10,
  },
  previewImage: {
    width: 120,
    height: 160,
    borderRadius: 8,
    backgroundColor: '#001a4d',
  },
  previewText: {
    color: '#fffacd',
    fontSize: 12,
    marginTop: 5,
  },
});

export default ImagePicker;