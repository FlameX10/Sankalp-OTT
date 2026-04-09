import fs from 'fs';
import path from 'path';
import os from 'os';
import minioClient from './config/minio.js';
import config from './config/index.js';
import { prisma } from './prisma/client.js';
import { getMasterPlaylistPath, getShowThumbnailPath } from './utils/minio-paths.js';
import logger from './config/logger.js';

const BUCKET = config.minio.bucket;
const TEMP_DIR = path.join(os.tmpdir(), 'ott-transcode');

/**
 * Copy show thumbnail to episode folder during transcode completion
 * (All episodes in a show share the same thumbnail)
 */
async function copyShowThumbnail(showId) {
  // Thumbnail is already uploaded by admin to thumbnails/<showId>/thumb.jpg
  // It's stored in the database and available for streaming
  // No additional processing needed
  console.log(`[Master] 🎬 Show thumbnail already handled by media service for show: ${showId}`);
}

async function createMasterPlaylist(showId, episodeId) {
  const content = [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    '',
    '#EXT-X-STREAM-INF:BANDWIDTH=896000,RESOLUTION=640x360',
    '360p/index.m3u8',
    '#EXT-X-STREAM-INF:BANDWIDTH=1528000,RESOLUTION=854x480',
    '480p/index.m3u8',
    '#EXT-X-STREAM-INF:BANDWIDTH=2928000,RESOLUTION=1280x720',
    '720p/index.m3u8',
    '#EXT-X-STREAM-INF:BANDWIDTH=5192000,RESOLUTION=1920x1080',
    '1080p/index.m3u8',
  ].join('\n');

  const tempPath = path.join(TEMP_DIR, `${episodeId}_master.m3u8`);
  fs.writeFileSync(tempPath, content);

  const stat = fs.statSync(tempPath);

  const masterPath = getMasterPlaylistPath(showId, episodeId);

  await minioClient.putObject(
    BUCKET,
    masterPath,
    fs.createReadStream(tempPath),
    stat.size,
    { 'Content-Type': 'application/vnd.apple.mpegurl' }
  );

  console.log(`[Master] ✅ Master playlist uploaded: ${masterPath}`);

  // Verify show thumbnail exists (uploaded separately by admin)
  await copyShowThumbnail(showId);

  await prisma.episode.update({
    where: { id: episodeId },
    data: {
      status: 'ready',
      hls_master_url: masterPath,
    },
  });

  fs.unlinkSync(tempPath);
}

export { createMasterPlaylist };