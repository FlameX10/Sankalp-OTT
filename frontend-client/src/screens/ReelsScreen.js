import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import CoinIcon from '../components/CoinIcon';
import DramaDetailsSheetConnected from '../components/DramaDetailsSheetConnected';
import { ROUTES } from '../constants/routes';
import { theme } from '../constants/theme';
import { clearPendingHomeBanner } from '../redux/slices/promoFlowSlice';
import { API_BASE_URL } from '../constants/config';
import { initShowPlayer } from '../redux/slices/showPlayerSlice';
import {
  clearHomeDramaSheetSession,
  selectHomeDramaSheetSession,
  selectHomeReopenSheetAfterPlayer,
  setHomeDramaSheetSession,
  setHomeReopenSheetAfterPlayer,
} from '../redux/slices/reelsSlice';

function selectPendingHomeBanner(state) {
  return state.promoFlow?.pendingHomeBanner;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - 32) / 3;

function formatViews(viewCount) {
  if (typeof viewCount !== 'number' || Number.isNaN(viewCount)) return '0';
  if (viewCount >= 1_000_000) return `${(viewCount / 1_000_000).toFixed(1)}M`;
  if (viewCount >= 1_000) return `${(viewCount / 1_000).toFixed(1)}K`;
  return String(viewCount);
}

const DramaCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.cardContainer} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.imageWrapper}>
      <Image
        style={styles.posterImage}
        source={{ uri: item.thumbnail_url }}
        resizeMode="cover"
      />
      {item.tag && (
        <View style={[styles.statusTag, { backgroundColor: item.tag === 'Hot' ? '#FF2D55' : '#7B2FFF' }]}>
          <Text style={styles.tagText}>{item.tag}</Text>
        </View>
      )}
      <View style={styles.viewCountContainer}>
        <Ionicons name="play" size={10} color="#fff" />
        <Text style={styles.viewCountText}>
          {formatViews(item.view_count || item.views)}
        </Text>
      </View>
    </View>
    <Text style={styles.dramaTitle} numberOfLines={2}>{item.title}</Text>
    <Text style={styles.categoryText}>{item.category_name || item.category}</Text>
  </TouchableOpacity>
);

