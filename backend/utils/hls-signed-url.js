import crypto from 'crypto';
import config from '../config/index.js';

function toSecureLinkDigest(value) {
  return crypto
    .createHash('md5')
    .update(value)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function getHlsEpisodePrefix(objectName) {
  const normalizedObjectName = String(objectName || '').replace(/^\/+/, '');
  const match = normalizedObjectName.match(/^(dramas\/[^/]+\/episodes\/[^/]+)\//);
  return match ? match[1] : null;
}

function getSignedHlsPath(objectName, expirySeconds = config.hls.signedUrlTtl) {
  if (!objectName) return null;

  const normalizedObjectName = String(objectName).replace(/^\/+/, '');
  const episodePrefix = getHlsEpisodePrefix(normalizedObjectName);
  if (!episodePrefix) return null;

  const expires = Math.floor(Date.now() / 1000) + expirySeconds;
  const signatureBase = `${expires}/${episodePrefix} ${config.hls.signingSecret}`;
  const signature = toSecureLinkDigest(signatureBase);

  return `/hls/${expires}/${signature}/${normalizedObjectName}`;
}

function getSignedEpisodeHlsPath(episode, expirySeconds) {
  if (!episode || episode.status !== 'ready' || !episode.hls_master_url) {
    return null;
  }

  return getSignedHlsPath(episode.hls_master_url, expirySeconds);
}

export { getSignedHlsPath, getSignedEpisodeHlsPath };
