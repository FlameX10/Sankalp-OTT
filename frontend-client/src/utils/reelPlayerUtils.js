/**
 * Utility functions for reel player - formatting, validation, etc.
 */

/**
 * Format large numbers for display (3.5M, 14.6K, etc.)
 */
export function formatCount(num) {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

/**
 * Format seconds to MM:SS format
 */
export function formatTime(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Calculate progress ratio (0 to 1)
 */
export function calculateProgress(currentTime, duration) {
  if (!duration || duration <= 0) return 0;
  return Math.min(1, Math.max(0, currentTime / duration));
}

/**
 * Calculate remaining time
 */
export function calculateRemaining(currentTime, duration) {
  return Math.max(0, duration - currentTime);
}

/**
 * Validate reel item has required fields
 */
export function isValidReelItem(item) {
  return (
    item &&
    typeof item === 'object' &&
    'episode_id' in item &&
    'show_title' in item &&
    'episode_num' in item
  );
}

/**
 * Validate video URL
 */
export function isValidStreamUrl(url) {
  return url && typeof url === 'string' && (url.startsWith('http') || url.startsWith('/'));
}

/**
 * Create tap guard to prevent rapid successive taps
 * Returns true if tap is valid (not throttled)
 */
export function createTapGuard(lastTapAtRef, minIntervalMs = 80) {
  return () => {
    const now = Date.now();
    if (now - lastTapAtRef.current < minIntervalMs) {
      return false;
    }
    lastTapAtRef.current = now;
    return true;
  };
}

/**
 * Theme colors - centralized for consistency
 */
export const REEL_THEME = {
  crimson: '#FF2D55',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.6)',
  black: '#000000',
  darkOverlay: '#0D0010',
  semiTransparentBlack: 'rgba(0,0,0,0.5)',
  semiTransparentDark: 'rgba(0,0,0,0.45)',
  borderMuted: 'rgba(255,255,255,0.1)',
  borderWeak: 'rgba(255,255,255,0.22)',
  bgWeak: 'rgba(255,255,255,0.15)',
  bgWeaker: 'rgba(255,255,255,0.12)',
  textWeak: 'rgba(255,255,255,0.9)',
  textWeaker: 'rgba(255,255,255,0.7)',
};

/**
 * Common dimensions
 */
export const REEL_DIMENSIONS = {
  PREFETCH_THRESHOLD: 3,
  TAP_GUARD_INTERVAL: 80,
  TIME_UPDATE_INTERVAL: 0.5,
};
