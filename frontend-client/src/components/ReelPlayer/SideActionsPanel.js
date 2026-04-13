/**
 * Reusable Side Actions Panel
 * Displays action buttons on the right side of the reel (bookmark, share, etc.)
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCount, REEL_THEME } from '../../utils/reelPlayerUtils';

/**
 * Individual side action button
 */
export const SideAction = ({ icon, label, color = '#fff', onPress, testID }) => (
  <TouchableOpacity
    style={styles.sideAction}
    onPress={onPress}
    activeOpacity={0.7}
    testID={testID}
  >
    <Ionicons name={icon} size={28} color={color} />
    {label ? <Text style={styles.sideLabel}>{label}</Text> : null}
  </TouchableOpacity>
);

/**
 * Play/Pause button for the right panel
 */
export const PlayPauseButton = ({ isPlaying, onPress, testID }) => (
  <TouchableOpacity
    style={styles.playPauseButton}
    onPress={onPress}
    activeOpacity={0.85}
    testID={testID}
  >
    <Ionicons
      name={isPlaying ? 'pause' : 'play'}
      size={16}
      color="#fff"
      style={isPlaying ? null : styles.playIconNudge}
    />
  </TouchableOpacity>
);

/**
 * Side Actions Panel Container
 * @param {object} item - Reel item with metadata
 * @param {boolean} isPlaying - Current play state
 * @param {boolean} isActive - Whether this reel is currently visible
 * @param {boolean} isLocked - Whether content is locked
 * @param {function} onPlayPause - Handler for play/pause button
 * @param {function} onSaveToggle - Handler for bookmark button
 * @param {function} onShare - Handler for share button
 * @param {function} onWatchAll - Handler for "Episodes" button
 * @param {boolean} isSaved - Whether item is bookmarked
 */
export const SideActionsPanel = ({
  item,
  isPlaying,
  isActive,
  isLocked,
  onPlayPause,
  onSaveToggle,
  onShare,
  onWatchAll,
  isSaved,
}) => (
  <View style={styles.sideActionsColumn}>
    {!isLocked && isActive && (
      <PlayPauseButton
        isPlaying={isPlaying}
        onPress={onPlayPause}
        testID="reelPlayPauseBtn"
      />
    )}
    <SideAction
      icon={isSaved ? 'bookmark' : 'bookmark-outline'}
      label={item.view_count > 0 ? formatCount(item.view_count) : ''}
      color={isSaved ? REEL_THEME.crimson : '#fff'}
      onPress={onSaveToggle}
      testID="reelBookmarkBtn"
    />
    <SideAction
      icon="list"
      label="Episodes"
      onPress={() => onWatchAll?.(item.show_id)}
      testID="reelEpisodesBtn"
    />
    <SideAction
      icon="share-social"
      label="Share"
      onPress={onShare}
      testID="reelShareBtn"
    />
  </View>
);

const styles = StyleSheet.create({
  sideActionsColumn: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
    gap: 22,
    paddingRight: 4,
  },
  sideAction: {
    alignItems: 'center',
  },
  playPauseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: REEL_THEME.semiTransparentDark,
    borderWidth: 1,
    borderColor: REEL_THEME.borderWeak,
  },
  playIconNudge: {
    marginLeft: 1,
  },
  sideLabel: {
    color: '#fff',
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
