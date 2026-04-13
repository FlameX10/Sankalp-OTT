/**
 * ReelPlayerComponent - Core reusable video reel player
 * Handles: video playback, UI overlays, interactions
 * Decoupled from data fetching and Redux state management
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoView } from 'expo-video';

import { useVideoPlayerManager } from '../../hooks/useVideoPlayerManager';
import { ProgressBar } from './ProgressBar';
import { SideActionsPanel } from './SideActionsPanel';
import { PauseOverlay, LockOverlay, BufferingOverlay } from './VideoPlayerOverlays';
import { ReelBottomContent } from './ReelBottomContent';
import { REEL_THEME } from '../../utils/reelPlayerUtils';
import { API_BASE_URL } from '../../constants/config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * ReelPlayerComponent
 * 
 * @param {object} item - Reel item with required fields:
 *   - episode_id, show_title, episode_num, total_episodes
 *   - hls_url, thumbnail_url, duration_sec, view_count
 *   - is_locked, lock_reason, coin_cost, synopsis, tags, show_id
 * @param {boolean} isActive - Whether this reel is currently in view
 * @param {boolean} isFocused - Whether the screen is focused
 * @param {object} handlers - Event handlers:
 *   - onWatchAll(showId): Open episodes list
 *   - onShare(item): Share reel
 *   - onSaveToggle(item, isSaved): Toggle bookmark
 *   - onUnlock(item): Handle unlock attempt
 * @param {object} onPlayPauseChange - Optional callback on play/pause state change
 */
export const ReelPlayerComponent = ({
  item,
  isActive,
  isFocused,
  handlers = {},
  onPlayPauseChange,
}) => {
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = React.useState(false);

  // Build stream URL or null if locked
  const streamUrl = (!item.is_locked && item.hls_url)
    ? `${API_BASE_URL}${item.hls_url}`
    : null;

  // Use video player manager hook
  const { player, state, handlers: playerHandlers } = useVideoPlayerManager(
    streamUrl,
    {
      autoPlay: true,
    }
  );

  const {
    currentTime,
    duration,
    manuallyPaused,
    firstFrameRendered,
    isPlaying,
    isLocked,
  } = state;

  const {
    handleTap,
    handleSeek,
    setFirstFrameRendered,
    setActiveState,
    resetState,
  } = playerHandlers;

  // Set active state when props change
  useEffect(() => {
    setActiveState(isActive);
  }, [isActive, isFocused, setActiveState]);

  // Notify parent of play/pause changes
  useEffect(() => {
    onPlayPauseChange?.({ episodeId: item.episode_id, isPlaying });
  }, [isPlaying, item.episode_id, onPlayPauseChange]);

  // Reset when episode changes
  useEffect(() => {
    resetState();
  }, [item.episode_id, resetState]);

  const handleSaveToggle = () => {
    setSaved(!saved);
    handlers.onSaveToggle?.({ item, isSaved: !saved });
  };

  const handleWatchAll = () => {
    handlers.onWatchAll?.(item.show_id);
  };

  const handleShare = () => {
    handlers.onShare?.(item);
  };

  const handleUnlock = () => {
    handlers.onUnlock?.(item);
  };

  return (
    <View style={styles.reelContainer}>
      {/* Thumbnail background */}
      {item.thumbnail_url && (
        <Image
          source={{ uri: item.thumbnail_url }}
          style={[
            StyleSheet.absoluteFill,
            { opacity: firstFrameRendered ? 0 : 1 },
          ]}
          resizeMode="cover"
          blurRadius={isLocked ? 15 : 0}
        />
      )}
      {!item.thumbnail_url && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: REEL_THEME.darkOverlay }]} />
      )}

      {/* Video view */}
      {player && !isLocked && (
        <TouchableWithoutFeedback onPress={handleTap}>
          <View style={StyleSheet.absoluteFill}>
            <VideoView
              player={player}
              style={[
                StyleSheet.absoluteFill,
                { opacity: firstFrameRendered ? 1 : 0 },
              ]}
              contentFit="contain"
              nativeControls={false}
              allowsPictureInPicture={false}
              onFirstFrameRender={() => setFirstFrameRendered(true)}
            />
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Overlays */}
      {isActive && manuallyPaused && !isLocked && firstFrameRendered && (
        <PauseOverlay onPress={handleTap} />
      )}

      {isLocked && <LockOverlay item={item} onUnlock={handleUnlock} />}

      {isActive && player && !isLocked && !firstFrameRendered && (
        <BufferingOverlay />
      )}

      {/* UI Overlay */}
      <View style={[styles.uiOverlay, { paddingBottom: insets.bottom + 78 }]} pointerEvents="box-none">
        {/* Right side actions */}
        <SideActionsPanel
          item={item}
          isPlaying={isPlaying}
          isActive={isActive}
          isLocked={isLocked}
          onPlayPause={handleTap}
          onSaveToggle={handleSaveToggle}
          onShare={handleShare}
          onWatchAll={handleWatchAll}
          isSaved={saved}
        />

        {/* Bottom content */}
        <ReelBottomContent
          item={item}
          currentTime={currentTime}
          duration={duration}
          isLocked={isLocked}
          firstFrameRendered={firstFrameRendered}
          onSeek={handleSeek}
          onWatchAll={handleWatchAll}
        />
      </View>

      {/* Top search button */}
      <TouchableOpacity style={[styles.topSearch, { top: insets.top + 10 }]}>
        <Ionicons name="search" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  reelContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  uiOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  topSearch: {
    position: 'absolute',
    right: 20,
    padding: 10,
  },
});

// Export for external use
export default ReelPlayerComponent;
