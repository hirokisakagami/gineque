import React, { useState } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'

const NicknameEditModal = ({ 
  visible, 
  currentNickname, 
  onClose, 
  onSave 
}) => {
  const [nickname, setNickname] = useState(currentNickname || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    // 触覚フィードバック
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch (error) {
      console.log('Nickname save haptic error:', error)
    }

    if (!nickname.trim()) {
      Alert.alert('エラー', 'ニックネームを入力してください')
      return
    }

    if (nickname.length > 20) {
      Alert.alert('エラー', 'ニックネームは20文字以内で入力してください')
      return
    }

    setLoading(true)
    try {
      await onSave(nickname.trim())
      onClose()
    } catch (error) {
      Alert.alert('エラー', 'ニックネームの更新に失敗しました')
    }
    setLoading(false)
  }

  const handleClose = () => {
    setNickname(currentNickname || '')
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>ニックネーム編集</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fffacd" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.label}>新しいニックネーム</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="ニックネームを入力"
              placeholderTextColor="#B0B0B0"
              maxLength={20}
              autoFocus={true}
            />
            <Text style={styles.counter}>{nickname.length}/20</Text>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000080" />
              ) : (
                <Text style={styles.saveButtonText}>保存</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  modalContainer: {
    backgroundColor: '#000080',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#001a4d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#001a4d',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fffacd',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    color: '#fffacd',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#001a4d',
    borderRadius: 8,
    padding: 15,
    color: '#fffacd',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.2)',
  },
  counter: {
    textAlign: 'right',
    color: '#B0B0B0',
    fontSize: 12,
    marginTop: 5,
  },
  buttons: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 250, 205, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.3)',
  },
  cancelButtonText: {
    color: '#fffacd',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#fffacd',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#000080',
    fontSize: 16,
    fontWeight: 'bold',
  },
})

export default NicknameEditModal