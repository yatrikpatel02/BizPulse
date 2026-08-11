import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import AddCompanyModal from '../components/AddCompanyModal';
import api from '../services/api';
import { useLocation } from 'react-router-dom';
import { getUserSettings, updateUserSettings } from '../services/auth';

const passwordStrengthChecks = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const { businesses, removeBusiness, editBusiness, activeBusiness, clearBusinessData } = useBusiness();
  const location = useLocation();

  // Settings page active tab
  const [activeSubTab, setActiveSubTab] = useState('general'); // 'general', 'account', 'thresholds', 'sync'

  useEffect(() => {
    setActiveSubTab('general');
  }, [location.key]);

  // General Settings
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  
  // Localized preferences
  const [currency, setCurrency] = useState(() => localStorage.getItem('bizpulse_currency') || 'INR');
  const [alertSettings, setAlertSettings] = useState({
    safetyStock: 50,
    csatThreshold: 80,
    starRating: 4.0,
    emailAlerts: true
  });
  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    frequency: 'daily',
    channel: 'csv'
  });

  // Fetch settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getUserSettings();
        setAlertSettings({
          safetyStock: data.safety_stock,
          csatThreshold: data.csat_threshold,
          starRating: parseFloat(data.star_rating),
          emailAlerts: data.email_alerts
        });
        setSyncSettings({
          autoSync: data.auto_sync,
          frequency: data.sync_frequency,
          channel: data.import_method
        });
      } catch (err) {
        console.error('Failed to load user settings from backend:', err);
      }
    };
    fetchSettings();
  }, []);

  // Account Profile Details
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [usernameField, setUsernameField] = useState(user?.username || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Toast status notifier
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Sync user values
  useEffect(() => {
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
    setUsernameField(user?.username || '');
    setAvatarPreview(user?.avatar || '');
    setAvatarFile(null);
  }, [user]);

  // Password checks
  const passwordChecks = useMemo(() => {
    return passwordStrengthChecks.map((c) => ({ ...c, passed: c.test(newPassword) }));
  }, [newPassword]);
  const allChecksPassed = passwordChecks.every((c) => c.passed);
  const passwordsMatch = newPassword === newPasswordConfirm && newPasswordConfirm !== '';

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Handlers
  const handleSaveGeneralSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('bizpulse_currency', currency);
    triggerToast('General preferences updated successfully.');
  };

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    try {
      await updateUserSettings({
        safety_stock: alertSettings.safetyStock,
        csat_threshold: alertSettings.csatThreshold,
        star_rating: alertSettings.starRating,
        email_alerts: alertSettings.emailAlerts
      });
      triggerToast('Alert thresholds saved successfully.');
      window.dispatchEvent(new Event('bizpulse-settings-updated'));
    } catch (err) {
      triggerToast('Failed to save alert thresholds.');
    }
  };

  const handleSaveSync = async (e) => {
    e.preventDefault();
    try {
      await updateUserSettings({
        auto_sync: syncSettings.autoSync,
        sync_frequency: syncSettings.frequency,
        import_method: syncSettings.channel
      });
      triggerToast('Integration and sync configuration saved.');
    } catch (err) {
      triggerToast('Failed to save integration settings.');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileLoading(true);
    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('username', usernameField);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      await updateProfile(formData);
      setShowSuccessModal(true);
    } catch (err) {
      setProfileError(err.response?.data?.username?.[0] || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(true);
    try {
      await api.post('/accounts/profile/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm
      });
      setPasswordSuccess('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordSuccess('');
      }, 1500);
    } catch (err) {
      setPasswordError(err.response?.data?.detail || err.response?.data?.old_password?.[0] || err.response?.data?.new_password?.[0] || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmPassword) {
      setDeleteError('Password is required.');
      return;
    }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.delete('/accounts/profile/delete/', { data: { password: confirmPassword } });
      logout();
    } catch (err) {
      setDeleteError(err.response?.data?.detail || 'Failed to delete account. Please check your password.');
      setDeleteLoading(false);
    }
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) return;
    setEditError('');
    try {
      await editBusiness(id, { name: editName });
      setEditingId(null);
      triggerToast('Company name renamed successfully.');
    } catch (err) {
      setEditError('Failed to rename company.');
    }
  };

  const userInitials = (user?.first_name?.charAt(0) || '') + (user?.last_name?.charAt(0) || '') || user?.username?.charAt(0) || 'U';

  const menuItems = [
    { 
      id: 'general', 
      title: 'General & Companies', 
      desc: 'Display currencies and registered companies.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    { 
      id: 'account', 
      title: 'Account & Security', 
      desc: 'Credentials and metadata configuration.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    { 
      id: 'thresholds', 
      title: 'Thresholds & Alerts', 
      desc: 'Inventory alerts and CSAT warnings.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    { 
      id: 'sync', 
      title: 'Integrations & Sync', 
      desc: 'Connect scrapers and store APIs.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 bg-navy-900 border border-slate-200 border-white/[0.06] text-slate-100 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
          {toastMessage}
        </div>
      )}

      {/* Top Horizontal Tab Nav */}
      <div className="bg-navy-800/60 backdrop-blur-md border border-white/[0.06] rounded-3xl p-6 shadow-md">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-display">System Settings</h2>
          <p className="text-sm text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 font-medium mt-1">Configure preferences and platform rules</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeSubTab === item.id
                  ? 'bg-violet-600 bg-violet-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-navy-700/60/60 hover:bg-gray-200 hover:bg-navy-700 text-slate-300'
              }`}
            >
              <span className={activeSubTab === item.id ? 'text-white' : 'text-slate-400'}>
                {item.icon}
              </span>
              {item.title}
            </button>
          ))}
        </div>
      </div>

      {/* Content Panel */}
      <div className="bg-navy-800/60 backdrop-blur-md border border-white/[0.06] rounded-3xl p-8 shadow-md">
          
          {/* TAB 1: GENERAL */}
          {activeSubTab === 'general' && (
            <div className="space-y-8 animate-fade-in flex-1">
              <div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white font-display">General & Company Settings</h3>
                <p className="text-sm text-slate-500 mt-1">Manage and configure your registered business companies.</p>
              </div>

              {/* Manage Companies List */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider font-display">Manage Companies</h4>
                    <p className="text-sm text-slate-500 mt-1">Edit or add company segments for dashboard visualization.</p>
                  </div>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    + Add Company
                  </button>
                </div>

                {editError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold animate-pulse">
                    {editError}
                  </div>
                )}

                <div className="border border-white/[0.06] rounded-2xl overflow-hidden bg-navy-800/60/20 bg-navy-900/20">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-navy-900/40 bg-navy-700/60 border-b border-white/[0.06]">
                        <th className="px-5 py-3 text-left font-bold text-slate-200 uppercase tracking-wider">Company Name</th>
                        <th className="px-5 py-3 text-right font-bold text-slate-200 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/40 dark:divide-slate-800/60">
                      {businesses.map((business) => (
                        <tr key={business.id} className="hover:bg-navy-900/40 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-5 py-4">
                            {editingId === business.id ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="px-2.5 py-1.5 bg-navy-800/60 bg-navy-900/40 border border-white/[0.06] rounded-lg text-white placeholder-slate-500 focus:outline-none text-xs transition-all"
                                autoFocus
                              />
                            ) : (
                              <span className="font-semibold text-slate-200">
                                {business.name} {activeBusiness?.id === business.id && (
                                  <span className="ml-2 text-[9px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-600 dark:text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">Active</span>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {editingId === business.id ? (
                                <>
                                  <button
                                    onClick={() => handleSaveEdit(business.id)}
                                    className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="px-3 py-1 border border-white/[0.06] dark:border-slate-850 hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingId(business.id);
                                      setEditName(business.name);
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-violet-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer"
                                    title="Rename Company"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to delete ${business.name}?`)) {
                                        removeBusiness(business.id);
                                        triggerToast('Company deleted.');
                                      }
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                    title="Delete Company"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Delete Company Data Section */}
              <div className="pt-8 border-t border-white/[0.06]/40 border-white/[0.06]/40 space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-red-600 text-red-400 uppercase tracking-wider font-display">Delete Company Data</h4>
                  <p className="text-sm text-slate-500 mt-1">Permanently delete all transaction history, catalog products, snapshots, and logs for the active company segment without deleting the company record itself.</p>
                </div>

                <div className="border border-red-500/15 dark:border-red-500/30 bg-red-500/[0.01] rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1 text-left">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Target Company</span>
                    <p className="text-base font-bold text-slate-200 font-display mt-0.5">
                      {activeBusiness?.name || 'No active company selected'}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!activeBusiness) {
                        alert('No active company selected.');
                        return;
                      }
                      const confirmed = window.confirm(`CRITICAL WARNING: Are you absolutely sure you want to permanently delete ALL data (products, sales records, predictions, customer feedback, inventory history) for "${activeBusiness.name}"? This action CANNOT be undone. The company record itself will remain active.`);
                      if (confirmed) {
                        try {
                          await clearBusinessData(activeBusiness.id);
                          triggerToast(`Deleted all datasets for "${activeBusiness.name}".`);
                        } catch (err) {
                          triggerToast(`Failed to delete company data.`);
                        }
                      }
                    }}
                    disabled={!activeBusiness}
                    className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-red-500/10 cursor-pointer disabled:opacity-40"
                  >
                    Delete All Company Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNT */}
          {activeSubTab === 'account' && (
            <div className="space-y-8 animate-fade-in flex-1">
              <div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white font-display">Account Security & Credentials</h3>
                <p className="text-sm text-slate-500 mt-1">Edit personal metadata, change password or delete accounts.</p>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Pic Upload */}
                <div className="flex flex-col items-center text-center md:border-r border-white/[0.06] md:pr-8 md:min-w-[180px]">
                  <div
                    onClick={() => document.getElementById('avatar-input').click()}
                    className="group relative w-20 h-20 rounded-full cursor-pointer overflow-hidden ring-4 ring-violet-500/10 shadow-md mb-4 mx-auto"
                    title="Click to change profile picture"
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-indigo-50/70 dark:bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-2.5xl uppercase font-display">
                        {userInitials}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('avatar-input').click()}
                    className="mb-2 px-3 py-1.5 border border-gray-250 border-white/[0.06] hover:bg-navy-900/40 dark:hover:bg-slate-800 text-slate-300 dark:text-slate-400 text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    Edit Photo
                  </button>
                  <p className="text-xs text-slate-500 max-w-[130px] leading-tight">Recommended JPG or PNG. Max size 2MB.</p>
                </div>

                {/* Form fields */}
                <div className="flex-1 space-y-6">
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    {profileError && (
                      <p className="text-xs font-semibold text-red-500 animate-pulse">{profileError}</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">First Name</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="block w-full px-3.5 py-2.5 bg-navy-800/60 bg-navy-900/40 border border-white/[0.06] focus:border-indigo-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-white placeholder-gray-400 focus:outline-none text-xs transition-all shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Last Name</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="block w-full px-3.5 py-2.5 bg-navy-800/60 bg-navy-900/40 border border-white/[0.06] focus:border-indigo-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-white placeholder-gray-400 focus:outline-none text-xs transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
                        <input
                          type="text"
                          value={usernameField}
                          onChange={(e) => setUsernameField(e.target.value)}
                          required
                          className="block w-full px-3.5 py-2.5 bg-navy-800/60 bg-navy-900/40 border border-white/[0.06] focus:border-indigo-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-white placeholder-gray-400 focus:outline-none text-xs transition-all shadow-inner"
                        />
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</span>
                        <div className="px-3.5 py-2.5 bg-gray-200/50 bg-navy-800/60 border border-white/[0.06] dark:border-slate-850 rounded-xl text-slate-400 text-xs font-semibold">
                          {user?.email}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        {profileLoading ? 'Saving...' : 'Save Profile Details'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Password update and danger zones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-white/[0.06]/40 border-white/[0.06]/40">
                {/* Security change password */}
                <div className="border border-white/[0.06] rounded-2xl p-5 space-y-4 bg-navy-800/60/20 bg-navy-900/10">
                  {!showPasswordForm ? (
                    <div className="text-center py-4 space-y-3">
                      <div className="w-10 h-10 bg-violet-500/10 rounded-full flex items-center justify-center text-violet-400 mx-auto">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white font-display">Update Password</h4>
                        <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed mt-1">Secure your dashboard credentials with a stronger password.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(true)}
                        className="w-full py-2 bg-violet-600 hover:bg-violet-500 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                      >
                        Change Password
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white font-display">Change Password</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordError('');
                            setPasswordSuccess('');
                            setOldPassword('');
                            setNewPassword('');
                            setNewPasswordConfirm('');
                          }}
                          className="text-xs text-violet-400 hover:text-indigo-600 font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      {passwordError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-xl text-xs font-semibold animate-pulse">{passwordError}</div>}
                      {passwordSuccess && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-600 dark:text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl text-xs font-semibold">{passwordSuccess}</div>}

                      <form onSubmit={handlePasswordChange} className="space-y-3">
                        <input
                          type="password"
                          required
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Current Password"
                          className="block w-full px-3.5 py-2 bg-navy-800/60 bg-navy-900/40 border border-white/[0.06] focus:border-indigo-500 rounded-xl text-white placeholder-gray-400 focus:outline-none text-xs"
                        />
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New Password"
                          className="block w-full px-3.5 py-2 bg-navy-800/60 bg-navy-900/40 border border-white/[0.06] focus:border-indigo-500 rounded-xl text-white placeholder-gray-400 focus:outline-none text-xs"
                        />
                        {newPassword && (
                          <ul className="grid grid-cols-1 gap-0.5 text-[9px] font-bold text-slate-400 bg-slate-950/20 border border-slate-900 rounded-xl p-2.5">
                            {passwordChecks.map((c, i) => (
                              <li key={i} className={`flex items-center gap-1 ${c.passed ? 'text-emerald-600 dark:text-emerald-600 dark:text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                                <span>{c.passed ? '✓' : '•'}</span> {c.label}
                              </li>
                            ))}
                          </ul>
                        )}
                        <input
                          type="password"
                          required
                          value={newPasswordConfirm}
                          onChange={(e) => setNewPasswordConfirm(e.target.value)}
                          placeholder="Confirm New Password"
                          className="block w-full px-3.5 py-2 bg-navy-800/60 bg-navy-900/40 border border-white/[0.06] focus:border-indigo-500 rounded-xl text-white placeholder-gray-400 focus:outline-none text-xs"
                        />
                        <button
                          type="submit"
                          disabled={passwordLoading || !allChecksPassed || !passwordsMatch}
                          className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl disabled:opacity-40 cursor-pointer"
                        >
                          {passwordLoading ? 'Updating...' : 'Update Password'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Danger zone */}
                <div className="border border-red-500/15 dark:border-red-500/30 bg-red-500/[0.01] rounded-2xl p-5 space-y-4 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 text-red-400 mx-auto">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-red-600 text-red-400 font-display">Delete Account</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1 max-w-[200px] mx-auto">Permanently deletes account datasets, metrics, configuration, and logs.</p>
                  </div>

                  {deleteError && <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-xl text-xs font-semibold animate-pulse">{deleteError}</div>}

                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Delete Account
                    </button>
                  ) : (
                    <div className="space-y-3 w-full">
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Type Password to Confirm"
                        className="block w-full px-3.5 py-2.5 bg-navy-800/60 bg-navy-900/40 border border-red-500/10 focus:border-red-500 rounded-xl text-xs text-white placeholder-gray-400 text-left"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteLoading || !confirmPassword}
                          className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setConfirmPassword('');
                          }}
                          className="flex-1 py-2 border border-white/[0.06] text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: THRESHOLDS */}
          {activeSubTab === 'thresholds' && (
            <div className="space-y-8 animate-fade-in flex-1">
              <div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white font-display">Alert Limits & Thresholds</h3>
                <p className="text-sm text-slate-500 mt-1">Determine at what levels warnings trigger inside the dashboard.</p>
              </div>

              <form onSubmit={handleSaveThresholds} className="space-y-6 max-w-xl">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Safety Stock Level Alert</label>
                    <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-xl">{alertSettings.safetyStock} units</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={alertSettings.safetyStock}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, safetyStock: parseInt(e.target.value) }))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-gray-200 bg-navy-700/60 rounded-lg"
                  />
                  <p className="text-xs text-slate-500">Items with stock lower than this threshold flag as "Low Stock" warning anomalies.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">CSAT Warning Limit</label>
                    <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-xl">{alertSettings.csatThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="98"
                    step="1"
                    value={alertSettings.csatThreshold}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, csatThreshold: parseInt(e.target.value) }))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-gray-200 bg-navy-700/60 rounded-lg"
                  />
                  <p className="text-xs text-slate-500">Alerts trigger if the customer satisfaction score falls below this baseline percentage.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Customer Star Rating Warning</label>
                    <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-xl">{alertSettings.starRating.toFixed(1)} ★</span>
                  </div>
                  <input
                    type="range"
                    min="3.0"
                    max="4.8"
                    step="0.1"
                    value={alertSettings.starRating}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, starRating: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-gray-200 bg-navy-700/60 rounded-lg"
                  />
                  <p className="text-xs text-slate-500">Trigger warnings if the aggregate catalog sentiment drops below this star index.</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-navy-800/60/20 bg-navy-900/20 border border-white/[0.06] rounded-2xl">
                  <div>
                    <h5 className="text-base font-bold text-slate-800 dark:text-white">Send Email Alerts</h5>
                    <p className="text-xs text-slate-500 mt-1">Receive immediate notification updates on high severity anomalies.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertSettings.emailAlerts}
                      onChange={(e) => setAlertSettings(prev => ({ ...prev, emailAlerts: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 bg-navy-700/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-navy-800/60 after:border-white/[0.08] after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/[0.06]/40 border-white/[0.06]/40">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-indigo-500/10 cursor-pointer"
                  >
                    Save Alert Thresholds
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: INTEGRATIONS & SYNC */}
          {activeSubTab === 'sync' && (
            <div className="space-y-8 animate-fade-in flex-1">
              <div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white font-display">Integrations & Data Sync</h3>
                <p className="text-sm text-slate-500 mt-1">Manage scraper engines, import channels, and data pipeline settings.</p>
              </div>

              {/* Active Integration Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Integrations</h4>

                {/* CSV Import */}
                <div className="flex items-center justify-between p-4 bg-navy-800/60/20 bg-navy-900/20 border border-white/[0.06] rounded-2xl group hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 bg-violet-600/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="text-base font-bold text-slate-800 dark:text-white">CSV File Import</h5>
                      <p className="text-xs text-slate-500 mt-0.5">Upload sales, inventory, and review data via CSV files.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-emerald-600 text-emerald-600 dark:text-emerald-600 dark:text-emerald-600 dark:text-emerald-400">Active</span>
                  </div>
                </div>

                {/* Competitor Price Scraper — SerpAPI + Flipkart */}
                <div className="flex items-center justify-between p-4 bg-navy-800/60/20 bg-navy-900/20 border border-white/[0.06] rounded-2xl group hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 text-amber-400 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="text-base font-bold text-slate-800 dark:text-white">Competitor Price Scraper</h5>
                      <p className="text-xs text-slate-500 mt-0.5">Fetches live competitor prices via SerpAPI (Google/Amazon) and Flipkart scraper.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-emerald-600 text-emerald-600 dark:text-emerald-600 dark:text-emerald-600 dark:text-emerald-400">Active</span>
                  </div>
                </div>

                {/* Google Trends */}
                <div className="flex items-center justify-between p-4 bg-navy-800/60/20 bg-navy-900/20 border border-white/[0.06] rounded-2xl group hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-600 dark:text-rose-600 dark:text-rose-600 dark:text-rose-400 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="text-base font-bold text-slate-800 dark:text-white">Google Trends Pipeline</h5>
                      <p className="text-xs text-slate-500 mt-0.5">Pulls search interest data from Google Trends for product demand analysis.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-emerald-600 text-emerald-600 dark:text-emerald-600 dark:text-emerald-600 dark:text-emerald-400">Active</span>
                  </div>
                </div>
              </div>

              {/* Scraper Settings */}
              <form onSubmit={handleSaveSync} className="space-y-5 pt-2 border-t border-white/[0.06]/40 border-white/[0.06]/40">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-2">Scraper Settings</h4>

                <div className="flex items-center justify-between p-4 bg-navy-800/60/20 bg-navy-900/20 border border-white/[0.06] rounded-2xl">
                  <div>
                    <h5 className="text-base font-bold text-slate-800 dark:text-white">Auto-refresh Competitor Prices</h5>
                    <p className="text-xs text-slate-500 mt-1">Automatically trigger scraper on each product view.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncSettings.autoSync}
                      onChange={(e) => setSyncSettings(prev => ({ ...prev, autoSync: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 bg-navy-700/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-navy-800/60 after:border-white/[0.08] after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Scrape Refresh Frequency</label>
                  <select
                    disabled={!syncSettings.autoSync}
                    value={syncSettings.frequency}
                    onChange={(e) => setSyncSettings(prev => ({ ...prev, frequency: e.target.value }))}
                    className="block w-full px-3.5 py-2.5 bg-navy-800/60 bg-navy-900/40 border border-white/[0.06] focus:border-indigo-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-white placeholder-gray-400 focus:outline-none text-xs transition-all disabled:opacity-40"
                  >
                    <option value="on_demand">On Demand (manual trigger)</option>
                    <option value="daily">Every 24 Hours (Daily)</option>
                    <option value="weekly">Every 7 Days (Weekly)</option>
                  </select>
                  <p className="text-xs text-slate-500">Controls how often the SerpAPI and Flipkart scraper automatically refetch prices.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Data Import Method</label>
                  <select
                    value={syncSettings.channel}
                    onChange={(e) => setSyncSettings(prev => ({ ...prev, channel: e.target.value }))}
                    className="block w-full px-3.5 py-2.5 bg-navy-800/60 bg-navy-900/40 border border-white/[0.06] focus:border-indigo-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-white placeholder-gray-400 focus:outline-none text-xs transition-all"
                  >
                    <option value="csv">CSV File Upload (Sales, Inventory, Reviews)</option>
                    <option value="serpapi">SerpAPI Automated Scrape</option>
                    <option value="flipkart">Flipkart Playwright Scraper</option>
                    <option value="google_trends">Google Trends API</option>
                  </select>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/[0.06]/40 border-white/[0.06]/40">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-indigo-500/10 cursor-pointer"
                  >
                    Save Integration Settings
                  </button>
                </div>
              </form>
            </div>
          )}
      </div>

      <AddCompanyModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-navy-800/60 border border-gray-150 border-white/[0.06] rounded-2xl p-6 shadow-xl max-w-sm w-full text-center space-y-4 transform scale-100 transition-all duration-300">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 text-emerald-600 dark:text-emerald-600 dark:text-emerald-600 dark:text-emerald-400 mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white font-display">Account Updated</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Your personal details and profile credentials have been successfully updated.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
