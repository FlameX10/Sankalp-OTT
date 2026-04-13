import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent, useEventListener } from 'expo';
import { useIsFocused } from '@react-navigation/native';

import { API_BASE_URL } from '../constants/config';
import {
  fetchForYouFeed,
  selectForYouItems,
  selectForYouLoading,
  selectForYouHasMore,
  selectForYouOffset,
} from '../redux/slices/reelsSlice';
import DramaDetailsSheet from '../components/DramaDetailsSheet';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PREFETCH_THRESHOLD = 3;
const STREAM_BASE = API_BASE_URL;

const theme = {
  crimson: '#FF2D55',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.6)',
};

// ─── Format helpers ───
function formatCount(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

function formatTime(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// ─── Side Action Button ───
function SideAction({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={styles.sideAction} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={28} color={color || '#fff'} />
      {label ? <Text style={styles.sideLabel}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

// ─── Progress Bar (YouTube-style) ───
function ProgressBar({ currentTime, duration, onSeek }) {
  const progress = duration > 0 ? currentTime / duration : 0;
  const remaining = duration - currentTime;

  const handlePress = (e) => {
    const touchX = e.nativeEvent.locationX;
    const barWidth = SCREEN_WIDTH - 32; // 16px padding each side
    const seekRatio = Math.max(0, Math.min(1, touchX / barWidth));
    const seekTime = seekRatio * duration;
    if (onSeek) onSeek(seekTime);
  };

  return (
    <View style={styles.progressContainer}>
      <TouchableWithoutFeedback onPress={handlePress}>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          {/* Scrubber dot */}
          <View style={[styles.scrubberDot, { left: `${progress * 100}%` }]} />
        </View>
      </TouchableWithoutFeedback>
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <Text style={styles.timeText}>-{formatTime(remaining)}</Text>
      </View>
    </View>
  );
}

// ─── Single Reel Item ───
function ReelItem({ item, isActive, isFocused, onWatchAll }) {
  const insets = useSafeAreaInsets();
  const lastTapAtRef = useRef(0);
  const [saved, setSaved] = useState(false);
  const [firstFrameRendered, setFirstFrameRendered] = useState(false);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(item.duration_sec || 0);

  const isLocked = item.is_locked;
  const streamUrl = (!isLocked && item.hls_url) ? `${STREAM_BASE}${item.hls_url}` : null;

  // Create player
  const player = useVideoPlayer(streamUrl, (p) => {
    p.loop = true;
    p.timeUpdateEventInterval = 0.5;
  });

  // Track playing state via useEvent (docs pattern)
  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player?.playing ?? false,
  });

  // Track time updates for progress bar
  useEventListener(player, 'timeUpdate', (payload) => {
    setCurrentTime(payload.currentTime);
    if (payload.bufferedPosition > 0 && duration === 0) {
      setDuration(player.duration || item.duration_sec || 0);
    }
  });

  // Update duration when status changes to readyToPlay
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'readyToPlay' && player.duration > 0) {
      setDuration(player.duration);
    }
  });

  // Play/pause based on active state + screen focus + manual pause
  useEffect(() => {
    if (!player) return;
    if (isActive && isFocused && !manuallyPaused) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, isFocused, manuallyPaused, player]);

  // Reset first frame when episode changes
  useEffect(() => {
    setFirstFrameRendered(false);
    setCurrentTime(0);
    setManuallyPaused(false);
  }, [item.episode_id]);

  // Tap to toggle play/pause
  const handleTap = () => {
    if (!player || isLocked || !isActive) return;
    const now = Date.now();
    if (now - lastTapAtRef.current < 80) return;
    lastTapAtRef.current = now;

    setManuallyPaused((prev) => {
      const nextPaused = !prev;
      if (nextPaused) {
        player.pause();
      } else if (isFocused) {
        player.play();
      }
      return nextPaused;
    });
  };

  // Seek via progress bar
  const handleSeek = (time) => {
    if (!player) return;
    player.currentTime = time;
    setCurrentTime(time);
  };

  return (
    <View style={styles.reelContainer}>
      {/* 1. THUMBNAIL (visible until first frame renders) */}
      {item.thumbnail_url && (
        <Image
          source={{ uri: item.thumbnail_url }}
          style={[StyleSheet.absoluteFill, { opacity: firstFrameRendered ? 0 : 1 }]}
          resizeMode="cover"
          blurRadius={isLocked ? 15 : 0}
        />
      )}
      {!item.thumbnail_url && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0D0010' }]} />
      )}

      {/* 2. VIDEO VIEW */}
      {player && !isLocked && (
        <TouchableWithoutFeedback onPress={handleTap}>
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
      )}

      {/* 3. PAUSE ICON OVERLAY (shown when manually paused) */}
      {isActive && manuallyPaused && !isLocked && firstFrameRendered && (
        <TouchableWithoutFeedback onPress={handleTap}>
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseIconCircle}>
              <Ionicons name="play" size={40} color="#fff" />
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* 4. LOCK OVERLAY */}
      {isLocked && (
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
      )}

      {/* 5. BUFFERING SPINNER */}
      {isActive && player && !isLocked && !firstFrameRendered && (
        <View style={styles.bufferingOverlay}>
          <ActivityIndicator size="large" color={theme.crimson} />
        </View>
      )}

      {/* 6. UI OVERLAY */}
      <View style={[styles.uiOverlay, { paddingBottom: insets.bottom + 78 }]} pointerEvents="box-none">
        {/* Right side buttons */}
        <View style={styles.sideActionsColumn}>
          {!isLocked && isActive && (
            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={handleTap}
              activeOpacity={0.85}
            >
              <Ionicons
                name={manuallyPaused ? 'play' : 'pause'}
                size={16}
                color="#fff"
                style={manuallyPaused ? styles.playIconNudge : null}
              />
            </TouchableOpacity>
          )}
          <SideAction
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            label={item.view_count > 0 ? formatCount(item.view_count) : ''}
            color={saved ? theme.crimson : '#fff'}
            onPress={() => setSaved(!saved)}
          />
          {/* ✅ Episodes button opens DramaDetailsSheet (Prasen's feature) */}
          <SideAction
            icon="list"
            label="Episodes"
            onPress={() => onWatchAll && onWatchAll(item)}
          />
          <SideAction icon="share-social" label="Share" />
        </View>

        {/* Bottom content */}
        <View style={styles.textContent}>
          {/* Title row with episode number */}
          <View style={styles.titleRow}>
            <Text style={styles.reelTitle} numberOfLines={1}>{item.show_title}</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </View>

          {/* Episode number badge */}
          <View style={styles.epBadge}>
            <Ionicons name="videocam" size={12} color={theme.crimson} />
            <Text style={styles.epBadgeText}>EP.{item.episode_num}</Text>
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            {(item.tags || []).slice(0, 4).map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Synopsis */}
          {item.synopsis ? (
            <Text style={styles.descText} numberOfLines={2}>
              {item.synopsis}{' '}
              <Text style={{ fontWeight: 'bold', color: '#fff' }}>more</Text>
            </Text>
          ) : null}

          {/* Progress bar (YouTube-style) */}
          {!isLocked && firstFrameRendered && (
            <ProgressBar
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
            />
          )}

          {/* ✅ Episode strip triggers DramaDetailsSheet (Prasen's feature) */}
          <TouchableOpacity
            style={styles.episodeStrip}
            onPress={() => onWatchAll && onWatchAll(item)}
          >
            <Ionicons name="play-circle" size={20} color={theme.crimson} />
            <Text style={styles.episodeText}>
              EP.{item.episode_num} / EP.{item.total_episodes}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.watchAllText}>Watch All</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Top search */}
      <TouchableOpacity style={[styles.topSearch, { top: insets.top + 10 }]}>
        <Ionicons name="search" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ───
