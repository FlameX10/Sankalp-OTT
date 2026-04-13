import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import AppNavigator from '../navigation/AppNavigator';
import AuthNavigator from '../navigation/AuthNavigator';
import SplashScreen from './SplashScreen';
import { initAuth } from '../redux/slices/authSlice';

export default function AuthWrapper() {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const isInitializing = useSelector((state) => state.auth.isInitializing);
  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);

  if (isInitializing) {
    return <SplashScreen />;
  }

  // Show main app if logged in OR in guest mode
  if (accessToken || guestMode) {
    return <AppNavigator />;
  }

  // Pass setGuestMode to AuthNavigator so login screen can have "Continue as Guest"
  return <AuthNavigator onGuestAccess={() => setGuestMode(true)} />;
}