export default function PopularScreen() {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth?.accessToken);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [selected, setSelected] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetInitialTab, setSheetInitialTab] = useState('synopsis');
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(null);
  const [showDetailsLoading, setShowDetailsLoading] = useState(false);
  const [showDetailsError, setShowDetailsError] = useState(null);
  const homeSession = useSelector(selectHomeDramaSheetSession);
  const reopenHomeSheet = useSelector(selectHomeReopenSheetAfterPlayer);
  const [dramaSheetKey, setDramaSheetKey] = useState(0);
  const pendingHomeBanner = useSelector(selectPendingHomeBanner);

  const goToEarnRewards = () => {
    navigation.navigate(ROUTES.PROFILE, {
      screen: ROUTES.EARN_REWARDS,
      params: { backToHome: true },
    });
  };

  // 1. Load Categories
  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/content/categories`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        const activeCats = list
          .filter((c) => c && c.is_active !== false)
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .map((c) => ({ id: c.id, name: c.name }));

        if (!cancelled) {
          // Default view: show ALL dramas, then filter when a category is selected
          setTabs([{ id: null, name: 'All' }, ...activeCats]);
          setActiveTab(null);
        }
      } catch (e) {
        console.error("Category Load Error:", e);
        if (!cancelled) {
          setTabs([{ id: null, name: 'All' }]);
          setActiveTab(null);
        }
      }
    }
    loadCategories();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadTags() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/content/tags`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        if (!cancelled) {
          setAllTags(
            list
              .filter((tag) => tag?.name)
              .sort((a, b) => a.name.localeCompare(b.name))
          );
        }
      } catch (e) {
        console.error('Tags Load Error:', e);
        if (!cancelled) setAllTags([]);
      }
    }
    loadTags();
    return () => { cancelled = true; };
  }, []);

  const effectiveSearch = useMemo(() => {
    if (selectedTags.length > 0) return selectedTags.join(' ');
    return searchQuery.trim();
  }, [selectedTags, searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSelectedTags([]);
    setSearchFocused(false);
  }, []);

  const removeTag = useCallback((tagName) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== tagName));
  }, []);

  const handleSearchTextChange = useCallback((text) => {
    setSearchQuery(text);
    if (text.trim()) setSelectedTags([]);
  }, []);

  const toggleTag = useCallback((tagName) => {
    setSelectedTags((prev) => (
      prev.includes(tagName)
        ? prev.filter((tag) => tag !== tagName)
        : [...prev, tagName]
    ));
    setSearchQuery('');
  }, []);

  const loadShows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', 'Published');
      if (activeTab) params.set('category_id', activeTab);
      params.set('page', '1');
      params.set('limit', '60');
      if (effectiveSearch) params.set('search', effectiveSearch);

      const res = await fetch(`${API_BASE_URL}/api/content/shows?${params.toString()}`);
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      setShows(items.filter((s) => s.status === 'Published'));
    } catch (e) {
      setShows([]);
      console.error('Shows Load Error:', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, effectiveSearch]);

  useEffect(() => {
    loadShows();
  }, [loadShows]);

  useFocusEffect(
    useCallback(() => {
      loadShows();
    }, [loadShows])
  );

  // Re-open drama sheet after returning from ShowPlayer (back, gesture, title, episodes)
  useFocusEffect(
    useCallback(() => {
      if (!reopenHomeSheet || !homeSession?.selectedItem) return;
      dispatch(setHomeReopenSheetAfterPlayer(false));
      const { selectedItem, initialTab } = homeSession;
      setDramaSheetKey((k) => k + 1);
      setSelected(selectedItem);
      setSheetInitialTab(initialTab || 'synopsis');
      setSheetVisible(true);
      fetchShowDetails(selectedItem.show_id, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, reopenHomeSheet, homeSession])
  );

  const fetchShowDetails = async (showId, fromEp = 1) => {
    setShowDetailsLoading(true);
    setShowDetailsError(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      const res = await fetch(`${API_BASE_URL}/api/feed/show/${showId}?from_ep=${fromEp}&limit=30`, {
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Failed to load episodes: ${res.status}`);
      setShowDetails(data);
    } catch (e) {
      setShowDetails(null);
      setShowDetailsError(e?.message || 'Failed to load episodes');
    } finally {
      setShowDetailsLoading(false);
    }
  };

  const openDetails = useCallback(
    (item, initialTab = 'synopsis') => {
      setDramaSheetKey((k) => k + 1);
      const showId = item.id ?? item.show_id;
      const selectedItem = {
        ...item,
        show_id: showId,
        show_title: item.title ?? item.show_title,
        title: item.title ?? item.show_title,
        episode_num: 1,
        total_episodes: item.episode_count || item.total_episodes || 0,
      };
      setSelected(selectedItem);
      setSheetInitialTab(initialTab);
      setSheetVisible(true);
      dispatch(setHomeDramaSheetSession({ selectedItem, initialTab }));
      fetchShowDetails(showId, 1);
    },
    [dispatch, accessToken]
  );

  const handleRelatedPress = useCallback(
    (relatedItem) => {
      openDetails({
        id: relatedItem.id,
        title: relatedItem.title,
        thumbnail_url: relatedItem.thumbnail_url,
        category: relatedItem.category,
        category_name: relatedItem.category,
        view_count: relatedItem.view_count,
        tags: relatedItem.tags,
        episode_count: relatedItem.episode_count,
      });
    },
    [openDetails]
  );

  useEffect(() => {
    if (!pendingHomeBanner || !isFocused) return;
    openDetails({
      id: pendingHomeBanner.id,
      title: pendingHomeBanner.title,
      thumbnail_url: pendingHomeBanner.thumbnail_url,
      category_name: '',
      view_count: 0,
    });
    dispatch(clearPendingHomeBanner());
  }, [pendingHomeBanner, isFocused, openDetails, dispatch]);

  const handleRangeChange = (fromEp) => {
    if (!selected?.show_id) return;
    fetchShowDetails(selected.show_id, fromEp);
  };

  const handleEpisodePress = (episode) => {
    if (!selected || !showDetails) return;
    if (episode.status !== 'ready' && !episode.is_locked) return;

    dispatch(
      setHomeDramaSheetSession({
        selectedItem: selected,
        initialTab: sheetInitialTab,
      })
    );

    dispatch(
      initShowPlayer({
        showId: showDetails.show_id,
        showTitle: showDetails.show_title || selected.show_title,
        thumbnailUrl: showDetails.thumbnail_url || selected.thumbnail_url,
        totalEpisodes: showDetails.total_episodes || selected.total_episodes || 0,
        seedEpisodes: showDetails.episodes || [],
        startEpisodeNum: episode?.episode_num || 1,
        streamBase: API_BASE_URL,
      })
    );

    setSheetVisible(false);
    navigation.navigate(ROUTES.SHOW_PLAYER, { fromHome: true });
  };

  const handleCloseSheet = () => {
    const returnToPlayer = homeSession?.returnToPlayer;
    dispatch(setHomeReopenSheetAfterPlayer(false));
    setSheetVisible(false);
    setSelected(null);
    setShowDetails(null);
    setShowDetailsError(null);
    dispatch(clearHomeDramaSheetSession());

    if (returnToPlayer) {
      navigation.navigate(ROUTES.SHOW_PLAYER, { fromHome: true });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <View
        style={styles.header}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <View style={styles.searchColumn}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.searchInnerScroll}
              contentContainerStyle={styles.searchInnerContent}
              keyboardShouldPersistTaps="handled"
            >
              {selectedTags.map((tag) => (
                <View key={tag} style={styles.searchTagChip}>
                  <Text style={styles.searchTagChipText} numberOfLines={1}>
                    {tag}
                  </Text>
                  <TouchableOpacity onPress={() => removeTag(tag)} hitSlop={6}>
                    <Ionicons name="close" size={11} color={theme.white} />
                  </TouchableOpacity>
                </View>
              ))}
              <TextInput
                style={[
                  styles.searchInput,
                  selectedTags.length > 0 && styles.searchInputCompact,
                ]}
                placeholder={selectedTags.length > 0 ? '' : 'Search dramas or tags...'}
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={handleSearchTextChange}
                onFocus={() => setSearchFocused(true)}
              />
            </ScrollView>
            {(selectedTags.length > 0 || searchQuery.length > 0) && (
              <TouchableOpacity onPress={clearSearch} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {searchFocused && (
            <View style={styles.tagDropdown}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                style={styles.tagDropdownScroll}
              >
                <View style={styles.tagSearchWrap}>
                  {allTags.length === 0 ? (
                    <Text style={styles.tagSearchEmpty}>No tags available</Text>
                  ) : (
                    allTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.name);
                      return (
                        <TouchableOpacity
                          key={tag.id}
                          style={[
                            styles.tagSearchItem,
                            isSelected && styles.tagSearchItemActive,
                          ]}
                          onPress={() => toggleTag(tag.name)}
                        >
                          <Text
                            style={[
                              styles.tagSearchItemText,
                              isSelected && styles.tagSearchItemTextActive,
                            ]}
                          >
                            {tag.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate(ROUTES.PROFILE, {
                screen: ROUTES.MEMBERSHIP,
                params: { backToHome: true },
              })
            }
          >
            <FontAwesome6 name="crown" size={22} color="#FFD700" />
          </TouchableOpacity>
          <TouchableOpacity onPress={goToEarnRewards} hitSlop={8}>
            <Ionicons name="gift" size={24} color="#FFD700" />
          </TouchableOpacity>
        </View>
      </View>

      {searchFocused && (
        <Pressable
          style={[styles.tagSearchBackdrop, { top: headerHeight }]}
          onPress={() => setSearchFocused(false)}
        />
      )}

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          {tabs.map((tab) => (
            <TouchableOpacity key={tab.id ?? 'all'} onPress={() => setActiveTab(tab.id)}>
              <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && shows.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF2D55" />
        </View>
      ) : (
        <FlatList
          data={shows}
          renderItem={({ item }) => <DramaCard item={item} onPress={() => openDetails(item)} />}
          keyExtractor={item => item.id.toString()}
          numColumns={3}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No dramas found in this category.</Text>
          }
        />
      )}

      <DramaDetailsSheetConnected
        key={`drama-${dramaSheetKey}-${selected?.show_id ?? 'none'}`}
        visible={isFocused && sheetVisible}
        item={selected}
        details={selected?.show_id === showDetails?.show_id ? showDetails : null}
        loading={showDetailsLoading}
        error={showDetailsError}
        initialTab={sheetInitialTab}
        onRangeChange={handleRangeChange}
        onEpisodePress={handleEpisodePress}
        onRelatedPress={handleRelatedPress}
        onClose={handleCloseSheet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    zIndex: 110,
  },
  searchColumn: {
    flex: 1,
    zIndex: 111,
  },
  searchBar: {
    height: 40,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInnerScroll: {
    flex: 1,
  },
  searchInnerContent: {
    alignItems: 'center',
    flexGrow: 1,
    paddingRight: 4,
  },
  searchInput: {
    flexGrow: 1,
    minWidth: 120,
    color: '#FFF',
    fontSize: 14,
    height: 40,
    padding: 0,
  },
  searchInputCompact: {
    minWidth: 48,
    flexGrow: 0,
  },
  searchTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.crimson,
    borderRadius: 14,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
    marginRight: 6,
    maxWidth: 140,
  },
  searchTagChipText: {
    color: theme.white,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  tagDropdown: {
    paddingTop: 6,
    paddingBottom: 2,
    backgroundColor: 'transparent',
  },
  tagDropdownScroll: {
    maxHeight: 200,
  },
  tagSearchBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
  },
  tagSearchWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagSearchItem: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  tagSearchItemActive: {
    backgroundColor: 'rgba(255, 45, 85, 0.9)',
    borderColor: theme.crimson,
  },
  tagSearchItemText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontWeight: '600',
  },
  tagSearchItemTextActive: {
    color: theme.white,
  },
  tagSearchEmpty: {
    color: theme.gray,
    fontSize: 13,
    paddingVertical: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    height: 40,
    paddingTop: 2,
  },
  tabContainer: { paddingHorizontal: 16, paddingVertical: 15 },
  tabScrollContent: { flexDirection: 'row', gap: 20 },
  tabText: { color: '#999', fontSize: 16, fontWeight: '600' },
  activeTabText: { color: '#FFF', fontSize: 18, borderBottomWidth: 2, borderBottomColor: '#FFF' },
  listContent: { paddingHorizontal: 8, paddingBottom: 20 },
  columnWrapper: { justifyContent: 'flex-start', gap: 8, marginBottom: 15 },
  cardContainer: { width: COLUMN_WIDTH },
  imageWrapper: { width: '100%', aspectRatio: 0.7, borderRadius: 4, overflow: 'hidden', backgroundColor: '#1A1A1A', position: 'relative' },
  posterImage: { width: '100%', height: '100%' },
  statusTag: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 6, paddingVertical: 2, borderBottomLeftRadius: 4 },
  tagText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  viewCountContainer: { position: 'absolute', bottom: 5, right: 5, flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewCountText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  dramaTitle: { color: '#FFF', fontSize: 13, marginTop: 8, fontWeight: '500', lineHeight: 18 },
  categoryText: { color: '#666', fontSize: 11, marginTop: 4 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 50, fontSize: 16 },
});
