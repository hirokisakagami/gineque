import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useAuth } from '../contexts/AuthContext'

const { width } = Dimensions.get('window')

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const characterAnim = useRef(new Animated.Value(0)).current
  
  useEffect(() => {
    // アニメーション開始
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(characterAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleLogin = async () => {
    console.log('Login button pressed')
    
    // タプティックフィードバック
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      console.log('Haptic feedback triggered')
    } catch (error) {
      console.log('Haptic feedback error:', error)
    }

    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await signIn(email, password)

      if (error) {
        Alert.alert('エラー', error.message)
      } else {
        // ログイン成功時のドクドク触覚フィードバック
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          setTimeout(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          }, 100)
          console.log('Login success haptic feedback triggered')
        } catch (hapticError) {
          console.log('Login success haptic error:', hapticError)
        }
      }
    } catch (error) {
      Alert.alert('エラー', '予期しないエラーが発生しました')
    }
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000080', '#000066', '#00004d', '#000033']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.appIcon}
              resizeMode="contain"
              onError={(error) => console.log('Icon load error:', error)}
              onLoad={() => console.log('Icon loaded successfully')}
            />
            <Text style={styles.title}>GINEQUE</Text>
          </View>
          <Text style={styles.subtitle}>
            ログイン
          </Text>
        </Animated.View>

        <Animated.View 
          style={[
            styles.form,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* 指差しキャラクター - メールフィールドの上 */}
          <Animated.View 
            style={[
              styles.characterContainer,
              {
                opacity: characterAnim,
              }
            ]}
          >
            <Image 
              source={require('../../assets/yubisasi.png')} 
              style={styles.characterImage}
              resizeMode="contain"
            />
          </Animated.View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color="#fffacd" />
            <TextInput
              style={styles.input}
              placeholder="メールアドレス"
              placeholderTextColor="#B0B0B0"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              spellCheck={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#fffacd" />
            <TextInput
              style={styles.input}
              placeholder="パスワード"
              placeholderTextColor="#B0B0B0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              spellCheck={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.authButton, loading && styles.authButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000080" />
            ) : (
              <Text style={styles.authButtonText}>
                ログイン
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.switchButtonText}>
              アカウントをお持ちでない方はこちら
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  appIcon: {
    width: 36,
    height: 36,
    marginRight: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fffacd',
    letterSpacing: 2,
    textShadowColor: '#000080',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#fffacd',
    opacity: 0.8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 250, 205, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.2)',
  },
  input: {
    flex: 1,
    color: '#fffacd',
    fontSize: 16,
    marginLeft: 10,
  },
  authButton: {
    backgroundColor: '#fffacd',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  authButtonDisabled: {
    opacity: 0.7,
  },
  authButtonText: {
    color: '#000080',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 30,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#fffacd',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  characterContainer: {
    position: 'absolute',
    top: -88,
    right: 0,
    zIndex: 10,
  },
  characterImage: {
    width: width * 0.2,
    height: width * 0.2,
    maxWidth: 80,
    maxHeight: 80,
  },
})

export default LoginScreen