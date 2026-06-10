import { prisma } from '../../prisma/client.js';

async function checkEpisodeAccess(userId, isGuest, episodeId, isFree) {
  if (isFree) return { is_locked: false, lock_reason: null };

  if (isGuest || !userId) {
    return { is_locked: true, lock_reason: 'login_required' };
  }

  const membership = await prisma.userMembership.findFirst({
    where: {
      user_id: userId,
      status: 'ACTIVE',
      end_date: { gte: new Date() },
    },
  });
  if (membership) return { is_locked: false, lock_reason: null };

  const coinUnlock = await prisma.episodeAccess.findUnique({
    where: { idx_ea_user_ep: { user_id: userId, episode_id: episodeId } },
  });
  if (coinUnlock) return { is_locked: false, lock_reason: null };

  return { is_locked: true, lock_reason: 'coins_or_membership' };
}

export { checkEpisodeAccess };
