// App.tsx — VERSÃO FINAL com todas as telas
// Agora Livre — Navegação completa

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';

import { supabase } from './src/lib/supabase';
import { setupNotificationHandler } from './src/lib/notifications';
import { Colors, FontWeight } from './src/theme';
import { t } from './src/i18n';

import Onboarding1Screen   from './src/screens/onboarding/Onboarding1Screen';
import Onboarding2Screen   from './src/screens/onboarding/Onboarding2Screen';
import Onboarding3Screen   from './src/screens/onboarding/Onboarding3Screen';
import HomeScreen          from './src/screens/HomeScreen';
import CheckInScreen       from './src/screens/CheckInScreen';
import ProgressScreen      from './src/screens/ProgressScreen';
import PremiumScreen       from './src/screens/PremiumScreen';
import CrisisModeScreen    from './src/screens/CrisisModeScreen';
import RelapseRecordScreen from './src/screens/RelapseRecordScreen';

import type { HomeStackParamList, MainTabParamList, RootStackParamList } from './src/types';

SplashScreen.preventAutoHideAsync();

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTab   = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeScreen"    component={HomeScreen} />
      <HomeStack.Screen name="CrisisMode"    component={CrisisModeScreen}    options={{ presentation: 'modal', gestureEnabled: false }} />
      <HomeStack.Screen name="RelapseRecord" component={RelapseRecordScreen} options={{ presentation: 'modal' }} />
    </HomeStack.Navigator>
  );
}

function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const ICONS: Record<string, string> = { Home: '🏠', CheckIn: '📋', Progress: '📊', Premium: '⭐' };

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 12,
        },
        tabBarActiveTintColor:   Colors.blue,
        tabBarInactiveTintColor: Colors.placeholder,
        tabBarLabelStyle: { fontSize: 11, fontWeight: FontWeight.bold, marginTop: 4 },
        tabBarIconStyle: { marginBottom: 2 },
        tabBarIcon: ({ color, focused }) => (
          <Text style={{ fontSize: focused ? 22 : 20, color }}>{ICONS[route.name]}</Text>
        ),
      })}
    >
      <MainTab.Screen name="Home"     component={HomeStackNavigator} options={{ tabBarLabel: t('navHome')     }} />
      <MainTab.Screen name="CheckIn"  component={CheckInScreen}      options={{ tabBarLabel: t('navCheckIn')  }} />
      <MainTab.Screen name="Progress" component={ProgressScreen}     options={{ tabBarLabel: t('navProgress') }} />
      <MainTab.Screen name="Premium"  component={PremiumScreen}      options={{ tabBarLabel: t('navPremium')  }} />
    </MainTab.Navigator>
  );
}

export default function App() {
  const [session,   setSession]   = useState<Session | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [ready,     setReady]     = useState(false);

  // Fontes comentadas para evitar erro de runtime enquanto os arquivos .ttf não são adicionados
  const [fontsLoaded, fontError] = [true, null]; 
  /*
  const [fontsLoaded, fontError] = useFonts({
    'Manrope-ExtraBold': require('./assets/fonts/Manrope-ExtraBold.ttf'),
    'Manrope-Bold':      require('./assets/fonts/Manrope-Bold.ttf'),
    'Manrope-Regular':   require('./assets/fonts/Manrope-Regular.ttf'),
    'Inter-Regular':     require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold':    require('./assets/fonts/Inter-SemiBold.ttf'),
  });
  */


  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        setSession(session);
        if (session?.user) {
          const { data } = await supabase.from('profiles').select('addiction_type,trigger_times').eq('id', session.user.id).single();
          setIsNewUser(!data?.addiction_type || !data?.trigger_times?.length);
        }
      } catch (err) {
        console.warn('Erro ao buscar perfil:', err);
      } finally {
        setReady(true);
      }
    }).catch((err) => {
      console.warn('Erro na autenticação:', err);
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if ((ready && fontsLoaded) || fontError) {
      SplashScreen.hideAsync();
    }
  }, [ready, fontsLoaded, fontError]);

  if (!ready || (!fontsLoaded && !fontError)) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          {!session ? (
            <>
              <RootStack.Screen name="Onboarding1" component={Onboarding1Screen} />
              <RootStack.Screen name="Onboarding2" component={Onboarding2Screen} />
              <RootStack.Screen name="Onboarding3" component={Onboarding3Screen} />
              <RootStack.Screen name="Main"         component={MainTabNavigator}  />
            </>
          ) : isNewUser ? (
            <>
              <RootStack.Screen name="Onboarding2" component={Onboarding2Screen} />
              <RootStack.Screen name="Onboarding3" component={Onboarding3Screen} />
              <RootStack.Screen name="Main"         component={MainTabNavigator}  />
            </>
          ) : (
            <RootStack.Screen name="Main" component={MainTabNavigator} />
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
