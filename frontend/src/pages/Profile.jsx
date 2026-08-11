import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';


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



  const userInitials = (user?.first_name?.charAt(0) || '') + (user?.last_name?.charAt(0) || '') || user?.username?.charAt(0) || 'U';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* User Info Card (Wider, horizontal design with decreased height) */}
      <div className="glass-card rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Left: Interactive Avatar Upload */}
        <div className="flex flex-col items-center text-center md:border-r border-slate-200/50 dark:border-slate-200/50 dark:border-white/[0.04] border-slate-200 dark:border-slate-200 dark:border-white/[0.06] md:pr-8 md:min-w-[200px]">
          <div 
            onClick={() => document.getElementById('avatar-input').click()}
            className="group relative w-20 h-20 rounded-full cursor-pointer overflow-hidden ring-4 ring-violet-500/10 shadow-md mb-4"
            title="Click to change profile picture"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-indigo-50/70 dark:bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-2.5xl uppercase font-display">
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
            className="mt-1 mb-3 px-3.5 py-1.5 border border-gray-250 border-slate-200 dark:border-slate-200 dark:border-white/[0.06] hover:glass-surface dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 dark:text-slate-400 text-[11px] font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Photo
          </button>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white font-display">
            {user?.first_name || user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{user?.email}</p>
        </div>

        {/* Right: Personal details fields side-by-side */}
        <div className="flex-1 w-full">
          <form onSubmit={handleProfileUpdate} className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Personal Profile Details</h3>
              {profileError && (
                <p className="text-xs font-semibold text-red-500">{profileError}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-white dark:bg-navy-900/40 border border-slate-200 dark:border-white/[0.06] focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none text-xs transition-all"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-white dark:bg-navy-900/40 border border-slate-200 dark:border-white/[0.06] focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none text-xs transition-all"
                  placeholder="Last Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
                <input
                  type="text"
                  value={usernameField}
                  onChange={(e) => setUsernameField(e.target.value)}
                  required
                  className="block w-full px-3.5 py-2 bg-white dark:bg-navy-900/40 border border-slate-200 dark:border-white/[0.06] focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none text-xs transition-all"
                  placeholder="Username"
                />
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</span>
                <div className="px-3.5 py-2 bg-gray-100/70 glass-card border border-slate-200 dark:border-slate-200 dark:border-white/[0.06] dark:border-slate-850 rounded-xl text-slate-500 dark:text-slate-400 text-xs font-semibold">
                  {user?.email}
                </div>
              </div>
            </div>
            
            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                disabled={profileLoading}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-indigo-500/10"
              >
                {profileLoading ? 'Saving...' : 'Save Profile Details'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Lower section grid - Symmetrical layout with aligned buttons at the bottom */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Change Password Card */}
        <div className="glass-card rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
          {!showPasswordForm ? (
            <div className="py-4 text-center flex flex-col justify-between h-full w-full flex-1">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-violet-500/10 rounded-full flex items-center justify-center text-violet-400 mx-auto">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white font-display">Account Security</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
                    Update your account password to secure your metrics and uploads.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordForm(true)}
                className="w-full mt-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-indigo-500/10 cursor-pointer"
              >
                Change Password
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in w-full">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white font-display">Change Password</h3>
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
                  className="text-xs text-violet-400 hover:text-violet-400 dark:hover:text-indigo-300 font-semibold"
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
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs font-semibold">
                  {passwordSuccess}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Current Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="block w-full px-3.5 py-2 bg-white dark:bg-navy-900/40 border border-slate-200 dark:border-white/[0.06] focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full px-3.5 py-2 bg-white dark:bg-navy-900/40 border border-slate-200 dark:border-white/[0.06] focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none text-sm transition-all"
                    placeholder="••••••••"
                  />
                  {newPassword && (
                    <ul className="mt-3 grid grid-cols-1 gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-950/20 border border-slate-900 rounded-xl p-2.5">
                      {passwordChecks.map((c, i) => (
                        <li key={i} className={`flex items-center gap-1.5 ${c.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                          <span>{c.passed ? '✓' : '•'}</span> {c.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    className="block w-full px-3.5 py-2 bg-white dark:bg-navy-900/40 border border-slate-200 dark:border-white/[0.06] focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none text-sm transition-all"
                    placeholder="••••••••"
                  />
                  {newPasswordConfirm && !passwordsMatch && (
                    <p className="mt-1 text-xs text-red-400 font-semibold">Passwords do not match.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading || !allChecksPassed || !passwordsMatch}
                  className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Delete Account Danger Zone Card */}
        <div className="glass-card rounded-2xl p-6 border border-red-200/10 dark:border-red-500/10 shadow-sm bg-red-500/[0.01] flex flex-col justify-between h-full">
          <div className="space-y-4 text-center flex-1 flex flex-col justify-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 font-display">Delete Account</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Once you delete your account, all your uploaded datasets and analytics will be permanently removed.
            </p>
            
            {deleteError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-xl text-xs font-semibold">
                {deleteError}
              </div>
            )}
          </div>
          
          <div className="mt-6 w-full">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setDeleteError('');
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-red-500/10 cursor-pointer"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-4 animate-fade-in w-full">
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-medium">
                  Are you absolutely sure? This action is irreversible.
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Confirm with Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="block w-full px-3.5 py-2.5 bg-white dark:bg-navy-900/40 border border-slate-200 dark:border-white/[0.06] focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 placeholder-gray-400 focus:outline-none text-xs transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || !confirmPassword}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40 cursor-pointer"
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
                    className="flex-1 py-2 border border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card border border-gray-150 border-slate-200 dark:border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-xl max-w-sm w-full text-center space-y-4 transform scale-100 transition-all duration-300">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 text-emerald-600 dark:text-emerald-600 dark:text-emerald-600 dark:text-emerald-400 mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white font-display">Profile Saved</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Your profile details and custom photo have been updated and synced successfully.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-indigo-500/10"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
