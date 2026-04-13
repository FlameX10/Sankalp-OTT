/**
 * Bottom content section of reel player
 * Includes: title, tags, synopsis, episode info, progress bar
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from './ProgressBar';
import { REEL_THEME } from '../../utils/reelPlayerUtils';

/**
 * ReelBottomContent
 * @param {object} item - Reel item with metadata
 * @param {number} currentTime - Current playback time
 * @param {number} duration - Total duration
 * @param {boolean} isLocked - Whether content is locked
 * @param {boolean} firstFrameRendered - Whether video has rendered
 * @param {function} onSeek - Seek handler
 * @param {function} onWatchAll - Navigate to episodes
 */
export const ReelBottomContent = ({
  item,
  currentTime,
  duration,
  isLocked,
  firstFrameRendered,
  onSeek,
  onWatchAll,
}) => (
  <View style={styles.textContent}>
    {/* Title row with chevron */}
    <View style={styles.titleRow}>
      <Text style={styles.reelTitle} numberOfLines={1}>
        {item.show_title}
      </Text>
      <Ionicons name="chevron-forward" size={18} color="#fff" />
    </View>

    {/* Episode badge */}
    <View style={styles.epBadge}>
      <Ionicons name="videocam" size={12} color={REEL_THEME.crimson} />
      <Text style={styles.epBadgeText}>EP.{item.episode_num}</Text>
    </View>

    {/* Tags */}
    {item.tags && item.tags.length > 0 && (
      <View style={styles.tagsRow}>
        {item.tags.slice(0, 4).map((tag) => (
          <View key={tag} style={styles.tagPill}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    )}

    {/* Synopsis */}
    {item.synopsis && (
      <Text style={styles.descText} numberOfLines={2}>
        {item.synopsis}{' '}
        <Text style={{ fontWeight: 'bold', color: '#fff' }}>more</Text>
      </Text>
    )}

    {/* Progress bar */}
    {!isLocked && firstFrameRendered && (
      <ProgressBar
        currentTime={currentTime}
        duration={duration}
        onSeek={onSeek}
      />
    )}

    {/* Episode strip */}
    <TouchableOpacity style={styles.episodeStrip} onPress={onWatchAll}>
      <Ionicons name="play-circle" size={20} color={REEL_THEME.crimson} />
      <Text style={styles.episodeText}>
        EP.{item.episode_num} / EP.{item.total_episodes}
      </Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.watchAllText}>Watch All</Text>
      <Ionicons name="chevron-forward" size={16} color={REEL_THEME.muted} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  textContent: {
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reelTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginRight: 6,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },

  // Episode badge
  epBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  epBadgeText: {
    color: REEL_THEME.crimson,
    fontSize: 12,
    fontWeight: '700',
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: REEL_THEME.bgWeak,
  },
  tagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Description
  descText: {
    color: REEL_THEME.textWeak,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    paddingRight: 50,
  },

  // Episode strip
  episodeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: REEL_THEME.bgWeaker,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: REEL_THEME.borderMuted,
  },
  episodeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  watchAllText: {
    color: REEL_THEME.muted,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
});