export default function ForYouScreen({ navigation }) {
  const dispatch = useDispatch();
  const items = useSelector(selectForYouItems);
  const loading = useSelector(selectForYouLoading);
  const hasMore = useSelector(selectForYouHasMore);
  const offset = useSelector(selectForYouOffset);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isFocused = useIsFocused();

  // ✅ DramaDetailsSheet state (Prasen's feature)
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedDrama, setSelectedDrama] = useState(null);

  useEffect(() => {
    dispatch(fetchForYouFeed({ offset: 0, refresh: true }));
  }, [dispatch]);

  const onMomentumScrollEnd = useCallback(
    (e) => {
      const newIndex = Math.round(e.nativeEvent.contentOffset.y / SCREEN_HEIGHT);
      setCurrentIndex(newIndex);
      if (hasMore && newIndex >= items.length - PREFETCH_THRESHOLD) {
        dispatch(fetchForYouFeed({ offset }));
      }
    },
    [dispatch, hasMore, items.length, offset]
  );

  // ✅ Opens DramaDetailsSheet with selected drama item (Prasen's feature)
  const handleWatchAll = useCallback((item) => {
    setSelectedDrama(item);
    setSheetVisible(true);
  }, []);

  const handleRefresh = useCallback(() => {
    dispatch(fetchForYouFeed({ offset: 0, refresh: true }));
  }, [dispatch]);

  if (loading && items.length === 0) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color={theme.crimson} />
        <Text style={styles.loadingText}>Loading feed...</Text>
      </View>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <Ionicons name="videocam-off-outline" size={48} color="#555" />
        <Text style={styles.emptyTitle}>No shows available</Text>
        <Text style={styles.emptySubtitle}>Check back soon for new content</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <FlatList
        data={items}
        keyExtractor={(item) => item.episode_id}
        renderItem={({ item, index }) => (
          <ReelItem
            item={item}
            isActive={index === currentIndex}
            isFocused={isFocused}
            onWatchAll={handleWatchAll}
          />
        )}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        removeClippedSubviews={true}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        onRefresh={handleRefresh}
        refreshing={loading}
      />

      {/* ✅ DRAMA DETAILS MODAL (Prasen's feature) */}
      <DramaDetailsSheet
        visible={sheetVisible}
        item={selectedDrama}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  reelContainer: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  uiOverlay: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16 },

  // Side buttons
  sideActionsColumn: {
    alignSelf: 'flex-end', alignItems: 'center', marginBottom: 20, gap: 22, paddingRight: 4,
  },
  sideAction: { alignItems: 'center' },
  playPauseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  playIconNudge: { marginLeft: 1 },
  sideLabel: {
    color: '#fff', fontSize: 11, marginTop: 3, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },

  // Bottom text
  textContent: { width: '100%' },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  reelTitle: {
    color: '#fff', fontSize: 20, fontWeight: '800', marginRight: 6,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8,
  },

  // Episode badge
  epBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10,
  },
  epBadgeText: {
    color: theme.crimson, fontSize: 12, fontWeight: '700',
  },

  tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tagPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)' },
  tagText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  descText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20, marginBottom: 10, paddingRight: 50 },

  // Progress bar
  progressContainer: { marginBottom: 12 },
  progressBarTrack: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, position: 'relative',
  },
  progressBarFill: {
    height: '100%', backgroundColor: theme.crimson, borderRadius: 2,
  },
  scrubberDot: {
    position: 'absolute', top: -4, width: 12, height: 12, borderRadius: 6,
    backgroundColor: theme.crimson, marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 4,
  },
  timeText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500' },

  episodeStrip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  episodeText: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 8 },
  watchAllText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginRight: 4 },
  topSearch: { position: 'absolute', right: 20, padding: 10 },

  // Pause overlay
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center',
  },
  pauseIconCircle: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', paddingLeft: 4,
  },

  // Lock
  lockOverlay: {
    ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  lockIconWrap: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,45,85,0.2)',
    borderWidth: 1, borderColor: 'rgba(255,45,85,0.4)', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  lockTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  lockButton: { backgroundColor: '#FF2D55', paddingHorizontal: 28, paddingVertical: 10, borderRadius: 20 },
  lockButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Buffering
  bufferingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },

  // Loading / empty
  loadingScreen: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888', fontSize: 14, marginTop: 12 },
  emptyTitle: { color: '#aaa', fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtitle: { color: '#666', fontSize: 14, marginTop: 6 },
  retryButton: { marginTop: 20, backgroundColor: '#FF2D55', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
