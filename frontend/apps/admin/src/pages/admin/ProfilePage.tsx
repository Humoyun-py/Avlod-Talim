import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  KeyRound,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const { showToast } = useToast();

  // Profile Edit State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Full name is required.', 'error');
      return;
    }

    setSavingProfile(true);
    try {
      await api.updateProfile({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      await refreshUser();
      showToast('Profile information successfully saved.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      showToast('Please enter both your current password and new password.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setChangingPass(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      showToast('Password changed successfully.', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Current password was incorrect.', 'error');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Administrator Account Profile</h2>
        <p className="text-xs text-slate-500">
          Manage your personal credentials, contact email, and security settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left card: User Card Preview */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col items-center text-center">
          <div className="relative mb-4">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-100 shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-900 text-white flex items-center justify-center text-2xl font-bold uppercase shadow-sm">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
            )}
            <span className="absolute bottom-1 right-1 p-1 bg-emerald-500 rounded-full ring-2 ring-white" />
          </div>

          <h3 className="text-base font-bold text-slate-900">{user?.full_name}</h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">@{user?.username}</p>

          <div className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-200/60 text-amber-900 text-xs font-mono font-semibold uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Role: {user?.role}</span>
          </div>

          <div className="w-full border-t border-slate-100 mt-6 pt-4 text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{user?.email || 'No email registered'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono">{user?.phone || 'No phone registered'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full mt-6 py-2 px-3 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>

        {/* Right card: Forms for Profile & Password */}
        <div className="md:col-span-2 space-y-6">
          {/* General Information Form */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Personal Contact Details</h3>
            <p className="text-xs text-slate-500 mb-4">
              Update how colleagues and notifications reach your administrative station
            </p>

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-[11px]">
                Note: Administrative roles are authoritative and centrally assigned by the Director. User accounts cannot self-promote permissions.
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Contact Details</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-slate-600" />
              <span>Change Security Password</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Regularly rotate your administrative credentials to protect institutional records
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changingPass}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  {changingPass && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
