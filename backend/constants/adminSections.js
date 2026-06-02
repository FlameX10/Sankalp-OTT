/**
 * Admin panel permission keys — aligned with frontend nav page IDs.
 * Stored in sub_admin_access.section.
 */
export const ADMIN_SECTIONS = [
  'dashboard',
  'users',
  'dramas',
  'categories',
  'banners',
  'membership',
  'topup',
  'coins',
  'notifications',
  'analytics',
  'roles',
  'cms',
];

/** Dashboard is always granted to sub-admins */
export const DEFAULT_SUB_ADMIN_SECTIONS = ['dashboard'];

export const SECTION_LABELS = {
  dashboard: 'Dashboard',
  users: 'User Management',
  dramas: 'Drama / Content',
  categories: 'Categories & Tags',
  banners: 'Banners & Popups',
  membership: 'Membership Plans',
  topup: 'Top-Up Plans',
  coins: 'Coins & Wallet',
  notifications: 'Notifications',
  analytics: 'Analytics & Reports',
  roles: 'Roles & Permissions',
  cms: 'CMS Pages',
};

export function isValidSection(section) {
  return ADMIN_SECTIONS.includes(section);
}

export function normalizeSections(sections) {
  // Sub-admins cannot be granted roles management (main admin only)
  const unique = [...new Set(sections.filter((s) => isValidSection(s) && s !== 'roles'))];
  if (!unique.includes('dashboard')) unique.unshift('dashboard');
  return unique;
}

/** Map DB role enum to frontend role string */
export function toFrontendRole(role) {
  if (role === 'ADMIN') return 'admin';
  if (role === 'SUB_ADMIN') return 'sub_admin';
  return 'user';
}
