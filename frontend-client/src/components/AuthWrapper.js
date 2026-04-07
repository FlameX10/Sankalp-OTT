import React from 'react';
import { useSelector } from 'react-redux';

import AppNavigator from '../navigation/AppNavigator';
import AuthNavigator from '../navigation/AuthNavigator';

export default function AuthWrapper() {
  const accessToken = useSelector((state) => state.auth.accessToken);
  return accessToken ? <AppNavigator /> : <AuthNavigator />;
}

