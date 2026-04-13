/**
 * Redux slice for generic reel player state
 * Manages: current index, manual pause state, play state per episode
 * Independent of data source - works with any reel data
 */

import { createSlice } from '@reduxjs/toolkit';

const reelPlayerSlice = createSlice({
  name: 'reelPlayer',
  initialState: {
    // Multiple player instances identified by playerId
    players: {
      // [playerId]: {
      //   currentIndex: number,
      //   manuallyPausedIndices: Set<number>, // episodeIds that were manually paused
      //   playState: { [episodeId]: { currentTime, manuallyPaused } }
      // }
    },
  },
  reducers: {
    /**
     * Initialize or reset a player instance
     */
    initializePlayer(state, action) {
      const { playerId } = action.payload;
      if (!state.players[playerId]) {
        state.players[playerId] = {
          currentIndex: 0,
          manuallyPausedIndices: new Set(),
          playState: {},
        };
      }
    },

    /**
     * Update current index (which reel is visible)
     */
    setCurrentIndex(state, action) {
      const { playerId, index } = action.payload;
      if (!state.players[playerId]) {
        state.players[playerId] = { currentIndex: 0, manuallyPausedIndices: new Set(), playState: {} };
      }
      state.players[playerId].currentIndex = index;
    },

    /**
     * Set manual pause state for an episode
     */
    setEpisodePausedState(state, action) {
      const { playerId, episodeId, isPaused } = action.payload;
      if (!state.players[playerId]) {
        state.players[playerId] = { currentIndex: 0, manuallyPausedIndices: new Set(), playState: {} };
      }
      
      if (!state.players[playerId].playState[episodeId]) {
        state.players[playerId].playState[episodeId] = { currentTime: 0, manuallyPaused: false };
      }
      
      state.players[playerId].playState[episodeId].manuallyPaused = isPaused;
      
      if (isPaused) {
        state.players[playerId].manuallyPausedIndices.add(episodeId);
      } else {
        state.players[playerId].manuallyPausedIndices.delete(episodeId);
      }
    },

    /**
     * Update play progress for an episode
     */
    updateEpisodeProgress(state, action) {
      const { playerId, episodeId, currentTime } = action.payload;
      if (!state.players[playerId]) {
        state.players[playerId] = { currentIndex: 0, manuallyPausedIndices: new Set(), playState: {} };
      }
      
      if (!state.players[playerId].playState[episodeId]) {
        state.players[playerId].playState[episodeId] = { currentTime: 0, manuallyPaused: false };
      }
      
      state.players[playerId].playState[episodeId].currentTime = currentTime;
    },

    /**
     * Reset episode state (when scrolling away or episode changes)
     */
    resetEpisodeState(state, action) {
      const { playerId, episodeId } = action.payload;
      if (state.players[playerId]?.playState[episodeId]) {
        state.players[playerId].playState[episodeId] = { currentTime: 0, manuallyPaused: false };
        state.players[playerId].manuallyPausedIndices.delete(episodeId);
      }
    },

    /**
     * Reset entire player state
     */
    resetPlayer(state, action) {
      const { playerId } = action.payload;
      if (state.players[playerId]) {
        state.players[playerId] = {
          currentIndex: 0,
          manuallyPausedIndices: new Set(),
          playState: {},
        };
      }
    },

    /**
     * Remove player instance (when component unmounts)
     */
    removePlayer(state, action) {
      const { playerId } = action.payload;
      delete state.players[playerId];
    },
  },
});

export const {
  initializePlayer,
  setCurrentIndex,
  setEpisodePausedState,
  updateEpisodeProgress,
  resetEpisodeState,
  resetPlayer,
  removePlayer,
} = reelPlayerSlice.actions;

export default reelPlayerSlice.reducer;

// Selectors
export const selectPlayerState = (state, playerId) => state.reelPlayer.players[playerId];
export const selectCurrentIndex = (state, playerId) => state.reelPlayer.players[playerId]?.currentIndex ?? 0;
export const selectEpisodeState = (state, playerId, episodeId) => state.reelPlayer.players[playerId]?.playState[episodeId] ?? { currentTime: 0, manuallyPaused: false };
export const selectManuallyPausedIndices = (state, playerId) => state.reelPlayer.players[playerId]?.manuallyPausedIndices ?? new Set();
