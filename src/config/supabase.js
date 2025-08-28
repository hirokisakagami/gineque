import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://sxyebfujxcgyzuiqimak.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4eWViZnVqeGNneXp1aXFpbWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MTY0MDIsImV4cCI6MjA3MTQ5MjQwMn0.crCLNSXfC4xEZOzCBCZ1ACQwphp68N02RdU-WkEuGmk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})