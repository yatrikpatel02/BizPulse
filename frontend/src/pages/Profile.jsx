import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import AddCompanyModal from '../components/AddCompanyModal';
import api from '../services/api';

const checks = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const { businesses, removeBusiness, editBusiness } = useBusiness();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Toggle state for password form
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Personal Profile details state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [usernameField, setUsernameField] = useState(user?.username || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Password state
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

  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');

  // Sync user changes to states
  useEffect(() => {
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
    setUsernameField(user?.username || '');
    setAvatarPreview(user?.avatar || '');
    setAvatarFile(null);
  }, [user]);

  // Password strength checks
  const passwordChecks = useMemo(() => checks.map((c) => ({ ...c, passed: c.test(newPassword) })), [newPassword]);
  const allChecksPassed = passwordChecks.every((c) => c.passed);
  const passwordsMatch = newPassword === newPasswordConfirm && newPasswordConfirm !== '';

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
    } catch (err) {
      setEditError('Failed to rename company.');
    }
  };

  const userInitials = (user?.first_name?.charAt(0) || '') + (user?.last_name?.charAt(0) || '') || user?.username?.charAt(0) || 'U';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* User Info Card (Wider, horizontal design with decreased height) */}
      <div className="glass-card rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Left: Interactive Avatar Upload */}
        <div className="flex flex-col items-center text-center md:border-r border-gray-100 dark:border-slate-800 md:pr-8 md:min-w-[200px]">
          <div 
            onClick={() => document.getElementById('avatar-input').click()}
            className="group relative w-20 h-20 rounded-full cursor-pointer overflow-hidden ring-4 ring-indigo-500/10 shadow-md mb-4"
            title="Click to change profile picture"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-indigo-50/70 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-2.5xl uppercase font-display">
                {userInitials}
              </div>
            )}
            {/* Overlay on Hover */}
            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            className="mt-1 mb-3 px-3.5 py-1.5 border border-gray-250 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-350 text-[11px] font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Photo
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 font-display">
            {user?.first_name || user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username}
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{user?.email}</p>
        </div>

        {/* Right: Personal details fields side-by-side */}
        <div className="flex-1 w-full">
          <form onSubmit={handleProfileUpdate} className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Personal Profile Details</h3>
              {profileError && (
                <p className="text-xs font-semibold text-red-500">{profileError}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none text-xs transition-all"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none text-xs transition-all"
                  placeholder="Last Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
                <input
                  type="text"
                  value={usernameField}
                  onChange={(e) => setUsernameField(e.target.value)}
                  required
                  className="block w-full px-3.5 py-2 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none text-xs transition-all"
                  placeholder="Username"
                />
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Email Address</span>
                <div className="px-3.5 py-2 bg-gray-100/70 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-gray-500 dark:text-slate-400 text-xs font-semibold">
                  {user?.email}
                </div>
              </div>
            </div>
            
            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                disabled={profileLoading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-indigo-500/10"
              >
                {profileLoading ? 'Saving...' : 'Save Profile Details'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Lower section grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Security section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Change Password Card */}
          <div className="glass-card rounded-2xl p-6 shadow-sm">
            {!showPasswordForm ? (
              <div className="py-4 text-center space-y-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 font-display">Account Security</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
                    Update your account password to secure your metrics and uploads.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-indigo-500/10"
                >
                  Change Password
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 font-display">Change Password</h3>
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
                    className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
                
                {passwordError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold">
                    {passwordError}
                  </div>
                )}
                
                {passwordSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-semibold">
                    {passwordSuccess}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Current Password</label>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="block w-full px-3.5 py-2 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none text-sm transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full px-3.5 py-2 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none text-sm transition-all"
                      placeholder="••••••••"
                    />
                    {newPassword && (
                      <ul className="mt-3 grid grid-cols-1 gap-1 text-[10px] font-semibold text-slate-400 bg-slate-950/20 border border-slate-900 rounded-xl p-2.5">
                        {passwordChecks.map((c, i) => (
                          <li key={i} className={`flex items-center gap-1.5 ${c.passed ? 'text-emerald-400' : 'text-slate-500'}`}>
                            <span>{c.passed ? '✓' : '•'}</span> {c.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      className="block w-full px-3.5 py-2 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none text-sm transition-all"
                      placeholder="••••••••"
                    />
                    {newPasswordConfirm && !passwordsMatch && (
                      <p className="mt-1 text-xs text-red-400 font-semibold">Passwords do not match.</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading || !allChecksPassed || !passwordsMatch}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl disabled:opacity-40 transition-colors"
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Danger Zone Card */}
          <div className="glass-card rounded-2xl p-6 border border-red-200/10 dark:border-red-500/10 shadow-sm bg-red-500/[0.01] space-y-4">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 font-display">Delete Account</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              Once you delete your account, all your uploaded datasets and analytics will be permanently removed.
            </p>
            
            {deleteError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-xl text-xs font-semibold">
                {deleteError}
              </div>
            )}
            
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setDeleteError('');
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-red-500/10"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-medium">
                  Are you absolutely sure? This action is irreversible.
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Confirm with Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="block w-full px-3.5 py-2.5 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-250 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-xs transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || !confirmPassword}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40"
                  >
                    {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setConfirmPassword('');
                      setDeleteError('');
                    }}
                    className="flex-1 py-2 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manage Companies section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 font-display">Manage Companies</h3>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1"
              >
                <span>+</span> Add Company
              </button>
            </div>

            {editError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold">
                {editError}
              </div>
            )}

            <div className="border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-850 border-b border-gray-100 dark:border-slate-800">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Company Name</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-slate-800/60">
                  {businesses.map((business) => (
                    <tr key={business.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-5 py-4">
                        {editingId === business.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2.5 py-1 bg-slate-950/40 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none text-sm transition-all"
                            autoFocus
                          />
                        ) : (
                          <span className="font-semibold text-gray-800 dark:text-slate-200">{business.name}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {editingId === business.id ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(business.id)}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1 border dark:border-slate-700 hover:bg-slate-800 text-gray-400 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
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
                                className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                                title="Rename Company"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => removeBusiness(business.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
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
                  {businesses.length === 0 && (
                    <tr>
                      <td colSpan="2" className="px-5 py-8 text-center text-gray-500 italic">No companies registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <AddCompanyModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-6 shadow-xl max-w-sm w-full text-center space-y-4 transform scale-100 transition-all duration-300">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 font-display">Profile Saved</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Your profile details and custom photo have been updated and synced successfully.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-indigo-500/10"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
