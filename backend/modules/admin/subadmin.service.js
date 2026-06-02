import bcrypt from 'bcrypt';
import { prisma } from '../../prisma/client.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * SECTIONS available for sub-admin access
 */
export const AVAILABLE_SECTIONS = [
  'DASHBOARD',
  'USER_MANAGEMENT',
  'CONTENT',
  'CATEGORIES_TAGS',
  'BANNERS_POPUPS',
  'MEMBERSHIP_PLANS',
  'TOP_UP_PLANS',
  'COINS_WALLET',
  'NOTIFICATIONS',
  'ANALYTICS_REPORTS',
  'CMS_PAGES',
];

/**
 * Create a new sub-admin
 */
export async function createSubAdmin(email, password, name, sections = []) {
  if (!email || !email.includes('@')) {
    throw new ApiError(400, 'Invalid email address');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  if (!password || password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }

  if (!Array.isArray(sections)) {
    throw new ApiError(400, 'Sections must be an array');
  }

  const invalidSections = sections.filter(s => !AVAILABLE_SECTIONS.includes(s));
  if (invalidSections.length > 0) {
    throw new ApiError(400, `Invalid sections: ${invalidSections.join(', ')}`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const subAdmin = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'SUB_ADMIN',
        plan: 'FREE',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (sections.length > 0) {
      await tx.subAdminAccess.createMany({
        data: sections.map(section => ({
          user_id: newUser.id,
          section,
        })),
      });
    }

    return newUser;
  });

  return subAdmin;
}

/**
 * Get all sub-admins with their access sections
 */
export async function getAllSubAdmins() {
  const subAdmins = await prisma.user.findMany({
    where: { role: 'SUB_ADMIN' },
    select: {
      id: true,
      email: true,
      name: true,
      isBlocked: true,
      createdAt: true,
      sub_admin_access: {
        select: { section: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return subAdmins.map(sa => ({
    id: sa.id,
    email: sa.email,
    name: sa.name,
    status: sa.isBlocked ? 'Blocked' : 'Active',
    sections: sa.sub_admin_access.map(a => a.section),
    sectionCount: sa.sub_admin_access.length,
    createdAt: sa.createdAt.toISOString(),
  }));
}

/**
 * Get a specific sub-admin with all details
 */
export async function getSubAdminById(subAdminId) {
  const subAdmin = await prisma.user.findUnique({
    where: { id: subAdminId, role: 'SUB_ADMIN' },
    select: {
      id: true,
      email: true,
      name: true,
      isBlocked: true,
      createdAt: true,
      sub_admin_access: {
        select: { section: true },
      },
    },
  });

  if (!subAdmin) {
    throw new ApiError(404, 'Sub-admin not found');
  }

  return {
    id: subAdmin.id,
    email: subAdmin.email,
    name: subAdmin.name,
    status: subAdmin.isBlocked ? 'Blocked' : 'Active',
    sections: subAdmin.sub_admin_access.map(a => a.section),
    createdAt: subAdmin.createdAt.toISOString(),
  };
}

/**
 * Update sub-admin sections (grant/revoke access)
 */
export async function updateSubAdminSections(subAdminId, sections = []) {
  const subAdmin = await prisma.user.findUnique({
    where: { id: subAdminId, role: 'SUB_ADMIN' },
  });

  if (!subAdmin) {
    throw new ApiError(404, 'Sub-admin not found');
  }

  const invalidSections = sections.filter(s => !AVAILABLE_SECTIONS.includes(s));
  if (invalidSections.length > 0) {
    throw new ApiError(400, `Invalid sections: ${invalidSections.join(', ')}`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.subAdminAccess.deleteMany({
      where: { user_id: subAdminId },
    });

    if (sections.length > 0) {
      await tx.subAdminAccess.createMany({
        data: sections.map(section => ({
          user_id: subAdminId,
          section,
        })),
      });
    }

    return tx.user.findUnique({
      where: { id: subAdminId },
      select: {
        id: true,
        email: true,
        name: true,
        sub_admin_access: {
          select: { section: true },
        },
      },
    });
  });

  return {
    id: updated.id,
    email: updated.email,
    name: updated.name,
    sections: updated.sub_admin_access.map(a => a.section),
  };
}

/**
 * Update sub-admin name
 */
export async function updateSubAdminName(subAdminId, name) {
  if (!name || name.trim().length === 0) {
    throw new ApiError(400, 'Name cannot be empty');
  }

  const updated = await prisma.user.update({
    where: { id: subAdminId, role: 'SUB_ADMIN' },
    data: { name: name.trim() },
    select: {
      id: true,
      name: true,
    },
  });

  return updated;
}

/**
 * Reset sub-admin password
 */
export async function resetSubAdminPassword(subAdminId, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updated = await prisma.user.update({
    where: { id: subAdminId, role: 'SUB_ADMIN' },
    data: { password: hashedPassword },
    select: {
      id: true,
      email: true,
    },
  });

  return updated;
}

/**
 * Toggle sub-admin status (block/unblock)
 */
export async function toggleSubAdminStatus(subAdminId) {
  const subAdmin = await prisma.user.findUnique({
    where: { id: subAdminId, role: 'SUB_ADMIN' },
  });

  if (!subAdmin) {
    throw new ApiError(404, 'Sub-admin not found');
  }

  const updated = await prisma.user.update({
    where: { id: subAdminId },
    data: { isBlocked: !subAdmin.isBlocked },
    select: {
      id: true,
      isBlocked: true,
    },
  });

  return {
    id: updated.id,
    status: updated.isBlocked ? 'Blocked' : 'Active',
  };
}

/**
 * Delete sub-admin
 */
export async function deleteSubAdmin(subAdminId) {
  const subAdmin = await prisma.user.findUnique({
    where: { id: subAdminId, role: 'SUB_ADMIN' },
  });

  if (!subAdmin) {
    throw new ApiError(404, 'Sub-admin not found');
  }

  await prisma.$transaction(async (tx) => {
    await tx.subAdminAccess.deleteMany({
      where: { user_id: subAdminId },
    });

    await tx.user.delete({
      where: { id: subAdminId },
    });
  });

  return { id: subAdminId, message: 'Sub-admin deleted successfully' };
}

/**
 * Get available sections for dropdown/UI
 */
export function getAvailableSections() {
  return AVAILABLE_SECTIONS.map(section => ({
    value: section,
    label: formatSectionLabel(section),
  }));
}

/**
 * Format section name for display
 */
function formatSectionLabel(section) {
  return section
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
