import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useShortVideoPlayback
 * Migrated from expo-video → react-native-video v6
 *
 * Optional params
 * ───────────────
 * onProgressUpdate(progressSec) – called every 15 seconds of actual playback.
 *   Use this to persist watch progress (e.g. upsertWatchHistory).
 *   Only fires when the video is actually playing (not paused, not locked).
 */
export default function useShortVideoPlayback({
  streamUrl,
  isActive,
  isFocused,
  isLocked,
  itemKey,
  initialDuration = 0,
  onProgressUpdate = null,
}) {
  const lastTapAtRef = useRef(0);
  const videoRef = useRef(null);
  const lastProgressUpdateRef = useRef(0); // tracks last progress_sec we reported
  const pendingSeekRef = useRef(null);
  const currentTimeRef = useRef(0);

  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration);

  const paused = !isActive || !isFocused || manuallyPaused || isLocked || !streamUrl;

  // Reset state whenever the item changes
  useEffect(() => {
    setFirstFrameReady(false);
    setCurrentTime(0);
    currentTimeRef.current = 0;
    setManuallyPaused(false);
    setDuration(initialDuration);
    lastProgressUpdateRef.current = 0; // reset progress tracker on item change
    pendingSeekRef.current = null;
  }, [initialDuration, itemKey]);

  const onLoad = useCallback((data) => {
    console.log(`✅ [useShortVideoPlayback] Video loaded - itemKey: ${itemKey}, duration: ${data.duration}s`);
    if (data.duration > 0) {
      setDuration(data.duration);
    }
  }, [itemKey]);

  const onProgress = useCallback((data) => {
    const nextTime = data.currentTime || 0;
    const pendingSeek = pendingSeekRef.current;
    if (pendingSeek) {
      const elapsedMs = Date.now() - pendingSeek.startedAt;
      const seekingForward = pendingSeek.time >= pendingSeek.previousTime;
      const reachedTarget = seekingForward
        ? nextTime >= pendingSeek.time - 0.75
        : nextTime <= pendingSeek.time + 0.75;

      if (!reachedTarget && elapsedMs < 3000) {
        return;
      }

      pendingSeekRef.current = null;
    }

    const knownDuration = data.seekableDuration || duration;
    const previousTime = currentTimeRef.current;
    const loopedToStart = knownDuration > 0 && previousTime > knownDuration - 1 && nextTime < 1.5;
    const tinyBackwardJitter = nextTime + 0.35 < previousTime;

    if (tinyBackwardJitter && !loopedToStart) {
      return;
    }

    currentTimeRef.current = nextTime;
    setCurrentTime(nextTime);

    if (duration === 0 && data.seekableDuration > 0) {
      setDuration(data.seekableDuration);
    }

    // Fire onProgressUpdate every 15 seconds while actually playing
    if (
      onProgressUpdate &&
      !paused &&
      data.currentTime - lastProgressUpdateRef.current >= 15
    ) {
      lastProgressUpdateRef.current = data.currentTime;
      console.log(`⏱️ Progress update: ${Math.floor(data.currentTime)}s / ${Math.floor(data.seekableDuration)}s`);
      onProgressUpdate(Math.floor(data.currentTime));
    }
  }, [duration, onProgressUpdate, paused]);

  const onReadyForDisplay = useCallback(() => {
    console.log(`🎬 [useShortVideoPlayback] First frame ready, itemKey: ${itemKey}`);
    setFirstFrameReady(true);
  }, [itemKey]);

  const togglePlayback = useCallback(() => {
    if (isLocked || !isActive) return;

    const now = Date.now();
    if (now - lastTapAtRef.current < 80) return;
    lastTapAtRef.current = now;

    setManuallyPaused((prev) => !prev);
  }, [isActive, isLocked]);

  /** Explicit play/pause for overlay controls (avoids double-tap debounce). */
  const setManualPaused = useCallback(
    (nextPaused) => {
      if (isLocked || !isActive) return;
      setManuallyPaused(!!nextPaused);
    },
    [isActive, isLocked]
  );

  const seekTo = useCallback((time) => {
    if (!videoRef.current) return;
    pendingSeekRef.current = {
      time,
      previousTime: currentTimeRef.current,
      startedAt: Date.now(),
    };
    videoRef.current.seek(time);
    currentTimeRef.current = time;
    setCurrentTime(time);
  }, []);

  return {
    videoRef,
    paused,
    currentTime,
    duration,
    firstFrameReady,
    manuallyPaused,
    togglePlayback,
    setManualPaused,
    seekTo,
    onLoad,
    onProgress,
    onReadyForDisplay,
    setFirstFrameReady,
  };
}
