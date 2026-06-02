import React, { useState, useEffect } from 'react';
import { subAdminApi } from '../services/api.js';

export default function SubAdmins() {
  const [subAdmins, setSubAdmins] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editingSubAdmin, setEditingSubAdmin] = useState(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    sections: [],
  });

  useEffect(() => {
    fetchSubAdmins();
    fetchAvailableSections();
  }, []);

  const fetchSubAdmins = async () => {
    try {
      setLoading(true);
      const response = await subAdminApi.getAll();
      setSubAdmins(response.data.data.subAdmins || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch sub-admins');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSections = async () => {
    try {
      const response = await subAdminApi.getSections();
      setAvailableSections(response.data.data.sections || []);
    } catch (err) {
      console.error('Failed to fetch sections:', err);
    }
  };

  const handleOpenModal = (subAdmin = null) => {
    if (subAdmin) {
      setEditingSubAdmin(subAdmin);
      setFormData({
        email: subAdmin.email,
        password: '',
        name: subAdmin.name,
        sections: subAdmin.sections || [],
      });
    } else {
      setEditingSubAdmin(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        sections: [],
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSubAdmin(null);
    setFormData({ email: '', password: '', name: '', sections: [] });
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        sections: checked
          ? [...prev.sections, value]
          : prev.sections.filter(s => s !== value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveSubAdmin = async (e) => {
    e.preventDefault();
    try {
      if (editingSubAdmin) {
        if (formData.sections.length > 0) {
          await subAdminApi.updateSections(editingSubAdmin.id, formData.sections);
        }
        if (formData.password) {
          await subAdminApi.resetPassword(editingSubAdmin.id, formData.password);
        }
      } else {
        if (!formData.email || !formData.password || !formData.name) {
          setError('Email, password, and name are required');
          return;
        }
        await subAdminApi.create(formData);
      }
      handleCloseModal();
      fetchSubAdmins();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save sub-admin');
    }
  };

  const handleToggleStatus = (subAdminId, currentStatus) => {
    setConfirmAction({
      type: 'toggle',
      id: subAdminId,
      message: `Are you sure you want to ${currentStatus === 'Active' ? 'block' : 'unblock'} this sub-admin?`
    });
    setShowConfirmDialog(true);
  };

  const handleDeleteSubAdmin = (subAdminId, name) => {
    setConfirmAction({
      type: 'delete',
      id: subAdminId,
      message: `Are you sure you want to delete sub-admin "${name}"? This action cannot be undone.`
    });
    setShowConfirmDialog(true);
  };

  const confirmDialogAction = async () => {
    try {
      if (confirmAction.type === 'toggle') {
        await subAdminApi.toggleStatus(confirmAction.id);
      } else if (confirmAction.type === 'delete') {
        await subAdminApi.delete(confirmAction.id);
      }
      fetchSubAdmins();
      setShowConfirmDialog(false);
      setConfirmAction(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-96 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">Sub-Admins</h1>
          <p className="text-gray-400 mt-1">Manage sub-administrator accounts and permissions</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-5 py-2.5 bg-red-600 text-white font-medium rounded hover:bg-red-700 transition whitespace-nowrap">
          + Create Sub-Admin
        </button>
      </div>

      {error && <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded p-4">
          <p className="text-gray-400 text-sm mb-1">Total Sub-Admins</p>
          <p className="text-2xl font-bold text-white">{subAdmins.length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded p-4">
          <p className="text-gray-400 text-sm mb-1">Active</p>
          <p className="text-2xl font-bold text-green-400">{subAdmins.filter(sa => sa.status === 'Active').length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded p-4">
          <p className="text-gray-400 text-sm mb-1">Blocked</p>
          <p className="text-2xl font-bold text-red-400">{subAdmins.filter(sa => sa.status === 'Blocked').length}</p>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 border-b border-gray-700">
            <tr>
              <th className="px-5 py-3 text-left font-semibold text-gray-300">Name</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-300">Email</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-300">Sections</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-300">Status</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-300">Created</th>
              <th className="px-5 py-3 text-center font-semibold text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {subAdmins.length === 0 ? (
              <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-400">No sub-admins found</td></tr>
            ) : (
              subAdmins.map(subAdmin => (
                <tr key={subAdmin.id} className="hover:bg-gray-700/50">
                  <td className="px-5 py-3 text-white font-medium">{subAdmin.name}</td>
                  <td className="px-5 py-3 text-gray-400">{subAdmin.email}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {subAdmin.sectionCount > 0 ? (
                        <>
                          {subAdmin.sections.slice(0, 2).map(s => (
                            <span key={s} className="bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded">{formatSection(s)}</span>
                          ))}
                          {subAdmin.sectionCount > 2 && <span className="text-gray-500 text-xs">+{subAdmin.sectionCount - 2}</span>}
                        </>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${subAdmin.status === 'Active' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                      {subAdmin.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{new Date(subAdmin.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleOpenModal(subAdmin)} className="text-blue-400 hover:text-blue-300">✎</button>
                      <button onClick={() => handleToggleStatus(subAdmin.id, subAdmin.status)} className={subAdmin.status === 'Active' ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}>🔒</button>
                      <button onClick={() => handleDeleteSubAdmin(subAdmin.id, subAdmin.name)} className="text-red-400 hover:text-red-300">🗑</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">{editingSubAdmin ? 'Edit Sub-Admin' : 'Create Sub-Admin'}</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-200 text-2xl">×</button>
            </div>
            <form onSubmit={handleSaveSubAdmin} className="p-6 space-y-4">
              {!editingSubAdmin && (
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="admin@example.com" required className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm" />
                </div>
              )}
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="Admin Name" required className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">{editingSubAdmin ? 'New Password (optional)' : 'Password'} {!editingSubAdmin && '*'}</label>
                <input type="password" name="password" value={formData.password} onChange={handleFormChange} placeholder={editingSubAdmin ? 'Leave blank to keep' : 'Set password'} required={!editingSubAdmin} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-3">Access Sections *</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-800 border border-gray-700 rounded p-3 max-h-48 overflow-y-auto">
                  {availableSections.map(section => (
                    <label key={section.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-2 rounded">
                      <input type="checkbox" value={section.value} checked={formData.sections.includes(section.value)} onChange={handleFormChange} className="w-4 h-4 accent-blue-500" />
                      <span className="text-gray-300 text-sm">{section.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-700">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">{editingSubAdmin ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded p-6 max-w-sm w-full">
            <p className="text-gray-300 mb-6">{confirmAction.message}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowConfirmDialog(false)} className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm">Cancel</button>
              <button onClick={confirmDialogAction} className={`px-4 py-2 rounded text-sm ${confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'} text-white`}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatSection(section) {
  return section.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

function MetricsCard({ title, value, icon }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-sm mb-2">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function FormGroup({ label, required = false, children }) {
  return (
    <div>
      <label className="block text-gray-300 text-sm font-semibold mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 text-2xl leading-none">×</button>
        {children}
      </div>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel, isDangerous = false }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl">
        <p className="text-gray-200 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition font-medium">Cancel</button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded transition font-medium ${isDangerous ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-orange-600 text-white hover:bg-orange-700'}`}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
    password: '',
    name: '',
    sections: [],
  });

  // Fetch sub-admins and available sections on mount
  useEffect(() => {
    fetchSubAdmins();
    fetchAvailableSections();
  }, []);

  const fetchSubAdmins = async () => {
    try {
      setLoading(true);
      const response = await subAdminApi.getAll();
      setSubAdmins(response.data.data.subAdmins || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch sub-admins');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSections = async () => {
    try {
      const response = await subAdminApi.getSections();
      setAvailableSections(response.data.data.sections || []);
    } catch (err) {
      console.error('Failed to fetch sections:', err);
    }
  };

  const handleOpenModal = (subAdmin = null) => {
    if (subAdmin) {
      setEditingSubAdmin(subAdmin);
      setFormData({
        email: subAdmin.email,
        password: '',
        name: subAdmin.name,
        sections: subAdmin.sections || [],
      });
    } else {
      setEditingSubAdmin(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        sections: [],
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSubAdmin(null);
    setFormData({
      email: '',
      password: '',
      name: '',
      sections: [],
    });
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        sections: checked
          ? [...prev.sections, value]
          : prev.sections.filter(s => s !== value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSaveSubAdmin = async (e) => {
    e.preventDefault();
    try {
      if (editingSubAdmin) {
        // Update sections
        if (formData.sections.length > 0) {
          await subAdminApi.updateSections(editingSubAdmin.id, formData.sections);
        }
        // Update password if provided
        if (formData.password) {
          await subAdminApi.resetPassword(editingSubAdmin.id, formData.password);
        }
      } else {
        // Create new sub-admin
        if (!formData.email || !formData.password || !formData.name) {
          setError('Email, password, and name are required');
          return;
        }
        await subAdminApi.create(formData);
      }
      handleCloseModal();
      fetchSubAdmins();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save sub-admin');
      console.error(err);
    }
  };

  const handleToggleStatus = async (subAdminId, currentStatus) => {
    setConfirmAction({
      type: 'toggle',
      id: subAdminId,
      message: `Are you sure you want to ${currentStatus === 'Active' ? 'block' : 'unblock'} this sub-admin?`
    });
    setShowConfirmDialog(true);
  };

  const handleDeleteSubAdmin = (subAdminId, name) => {
    setConfirmAction({
      type: 'delete',
      id: subAdminId,
      message: `Are you sure you want to delete sub-admin "${name}"? This action cannot be undone.`
    });
    setShowConfirmDialog(true);
  };

  const confirmDialogAction = async () => {
    try {
      if (confirmAction.type === 'toggle') {
        await subAdminApi.toggleStatus(confirmAction.id);
      } else if (confirmAction.type === 'delete') {
        await subAdminApi.delete(confirmAction.id);
      }
      fetchSubAdmins();
      setShowConfirmDialog(false);
      setConfirmAction(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Sub-Admins</h1>
          <p className="text-gray-400">Manage sub-administrator accounts and permissions</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          + Create Sub-Admin
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricsCard
          title="Total Sub-Admins"
          value={subAdmins.length}
          icon="👤"
        />
        <MetricsCard
          title="Active"
          value={subAdmins.filter(sa => sa.status === 'Active').length}
          icon="✓"
        />
        <MetricsCard
          title="Blocked"
          value={subAdmins.filter(sa => sa.status === 'Blocked').length}
          icon="✕"
        />
      </div>

      {/* Sub-Admins Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">NAME</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">EMAIL</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">SECTIONS</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">STATUS</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">CREATED</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {subAdmins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                    No sub-admins found. Create one to get started.
                  </td>
                </tr>
              ) : (
                subAdmins.map(subAdmin => (
                  <tr key={subAdmin.id} className="hover:bg-gray-800/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{subAdmin.name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{subAdmin.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {subAdmin.sectionCount > 0 ? (
                          <>
                            {subAdmin.sections.slice(0, 2).map(section => (
                              <span
                                key={section}
                                className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded"
                              >
                                {formatSection(section)}
                              </span>
                            ))}
                            {subAdmin.sectionCount > 2 && (
                              <span className="text-gray-400 text-xs px-2 py-1">
                                +{subAdmin.sectionCount - 2} more
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-500 text-sm">No sections</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          subAdmin.status === 'Active'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {subAdmin.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(subAdmin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(subAdmin)}
                          className="text-blue-400 hover:text-blue-300 transition"
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleToggleStatus(subAdmin.id, subAdmin.status)}
                          className={`transition ${
                            subAdmin.status === 'Active'
                              ? 'text-orange-400 hover:text-orange-300'
                              : 'text-green-400 hover:text-green-300'
                          }`}
                          title={`${subAdmin.status === 'Active' ? 'Block' : 'Unblock'}`}
                        >
                          {subAdmin.status === 'Active' ? '🚫' : '✓'}
                        </button>
                        <button
                          onClick={() => handleDeleteSubAdmin(subAdmin.id, subAdmin.name)}
                          className="text-red-400 hover:text-red-300 transition"
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal onClose={handleCloseModal}>
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">
              {editingSubAdmin ? 'Edit Sub-Admin' : 'Create New Sub-Admin'}
            </h2>

            <form onSubmit={handleSaveSubAdmin} className="space-y-5">
              {/* Email */}
              {!editingSubAdmin && (
                <FormGroup label="Email" required>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="sub-admin@example.com"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </FormGroup>
              )}

              {/* Name */}
              <FormGroup label="Name" required>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Sub-Admin Name"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </FormGroup>

              {/* Password */}
              <FormGroup label={editingSubAdmin ? 'New Password (optional)' : 'Password'} required={!editingSubAdmin}>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  placeholder={editingSubAdmin ? 'Leave blank to keep current' : 'Set password'}
                  required={!editingSubAdmin}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </FormGroup>

              {/* Sections */}
              <FormGroup label="Access Sections" required>
                <div className="grid grid-cols-2 gap-3 bg-gray-800/50 p-3 rounded border border-gray-700">
                  {availableSections.map(section => (
                    <label key={section.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700/50 p-2 rounded transition">
                      <input
                        type="checkbox"
                        value={section.value}
                        checked={formData.sections.includes(section.value)}
                        onChange={handleFormChange}
                        className="w-4 h-4 rounded border-gray-600 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-gray-300 text-sm">{section.label}</span>
                    </label>
                  ))}
                </div>
              </FormGroup>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
                >
                  {editingSubAdmin ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <ConfirmDialog
          message={confirmAction.message}
          onConfirm={confirmDialogAction}
          onCancel={() => setShowConfirmDialog(false)}
          isDangerous={confirmAction.type === 'delete'}
        />
      )}
    </div>
  );
}

/**
 * Metrics Card Component
 */
function MetricsCard({ title, value, icon }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-sm mb-2">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

/**
 * Form Group Component
 */
function FormGroup({ label, required = false, children }) {
  return (
    <div>
      <label className="block text-gray-300 text-sm font-semibold mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * Modal Component
 */
function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 text-2xl leading-none"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

/**
 * Confirm Dialog Component
 */
function ConfirmDialog({ message, onConfirm, onCancel, isDangerous = false }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl">
        <p className="text-gray-200 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded transition font-medium ${
              isDangerous
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Format section name for display
 */
function formatSection(section) {
  return section
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}
