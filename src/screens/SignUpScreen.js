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
  ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useAuth } from '../contexts/AuthContext'

const { width } = Dimensions.get('window')

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [userType, setUserType] = useState(null) // null, 'viewer', 'filmmaker', 'actor'
  const [step, setStep] = useState(1) // 1: type selection, 2: form
  const { signUp } = useAuth()
  
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

  // userType変更を監視
  useEffect(() => {
    console.log('userType changed to:', userType)
  }, [userType])

  const handleUserTypeSelect = async (type) => {
    // タプティックフィードバック
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    console.log('User type selected:', type)
    setUserType(type)
    setStep(2)
    console.log('After setUserType, current userType should be:', type)
    
    // アニメーションをリセットして次のステップを表示
    fadeAnim.setValue(0)
    slideAnim.setValue(30)
    characterAnim.setValue(0)
    
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(characterAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const handleGoBack = () => {
    setStep(1)
    setUserType(null)
    // 入力フィールドもクリア
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    
    // アニメーションをリセット
    fadeAnim.setValue(0)
    slideAnim.setValue(30)
    characterAnim.setValue(0)
    
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }

  const handleSignUp = async () => {
    // タプティックフィードバック
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    if (!userType) {
      Alert.alert('エラー', 'ユーザータイプが選択されていません')
      return
    }

    if (!email || !password || !confirmPassword) {
      Alert.alert('エラー', 'すべてのフィールドを入力してください')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません')
      return
    }

    if (password.length < 6) {
      Alert.alert('エラー', 'パスワードは6文字以上にしてください')
      return
    }

    setLoading(true)
    try {
      console.log('=== SIGNUP DEBUG ===')
      console.log('Current userType state:', userType)
      console.log('Current step:', step)
      console.log('Calling signUp with userType:', userType)
      console.log('==================')
      const { data, error } = await signUp(email, password, userType)

      if (error) {
        Alert.alert('エラー', error.message)
      } else {
        // セッションが存在する場合は自動ログイン成功
        if (data?.session) {
          Alert.alert(
            '成功', 
            'アカウントが作成されました！',
            [
              {
                text: 'OK',
                onPress: () => {
                  // 状態をリセット
                  setStep(1)
                  setUserType(null)
                  setEmail('')
                  setPassword('')
                  setConfirmPassword('')
                  
                  // ナビゲーションスタックをリセットして自動的にメイン画面へ
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                  })
                }
              }
            ]
          )
        } else {
          // 確認メールが必要な場合
          Alert.alert(
            '成功', 
            '確認メールを送信しました。メールをチェックして、リンクをクリックしてアカウントを有効化してください。',
            [
              {
                text: 'OK',
                onPress: () => {
                  // 状態をリセット
                  setStep(1)
                  setUserType(null)
                  setEmail('')
                  setPassword('')
                  setConfirmPassword('')
                  
                  navigation.navigate('Login')
                }
              }
            ]
          )
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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
              />
              <Text style={styles.title}>GINEQUE</Text>
            </View>
            <Text style={styles.subtitle}>
              {step === 1 ? 'あなたは誰ですか？' : 'アカウントを作成'}
            </Text>
            <Text style={styles.description}>
              {step === 1 ? '最適な体験をご提供します' : '映画の新しい世界へようこそ'}
            </Text>
          </Animated.View>

          {step === 1 ? (
            // ステップ1: ユーザータイプ選択
            <Animated.View 
              style={[
                styles.form,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <View style={styles.userTypeContainer}>
                <TouchableOpacity
                  style={styles.userTypeCard}
                  onPress={() => handleUserTypeSelect('viewer')}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardContent}>
                    <Image 
                      source={require('../../assets/guest.png')} 
                      style={styles.typeImage}
                      resizeMode="contain"
                    />
                    <View style={styles.cardText}>
                      <Text style={styles.typeTitle}>視聴者</Text>
                      <Text style={styles.typeSubtitle}>映画を楽しみたい</Text>
                      <Text style={styles.typeDescription}>様々な映画作品を視聴し、{'\n'}新しい体験を求めている方</Text>
                    </View>
                    <View style={[styles.colorAccent, { backgroundColor: '#4ECDC4' }]} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.userTypeCard}
                  onPress={() => handleUserTypeSelect('filmmaker')}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardContent}>
                    <Image 
                      source={require('../../assets/kantoku.png')} 
                      style={styles.typeImage}
                      resizeMode="contain"
                    />
                    <View style={styles.cardText}>
                      <Text style={styles.typeTitle}>映像作家</Text>
                      <Text style={styles.typeSubtitle}>作品を発表したい</Text>
                      <Text style={styles.typeDescription}>自分の映像作品を{'\n'}世界中で上映したい方</Text>
                    </View>
                    <View style={[styles.colorAccent, { backgroundColor: '#FF6B6B' }]} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.userTypeCard}
                  onPress={() => handleUserTypeSelect('actor')}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardContent}>
                    <Image 
                      source={require('../../assets/actor.png')} 
                      style={styles.typeImage}
                      resizeMode="contain"
                    />
                    <View style={styles.cardText}>
                      <Text style={styles.typeTitle}>役者</Text>
                      <Text style={styles.typeSubtitle}>演技を披露したい</Text>
                      <Text style={styles.typeDescription}>自分の演技力を{'\n'}アピールしたい方</Text>
                    </View>
                    <View style={[styles.colorAccent, { backgroundColor: '#FFD93D' }]} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* 説明テキスト */}
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                  後で変更することもできます
                </Text>
              </View>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginButtonText}>
                  すでにアカウントをお持ちですか？ ログイン
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            // ステップ2: アカウント作成フォーム
            <Animated.View 
              style={[
                styles.form,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              {/* 戻るボタン */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleGoBack}
              >
                <Ionicons name="arrow-back" size={20} color="#fffacd" />
                <Text style={styles.backButtonText}>戻る</Text>
              </TouchableOpacity>

              {/* 選択されたユーザータイプ表示 */}
              <View style={styles.selectedTypeContainer}>
                <Text style={styles.selectedTypeLabel}>選択されたタイプ:</Text>
                <Text style={styles.selectedTypeText}>
                  {userType === 'viewer' ? '視聴者' : userType === 'filmmaker' ? '映像作家' : userType === 'actor' ? '役者' : 'unknown'}
                </Text>
              </View>

              <View style={styles.japaneseFormContainer}>
              <Animated.View 
                style={[
                  styles.characterContainer,
                  {
                    opacity: characterAnim,
                  }
                ]}
              >
                <Image 
                  source={
                    userType === 'filmmaker' 
                      ? require('../../assets/kantoku.png')
                      : userType === 'actor'
                        ? require('../../assets/actor.png')
                        : require('../../assets/guest.png')
                  }
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
                  autoComplete="off"
                  textContentType="none"
                  spellCheck={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color="#fffacd" />
                <TextInput
                  style={styles.input}
                  placeholder="パスワード（6文字以上）"
                  placeholderTextColor="#B0B0B0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color="#fffacd" />
                <TextInput
                  style={styles.input}
                  placeholder="パスワード（確認）"
                  placeholderTextColor="#B0B0B0"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000080" />
                ) : (
                  <Text style={styles.signUpButtonText}>
                    アカウント作成
                  </Text>
                )}
              </TouchableOpacity>
              
              </View>
            </Animated.View>
          )}
        </ScrollView>

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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
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
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    opacity: 0.7,
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
  signUpButton: {
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
    borderWidth: 2,
    borderColor: '#fff8dc',
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    color: '#000080',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButton: {
    marginTop: 30,
    alignItems: 'center',
  },
  loginButtonText: {
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
  // ユーザータイプ選択
  userTypeContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  userTypeCard: {
    backgroundColor: 'rgba(255, 250, 205, 0.08)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 250, 205, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
    marginBottom: 15,
    width: '100%',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  typeImage: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fffacd',
    marginBottom: 4,
  },
  typeSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
    fontWeight: '500',
  },
  typeDescription: {
    fontSize: 13,
    color: '#999999',
    lineHeight: 18,
  },
  colorAccent: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // ステップ2のスタイル
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#fffacd',
    fontSize: 14,
    marginLeft: 8,
  },
  selectedTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 250, 205, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 205, 0.15)',
  },
  selectedTypeLabel: {
    color: '#CCCCCC',
    fontSize: 14,
    marginRight: 8,
  },
  selectedTypeText: {
    color: '#fffacd',
    fontSize: 16,
    fontWeight: 'bold',
  },
  japaneseFormContainer: {
    // 日本語環境用のフォームコンテナ
    // React Nativeでは直接的なHTML属性は使えないが、
    // ネイティブレベルでの自動入力制御のために設定
  },
})

export default SignUpScreen