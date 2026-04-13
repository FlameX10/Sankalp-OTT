import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import { ROUTES } from '../constants/routes';

const Stack = createNativeStackNavigator();

export default function AuthNavigator({ onGuestAccess }) {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.LOGIN}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name={ROUTES.LOGIN}>
        {(props) => <LoginScreen {...props} onGuestAccess={onGuestAccess} />}
      </Stack.Screen>
      <Stack.Screen name={ROUTES.SIGNUP} component={SignUpScreen} />
    </Stack.Navigator>
  );
}
