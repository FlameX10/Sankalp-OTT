import express from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireAdmin } from '../../middleware/admin.middleware.js';
import {
  createSubAdminHandler,
  getAllSubAdminsHandler,
  getSubAdminHandler,
  updateSubAdminSectionsHandler,
  resetPasswordHandler,
  toggleStatusHandler,
  deleteSubAdminHandler,
  getAvailableSectionsHandler,
} from './subadmin.controller.js';

const router = express.Router();

/**
 * All sub-admin management routes require authentication and ADMIN role (not sub-admin)
 * Only super admins can manage sub-admins
 */
router.use(requireAuth);
router.use((req, res, next) => {
  // Check if user is ADMIN role (not SUB_ADMIN)
  if (req.admin?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only main admins can manage sub-admins' });
  }
  next();
});

// GET available sections (can be called by both admin and sub-admin to show options)
router.get('/sections/available', getAvailableSectionsHandler);

// GET all sub-admins
router.get('/', getAllSubAdminsHandler);

// POST create sub-admin
router.post('/', createSubAdminHandler);

// GET specific sub-admin
router.get('/:subAdminId', getSubAdminHandler);

// PATCH update sub-admin sections
router.patch('/:subAdminId/sections', updateSubAdminSectionsHandler);

// PATCH reset sub-admin password
router.patch('/:subAdminId/password', resetPasswordHandler);

// PATCH toggle sub-admin status
router.patch('/:subAdminId/status', toggleStatusHandler);

// DELETE sub-admin
router.delete('/:subAdminId', deleteSubAdminHandler);

export default router;
