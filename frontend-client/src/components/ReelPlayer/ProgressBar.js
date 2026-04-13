/**
 * Reusable Progress Bar component with YouTube-style scrubber
 * Displays current progress, remaining time, and allows seeking
 */

import React from 'react';
import {
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Text,
  Dimensions,
} from 'react-native';
import { formatTime, REEL_THEME } from '../../utils/reelPlayerUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * ProgressBar Component
 * @param {number} currentTime - Current playback time in seconds
 * @param {number} duration - Total duration in seconds
 * @param {function} onSeek - Callback when user seeks, receives seekTime in seconds
 */
export const ProgressBar = ({ currentTime = 0, duration = 0, onSeek }) => {
  const progress = duration > 0 ? currentTime / duration : 0;
  const remaining = duration - currentTime;

  const handlePress = (e) => {
    const touchX = e.nativeEvent.locationX;
    const barWidth = SCREEN_WIDTH - 32; // 16px padding each side
    const seekRatio = Math.max(0, Math.min(1, touchX / barWidth));
    const seekTime = seekRatio * duration;
    onSeek?.(seekTime);
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handlePress}>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          {/* Scrubber dot - positioned at progress point */}
          <View style={[styles.scrubberDot, { left: `${progress * 100}%` }]} />
        </View>
      </TouchableWithoutFeedback>
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <Text style={styles.timeText}>-{formatTime(remaining)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: REEL_THEME.bgWeak,
    borderRadius: 2,
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: REEL_THEME.crimson,
    borderRadius: 2,
  },
  scrubberDot: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: REEL_THEME.crimson,
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    color: REEL_THEME.textWeaker,
    fontSize: 11,
    fontWeight: '500',
  },
});
