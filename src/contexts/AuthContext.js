import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../config/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [minimumLoadingTime, setMinimumLoadingTime] = useState(true)
  const [hasSeenIntro, setHasSeenIntro] = useState(false)

  useEffect(() => {
    // イントロ視聴状態をチェック
    const checkIntroStatus = async () => {
      try {
        const introSeen = await AsyncStorage.getItem('hasSeenIntro')
        setHasSeenIntro(introSeen === 'true')
      } catch (error) {
        console.error('Error checking intro status:', error)
        setHasSeenIntro(false)
      }
    }
    
    checkIntroStatus()

    // 最低1.5秒のローディング時間を保証
    const minimumTimer = setTimeout(() => {
      setMinimumLoadingTime(false)
    }, 1500)

    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // セッション変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
      clearTimeout(minimumTimer)
    }
  }, [])

  const signUp = async (email, password, userType = 'viewer') => {
    console.log('SignUp called with userType:', userType)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
        data: {
          user_role: userType,
        }
      }
    })
    
    console.log('SignUp result:', { 
      userData: data?.user?.user_metadata, 
      userType: userType,
      error: error?.message 
    })
    
    // サインアップ成功時に自動ログインを試行
    if (data?.user && !error) {
      // セッション情報を更新
      setSession(data.session)
      setUser(data.user)
    }
    
    return { data, error }
  }

  const signIn = async (email, password) => {
    // ログイン時に再度ローディング状態にする
    setLoading(true)
    setMinimumLoadingTime(true)
    
    // 最低1.5秒のローディング時間を保証
    setTimeout(() => {
      setMinimumLoadingTime(false)
    }, 1500)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    // ログアウト時に再度ローディング状態にする
    setLoading(true)
    setMinimumLoadingTime(true)
    
    // 最低1.5秒のローディング時間を保証
    setTimeout(() => {
      setMinimumLoadingTime(false)
    }, 1500)
    
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const markIntroAsSeen = async () => {
    try {
      await AsyncStorage.setItem('hasSeenIntro', 'true')
      setHasSeenIntro(true)
    } catch (error) {
      console.error('Error marking intro as seen:', error)
    }
  }

  const resetIntroStatus = async () => {
    try {
      await AsyncStorage.removeItem('hasSeenIntro')
      setHasSeenIntro(false)
    } catch (error) {
      console.error('Error resetting intro status:', error)
    }
  }

  // 実際のローディングと最低時間の両方が完了するまでローディング状態を維持
  const isLoading = loading || minimumLoadingTime

  const value = {
    user,
    session,
    loading: isLoading,
    hasSeenIntro,
    signUp,
    signIn,
    signOut,
    markIntroAsSeen,
    resetIntroStatus,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}