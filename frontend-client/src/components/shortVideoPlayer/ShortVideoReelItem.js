import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoView } from 'expo-video';

import ProgressBar from './ProgressBar';
import SideAction from './SideAction';
import { styles } from './styles';
import { shortVideoTheme } from './theme';
import useShortVideoPlayback from './useShortVideoPlayback';
import { formatCount } from './utils';

function DefaultTopOverlay({ top, style }) {
  return (
    <TouchableOpacity style={[style, { top }]}>
      <Ionicons name="search" size={26} color="#fff" />
    </TouchableOpacity>
  );
}

export default function ShortVideoReelItem({
  item,
  isActive,
  isFocused,
  onWatchAll,
  onOpenDetails,
  renderTopOverlay,
  streamBase = '',
}) {
  const insets = useSafeAreaInsets();
  let tabBarHeight = 0;
  try {
    // This throws if the component is rendered outside a Bottom Tab screen.
    tabBarHeight = useBottomTabBarHeight();
  } catch {
    tabBarHeight = 0;
  }
  const [saved, setSaved] = useState(false);

  const isLocked = item.is_locked;
  const streamUrl = !isLocked && item.hls_url ? `${streamBase}${item.hls_url}` : null;

  const {
    currentTime,
    duration,
    firstFrameRendered,
    manuallyPaused,
    player,
    seekTo,
    setFirstFrameRendered,
    togglePlayback,
  } = useShortVideoPlayback({
    streamUrl,
    isActive,
    isFocused,
    isLocked,
    itemKey: item.episode_id,
    initialDuration: item.duration_sec || 0,
  });

  const topOverlay = renderTopOverlay
    ? renderTopOverlay({ insets, item })
    : <DefaultTopOverlay top={insets.top + 10} style={styles.topSearch} />;

  return (
    <View style={styles.reelContainer}>
      {item.thumbnail_url ? (
        <Image
          source={{ uri: item.thumbnail_url }}
          style={[StyleSheet.absoluteFill, { opacity: firstFrameRendered ? 0 : 1 }]}
          resizeMode="cover"
          blurRadius={isLocked ? 15 : 0}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0D0010' }]} />
      )}

      {player && !isLocked ? (
        <TouchableWithoutFeedback onPress={togglePlayback}>
          <View style={StyleSheet.absoluteFill}>
            <VideoView
              player={player}
              style={[StyleSheet.absoluteFill, { opacity: firstFrameRendered ? 1 : 0 }]}
              contentFit="contain"
              nativeControls={false}
              allowsPictureInPicture={false}
              onFirstFrameRender={() => setFirstFrameRendered(true)}
            />
          </View>
        </TouchableWithoutFeedback>
      ) : null}

      {isActive && manuallyPaused && !isLocked && firstFrameRendered ? (
        <TouchableWithoutFeedback onPress={togglePlayback}>
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseIconCircle}>
              <Ionicons name="play" size={40} color="#fff" />
            </View>
          </View>
        </TouchableWithoutFeedback>
      ) : null}

      {isLocked ? (
        <View style={styles.lockOverlay}>
          <View style={styles.lockIconWrap}>
            <Ionicons name="lock-closed" size={32} color="#fff" />
          </View>
          <Text style={styles.lockTitle}>
            {item.lock_reason === 'login_required'
              ? 'Sign up to watch'
              : `Unlock with ${item.coin_cost} coins`}
          </Text>
          <TouchableOpacity style={styles.lockButton}>
            <Text style={styles.lockButtonText}>
              {item.lock_reason === 'login_required' ? 'Sign Up' : 'Unlock'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {isActive && player && !isLocked && !firstFrameRendered ? (
        <View style={styles.bufferingOverlay}>
          <ActivityIndicator size="large" color={shortVideoTheme.crimson} />
        </View>
      ) : null}

      <View
        // Keep content above bottom navigation, without leaving a big gap.
        style={[styles.uiOverlay, { paddingBottom: insets.bottom}]}
        pointerEvents="box-none"
      >
        <View style={styles.sideActionsColumn}>
          <SideAction
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            label={item.view_count > 0 ? formatCount(item.view_count) : ''}
            color={saved ? shortVideoTheme.crimson : '#fff'}
            onPress={() => setSaved((previouslySaved) => !previouslySaved)}
          />

          <SideAction
            icon="list"
            label="Episodes"
            onPress={() => onWatchAll && onWatchAll(item)}
          />

          <SideAction icon="share-social" label="Share" />
        </View>

        <View style={styles.textContent}>
          <TouchableOpacity
            style={styles.titleRow}
            activeOpacity={0.8}
            onPress={() => onOpenDetails && onOpenDetails(item)}
          >
            <Text style={styles.reelTitle} numberOfLines={1}>{item.show_title}</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>

          <View style={styles.epBadge}>
            <Ionicons name="videocam" size={12} color={shortVideoTheme.crimson} />
            <Text style={styles.epBadgeText}>EP.{item.episode_num}</Text>
          </View>

          <View style={styles.tagsRow}>
            {(item.tags || []).slice(0, 4).map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {item.synopsis ? (
            <Text style={styles.descText} numberOfLines={2}>
              {item.synopsis}{' '}
              <Text style={{ fontWeight: 'bold', color: '#fff' }}>more</Text>
            </Text>
          ) : null}

          {!isLocked && firstFrameRendered ? (
            <ProgressBar
              currentTime={currentTime}
              duration={duration}
              onSeek={seekTo}
            />
          ) : null}

          <TouchableOpacity
            style={styles.episodeStrip}
            onPress={() => onWatchAll && onWatchAll(item)}
          >
            <Ionicons name="play-circle" size={20} color={shortVideoTheme.crimson} />
            <Text style={styles.episodeText}>
              EP.{item.episode_num} / EP.{item.total_episodes}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.watchAllText}>Watch All</Text>
            <Ionicons name="chevron-forward" size={16} color={shortVideoTheme.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {topOverlay}
    </View>
  );
}
