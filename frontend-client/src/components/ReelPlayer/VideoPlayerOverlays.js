/**
 * Video Player Overlays
 * Handles: lock screen, pause overlay, buffering spinner
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { REEL_THEME } from '../../utils/reelPlayerUtils';

/**
 * Pause Overlay - shows large play icon when manually paused
 */
export const PauseOverlay = ({ onPress }) => (
  <TouchableWithoutFeedback onPress={onPress}>
    <View style={styles.pauseOverlay}>
      <View style={styles.pauseIconCircle}>
        <Ionicons name="play" size={40} color="#fff" />
      </View>
    </View>
  </TouchableWithoutFeedback>
);

/**
 * Lock Overlay - shows when content is locked
 * @param {object} item - Reel item with lock info
 * @param {function} onUnlock - Handler for unlock button
 */
export const LockOverlay = ({ item, onUnlock }) => {
  const lockReason = item.lock_reason === 'login_required' ? 'login_required' : 'coin_locked';
  const title = lockReason === 'login_required'
    ? 'Sign up to watch'
    : `Unlock with ${item.coin_cost} coins`;
  const buttonText = lockReason === 'login_required' ? 'Sign Up' : 'Unlock';

  return (
    <View style={styles.lockOverlay}>
      <View style={styles.lockIconWrap}>
        <Ionicons name="lock-closed" size={32} color="#fff" />
      </View>
      <Text style={styles.lockTitle}>{title}</Text>
      <TouchableOpacity style={styles.lockButton} onPress={onUnlock}>
        <Text style={styles.lockButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Buffering Overlay - shows loading spinner
 */
export const BufferingOverlay = () => (
  <View style={styles.bufferingOverlay}>
    <ActivityIndicator size="large" color={REEL_THEME.crimson} />
  </View>
);

const styles = StyleSheet.create({
  // Pause overlay
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: REEL_THEME.semiTransparentBlack,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },

  // Lock overlay
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: REEL_THEME.semiTransparentBlack,
  },
  lockIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,45,85,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,45,85,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  lockButton: {
    backgroundColor: REEL_THEME.crimson,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
  },
  lockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Buffering overlay
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
