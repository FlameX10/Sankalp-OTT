import React from 'react';
import { FlatList, StyleSheet, Text, View, Pressable, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const MOCK_SAVED = [
  {
    id: '1',
    title: 'The Dark Knight',
    duration: '24:15',
    category: 'Action',
    image: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  },
  {
    id: '2',
    title: 'Inception',
    duration: '18:40',
    category: 'Sci-Fi',
    image: 'https://image.tmdb.org/t/p/w500/8h58cHFA1FZ2sVbZ1yGQyF3I8h.jpg',
  },
  {
    id: '3',
    title: 'Interstellar',
    duration: '12:05',
    category: 'Drama',
    image: 'https://image.tmdb.org/t/p/w500/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg',
  },
  {
    id: '4',
    title: 'Avengers: Endgame',
    duration: '30:20',
    category: 'Action',
    image: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
  },
  {
    id: '5',
    title: 'Joker',
    duration: '16:45',
    category: 'Thriller',
    image: 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
  },
  {
    id: '6',
    title: 'Titanic',
    duration: '22:10',
    category: 'Romance',
    image: 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg',
  },
  {
    id: '7',
    title: 'Spider-Man: No Way Home',
    duration: '19:55',
    category: 'Action',
    image: 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
  },
  {
    id: '8',
    title: 'Doctor Strange',
    duration: '14:30',
    category: 'Fantasy',
    image: 'https://image.tmdb.org/t/p/w500/uGBVj3bEbCoZbDjjl9wTxcygko1.jpg',
  },
  {
    id: '9',
    title: 'The Matrix',
    duration: '21:00',
    category: 'Sci-Fi',
    image: 'https://image.tmdb.org/t/p/w500/aOIuZAjPaRIE6CMzbazvcHuHXDc.jpg',
  },
];

export default function MyListScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My List</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{MOCK_SAVED.length} Videos</Text>
        </View>
      </View>
      
      <Text style={styles.subtitle}>Continue watching your favorite series</Text>

      <FlatList
        data={MOCK_SAVED}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [
            styles.card,
            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
          ]}>
            
            {/* 🔥 Thumbnail with Image */}
            <View style={styles.thumbnail}>
              <Image source={{ uri: item.image }} style={styles.image} />

              <View style={styles.playOverlay}>
                <Ionicons name="play" size={20} color={theme.white} />
              </View>

              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{item.duration}</Text>
              </View>
            </View>

            {/* Content Info */}
            <View style={styles.cardInfo}>
              <View>
                <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              
              <View style={styles.cardFooter}>
                <View style={styles.actionBtn}>
                  <Ionicons name="share-social-outline" size={18} color={theme.gray} />
                </View>
                <View style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={18} color={theme.crimson} />
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.deepBlack,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: theme.white,
    fontSize: 28,
    fontWeight: '800',
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countText: {
    color: theme.gray,
    fontSize: 12,
  },
  subtitle: {
    color: theme.gray,
    fontSize: 14,
    marginBottom: 24,
  },
  list: {
    gap: 16,
    paddingBottom: 30,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 16,
    overflow: 'hidden',
    height: 100,
  },
  thumbnail: {
    width: 140,
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  playOverlay: {
    position: 'absolute',
    top: '35%',
    left: '35%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  durationText: {
    color: theme.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  categoryText: {
    color: theme.crimson,
    fontSize: 10,
    fontWeight: '800',
  },
  cardTitle: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
  },
});