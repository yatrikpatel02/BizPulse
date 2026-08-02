import React, { useState, useMemo } from 'react';
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
  const { user, updateProfile } = useAuth();
  const { businesses, removeBusiness, editBusiness } = useBusiness();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Toggle state for password form
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Personal Profile details state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');

  // Password strength checks
  const passwordChecks = useMemo(() => checks.map((c) => ({ ...c, passed: c.test(newPassword) })), [newPassword]);
  const allChecksPassed = passwordChecks.every((c) => c.passed);
  const passwordsMatch = newPassword === newPasswordConfirm && newPasswordConfirm !== '';

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);
    try {
      await updateProfile({ first_name: firstName, last_name: lastName });
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 2000);
    } catch (err) {
      setProfileError('Failed to update profile.');
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 font-display">Profile Management</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage your user profile settings, password, and registered companies</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Account Details & Security */}
        <div className="lg:col-span-1 space-y-8">
          {/* User Info Card */}
          <div className="glass-card rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-2.5xl uppercase ring-4 ring-indigo-500/10 shadow-md mb-4 font-display">
              {userInitials}
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 font-display">
              {user?.first_name || user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username}
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{user?.email}</p>

            <div className="w-full border-t dark:border-slate-800 my-4"></div>

            <div className="w-full text-left space-y-4">
              <form onSubmit={handleProfileUpdate} className="space-y-3.5">
                {profileSuccess && (
                  <p className="text-xs font-semibold text-emerald-500">{profileSuccess}</p>
                )}
                {profileError && (
                  <p className="text-xs font-semibold text-red-500">{profileError}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="block w-full px-3 py-1.5 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none text-xs transition-all"
                      placeholder="First Name"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="block w-full px-3 py-1.5 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none text-xs transition-all"
                      placeholder="Last Name"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-[11px] font-semibold rounded-xl transition-all"
                >
                  {profileLoading ? 'Saving...' : 'Save Profile Details'}
                </button>
              </form>

              <div className="w-full border-t dark:border-slate-800 my-4"></div>

              <div className="space-y-3">
                <div>
                  <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Username</span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{user?.username}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Email Address</span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{user?.email}</span>
                </div>
              </div>
            </div>
          </div>

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
        </div>

        {/* Right Column: Manage Companies */}
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

            <div className="border dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/40 border-b dark:border-slate-800">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Company Name</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-slate-800/60">
                  {businesses.map((business) => (
                    <tr key={business.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-colors">
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
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => removeBusiness(business.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                title="Delete Company"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
    </div>
  );
}
