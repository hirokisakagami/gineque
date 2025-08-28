import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { DataUpdateProvider } from './src/contexts/DataUpdateContext';
import LoadingScreen from './src/components/LoadingScreen';
import IntroVideoScreen from './src/screens/IntroVideoScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MovieDetailScreen from './src/screens/MovieDetailScreen';
import MovieEntryScreen from './src/screens/MovieEntryScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Home') {
            return (
              <Image
                source={require('./assets/icon.png')}
                style={{
                  width: size,
                  height: size,
                }}
                resizeMode="contain"
              />
            );
          } else if (route.name === 'Search') {
            return (
              <Image
                source={require('./assets/kensaku.png')}
                style={{
                  width: size * 1.2,
                  height: size * 1.2,
                }}
                resizeMode="contain"
              />
            );
          } else if (route.name === 'Profile') {
            return (
              <Image
                source={require('./assets/home.png')}
                style={{
                  width: size,
                  height: size,
                }}
                resizeMode="contain"
              />
            );
          }

          return null;
        },
        tabBarActiveTintColor: '#fffacd',
        tabBarInactiveTintColor: '#B0B0B0',
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 75,
          paddingBottom: 12,
          paddingTop: 8,
          position: 'absolute',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={['#0000cc', '#000080', '#00004d']}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        ),
        headerStyle: {
          backgroundColor: '#000080',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 8,
        },
        headerTintColor: '#fffacd',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'ホーム' }}
        listeners={{
          tabPress: async (e) => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch (error) {
              console.log('Home tab haptic error:', error);
            }
          },
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{ title: '検索' }}
        listeners={{
          tabPress: async (e) => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch (error) {
              console.log('Search tab haptic error:', error);
            }
          },
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'プロフィール' }}
        listeners={{
          tabPress: async (e) => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch (error) {
              console.log('Profile tab haptic error:', error);
            }
          },
        }}
      />
    </Tab.Navigator>
  );
}

const AppNavigator = () => {
  const { user, loading, hasSeenIntro } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  // 初期画面を決定するロジック
  const getInitialRouteName = () => {
    // イントロ未視聴の場合はログイン状態に関係なくイントロ動画を表示
    if (!hasSeenIntro) {
      return "IntroVideo";
    }
    // イントロ視聴済みでユーザーがログインしていない場合はログイン画面
    if (!user) {
      return "Login";
    }
    // イントロ視聴済みでユーザーがログイン済みの場合はメインタブ
    return "MainTabs";
  };

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={getInitialRouteName()}
      >
        <>
          {user ? (
            // ログイン済みユーザー向け画面
            <>
              <Stack.Screen name="MainTabs" component={TabNavigator} />
              <Stack.Screen 
                name="MovieDetail" 
                component={MovieDetailScreen} 
                options={{
                  headerShown: true,
                  headerStyle: { 
                    backgroundColor: '#000080',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 6,
                    elevation: 8,
                  },
                  headerTintColor: '#fffacd',
                  title: '詳細'
                }}
              />
              <Stack.Screen 
                name="MovieEntry" 
                component={MovieEntryScreen} 
                options={{
                  headerShown: true,
                  headerStyle: { 
                    backgroundColor: '#000080',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 6,
                    elevation: 8,
                  },
                  headerTintColor: '#fffacd',
                  title: '作品投稿'
                }}
              />
            </>
          ) : null}
          
          {/* 共通画面 - 認証状態に関わらず利用可能 */}
          <Stack.Screen name="IntroVideo" component={IntroVideoScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <DataUpdateProvider>
        <AppNavigator />
      </DataUpdateProvider>
    </AuthProvider>
  );
}