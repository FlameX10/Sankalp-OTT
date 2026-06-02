import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import {
  createSubAdmin,
  getAllSubAdmins,
  getSubAdminById,
  updateSubAdminSections,
  resetSubAdminPassword,
  toggleSubAdminStatus,
  deleteSubAdmin,
  getAvailableSections,
} from './subadmin.service.js';

/**
 * POST /api/v1/admin/subadmins
 * Create a new sub-admin
 * Body: { email, password, name, sections: [] }
 */
export const createSubAdminHandler = asyncHandler(async (req, res) => {
  const { email, password, name, sections } = req.body;

  const newSubAdmin = await createSubAdmin(email, password, name, sections);

  return res.status(201).json(
    new ApiResponse(201, newSubAdmin, 'Sub-admin created successfully')
  );
});

/**
 * GET /api/v1/admin/subadmins
 * Get all sub-admins
 */
export const getAllSubAdminsHandler = asyncHandler(async (req, res) => {
  const subAdmins = await getAllSubAdmins();

  return res.json(
    new ApiResponse(200, { subAdmins, total: subAdmins.length }, 'Sub-admins fetched successfully')
  );
});

/**
 * GET /api/v1/admin/subadmins/:subAdminId
 * Get a specific sub-admin
 */
export const getSubAdminHandler = asyncHandler(async (req, res) => {
  const { subAdminId } = req.params;

  const subAdmin = await getSubAdminById(subAdminId);

  return res.json(
    new ApiResponse(200, subAdmin, 'Sub-admin fetched successfully')
  );
});

/**
 * PATCH /api/v1/admin/subadmins/:subAdminId/sections
 * Update sub-admin sections
 * Body: { sections: [] }
 */
export const updateSubAdminSectionsHandler = asyncHandler(async (req, res) => {
  const { subAdminId } = req.params;
  const { sections } = req.body;

  const updated = await updateSubAdminSections(subAdminId, sections);

  return res.json(
    new ApiResponse(200, updated, 'Sub-admin sections updated successfully')
  );
});

/**
 * PATCH /api/v1/admin/subadmins/:subAdminId/password
 * Reset sub-admin password
 * Body: { newPassword }
 */
export const resetPasswordHandler = asyncHandler(async (req, res) => {
  const { subAdminId } = req.params;
  const { newPassword } = req.body;

  const updated = await resetSubAdminPassword(subAdminId, newPassword);

  return res.json(
    new ApiResponse(200, updated, 'Password reset successfully')
  );
});

/**
 * PATCH /api/v1/admin/subadmins/:subAdminId/status
 * Toggle sub-admin status
 */
export const toggleStatusHandler = asyncHandler(async (req, res) => {
  const { subAdminId } = req.params;

  const updated = await toggleSubAdminStatus(subAdminId);

  return res.json(
    new ApiResponse(200, updated, `Sub-admin ${updated.status.toLowerCase()} successfully`)
  );
});

/**
 * DELETE /api/v1/admin/subadmins/:subAdminId
 * Delete sub-admin
 */
export const deleteSubAdminHandler = asyncHandler(async (req, res) => {
  const { subAdminId } = req.params;

  const result = await deleteSubAdmin(subAdminId);

  return res.json(
    new ApiResponse(200, result, 'Sub-admin deleted successfully')
  );
});

/**
 * GET /api/v1/admin/subadmins/sections/available
 * Get list of available sections
 */
export const getAvailableSectionsHandler = asyncHandler(async (req, res) => {
  const sections = getAvailableSections();

  return res.json(
    new ApiResponse(200, { sections }, 'Available sections fetched successfully')
  );
});
