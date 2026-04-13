/**
 * ReelsFeedContainer - Reusable reel feed wrapper
 * Combines: Redux state, data fetching, pagination, ReelPlayerComponent
 * Independent of data source - can work with any API that returns reel items
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import ReelPlayerComponent from './ReelPlayerComponent';
import { REEL_THEME, REEL_DIMENSIONS } from '../../utils/reelPlayerUtils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * ReelsFeedContainer
 * 
 * High-level component that orchestrates reel feed display
 * 
 * @param {string} playerId - Unique ID for this player instance (used for Redux state)
 * @param {array} items - Array of reel items to display
 * @param {boolean} isLoading - Whether data is currently loading
 * @param {boolean} hasMore - Whether more items are available
 * @param {function} onLoadMore - Handler to fetch next batch of items
 * @param {function} onRefresh - Handler to refresh the feed
 * @param {object} handlers - Event handlers (onWatchAll, onShare, etc.)
 * @param {boolean} isRefreshing - Whether pull-to-refresh is active
 */
export const ReelsFeedContainer = ({
  playerId,
  items,
  isLoading,
  hasMore,
  onLoadMore,
  onRefresh,
  handlers = {},
  isRefreshing = false,
}) => {
  const isFocused = useIsFocused();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load more when scrolling near end
  const onMomentumScrollEnd = useCallback(
    (e) => {
      const newIndex = Math.round(e.nativeEvent.contentOffset.y / SCREEN_HEIGHT);
      setCurrentIndex(newIndex);
      
      if (hasMore && newIndex >= items.length - REEL_DIMENSIONS.PREFETCH_THRESHOLD) {
        onLoadMore?.();
      }
    },
    [onLoadMore, hasMore, items.length]
  );

  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color={REEL_THEME.crimson} />
        <Text style={styles.loadingText}>Loading feed...</Text>
      </View>
    );
  }

  // Empty state
  if (!isLoading && items.length === 0) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <Ionicons name="videocam-off-outline" size={48} color="#555" />
        <Text style={styles.emptyTitle}>No shows available</Text>
        <Text style={styles.emptySubtitle}>Check back soon for new content</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
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
          <ReelPlayerComponent
            item={item}
            isActive={index === currentIndex}
            isFocused={isFocused}
            handlers={handlers}
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
        onRefresh={onRefresh}
        refreshing={isRefreshing}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: REEL_THEME.black,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: REEL_THEME.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    marginTop: 12,
  },
  emptyTitle: {
    color: '#aaa',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    color: '#666',
    fontSize: 14,
    marginTop: 6,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: REEL_THEME.crimson,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ReelsFeedContainer;
