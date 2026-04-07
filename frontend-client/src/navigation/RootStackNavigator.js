import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthWrapper from '../components/AuthWrapper';

export default function RootStackNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthWrapper />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
