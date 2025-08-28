import { supabase } from '../config/supabase'

// プロフィール取得
export const getProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// プロフィール更新
export const updateProfile = async (userId, updates) => {
  try {
    console.log('updateProfile called with:', { userId, updates })
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    console.log('Profile update result:', { data, error })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Profile update error:', error)
    return { data: null, error }
  }
}

// プロフィール作成（通常は自動作成されるが、手動作成が必要な場合用）
export const createProfile = async (userId, profileData) => {
  try {
    console.log('createProfile called with:', { userId, profileData })
    
    const insertData = { 
      id: userId, 
      ...profileData,
      user_role: profileData.user_role || 'viewer'
    }
    
    console.log('Inserting profile data:', insertData)
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([insertData])
      .select()
      .single()
    
    console.log('Profile creation result:', { data, error })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Profile creation error:', error)
    return { data: null, error }
  }
}