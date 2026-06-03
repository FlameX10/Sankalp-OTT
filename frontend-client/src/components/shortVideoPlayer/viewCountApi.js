import axios from 'axios';
import { API_BASE_URL } from '../../constants/config';
import * as authService from '../../services/authService';

// Dedicated instance for /api/user routes — same pattern as myListSlice and topUpApi.
// Token is injected per-call so it always uses the latest value from SecureStore.
const userApi = axios.create({
  baseURL: `${API_BASE_URL}/api/user`,
  headers: {
    'Content-Type': 'application/json',
    'x-client-type': authService.getClientType(),
  },
});

/**
 * recordView
 * Fires POST /api/user/shows/:showId/view once the 30s threshold is met.
 * Intentionally fire-and-forget — failures are logged but never surface to the user.
 *
 * @param {object} params
 * @param {string} params.showId
 * @param {string} params.sessionId        - UUID v4 generated at playback start
 * @param {string|null} params.episodeId
 * @param {number} params.watchDurationSec - cumulative active playback seconds
 * @param {string|null} params.accessToken - current Bearer token from Redux
 */
export async function recordView({ showId, sessionId, episodeId, watchDurationSec, accessToken }) {
  try {
    await userApi.post(
      `/shows/${showId}/view`,
      {
        session_id: sessionId,
        episode_id: episodeId ?? null,
        watch_duration_sec: Math.floor(watchDurationSec),
      },
      accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}
    );
    console.log(`✅ [viewCount] View recorded — show: ${showId}, session: ${sessionId}, duration: ${Math.floor(watchDurationSec)}s`);
  } catch (err) {
    console.warn(`⚠️ [viewCount] Failed to record view — show: ${showId}`, err?.response?.data || err?.message);
  }
}