import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadAvatar, changePassword } from '../../utils/authUtils';

const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:4000';

/**
 * ProfileSettings — slide-in panel (or modal) for:
 *   • Viewing / changing profile picture
 *   • Changing password
 */
const ProfileSettings = ({ onClose }) => {
    const { currentUser, setCurrentUser } = useAuth();

    // ── Avatar state ─────────────────────────────────────────────────────────
    const [preview, setPreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarMsg, setAvatarMsg] = useState('');
    const [avatarError, setAvatarError] = useState('');
    const fileInputRef = useRef(null);

    // ── Password state ───────────────────────────────────────────────────────
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdMsg, setPwdMsg] = useState('');
    const [pwdError, setPwdError] = useState('');

    // ── Avatar handlers ──────────────────────────────────────────────────────
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
        setAvatarMsg('');
        setAvatarError('');
    };

    const handleAvatarUpload = async () => {
        if (!selectedFile) return;
        setAvatarLoading(true);
        setAvatarError('');
        setAvatarMsg('');
        const result = await uploadAvatar(selectedFile);
        setAvatarLoading(false);
        if (result.success) {
            setAvatarMsg('Profile picture updated!');
            setPreview(null);
            setSelectedFile(null);
            // Update the user context so navbar avatar refreshes
            if (setCurrentUser) {
                setCurrentUser((prev) => ({ ...prev, avatarUrl: result.avatarUrl }));
            }
        } else {
            setAvatarError(result.error || 'Upload failed');
        }
    };

    // ── Password handler ─────────────────────────────────────────────────────
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPwdError('');
        setPwdMsg('');
        if (newPwd.length < 6) { setPwdError('New password must be at least 6 characters.'); return; }
        if (newPwd !== confirmPwd) { setPwdError('Passwords do not match.'); return; }
        setPwdLoading(true);
        const result = await changePassword(null, currentPwd, newPwd);
        setPwdLoading(false);
        if (result.success) {
            setPwdMsg('Password changed successfully!');
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
        } else {
            setPwdError(result.error || 'Failed to change password.');
        }
    };

    // ── Avatar URL resolution ─────────────────────────────────────────────────
    const avatarSrc = preview
        || (currentUser?.avatarUrl ? `${AUTH_SERVICE_URL}${currentUser.avatarUrl}` : null);
    const initials = currentUser?.name
        ?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-br from-green-600 to-emerald-700 px-8 pt-8 pb-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white text-lg transition-colors"
                    >
                        ✕
                    </button>
                    <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
                    <p className="text-green-200 text-sm mt-1">{currentUser?.email}</p>
                </div>

                <div className="p-8 space-y-8">
                    {/* ── Avatar section ─────────────────────────────────────────────── */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                            Profile Picture
                        </h3>

                        <div className="flex items-center gap-5">
                            {/* Avatar display */}
                            <div className="relative flex-shrink-0">
                                {avatarSrc ? (
                                    <img
                                        src={avatarSrc}
                                        alt="Avatar"
                                        className="w-20 h-20 rounded-2xl object-cover ring-4 ring-green-100"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center ring-4 ring-green-100">
                                        <span className="text-white text-2xl font-bold">{initials}</span>
                                    </div>
                                )}
                                {/* Camera button overlay */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center text-base shadow-md hover:border-green-500 transition-colors"
                                >
                                    📷
                                </button>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 truncate">{currentUser?.name}</p>
                                <p className="text-sm text-gray-400 mt-0.5">
                                    {selectedFile ? selectedFile.name : 'JPG, PNG, WebP or GIF · Max 5 MB'}
                                </p>
                                {selectedFile && (
                                    <button
                                        onClick={handleAvatarUpload}
                                        disabled={avatarLoading}
                                        className="mt-2 px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                                    >
                                        {avatarLoading ? 'Uploading…' : 'Save Picture'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {avatarMsg && (
                            <p className="mt-3 text-sm text-green-600 font-medium">✓ {avatarMsg}</p>
                        )}
                        {avatarError && (
                            <p className="mt-3 text-sm text-red-600">⚠ {avatarError}</p>
                        )}
                    </section>

                    <hr className="border-gray-100" />

                    {/* ── Change password section ────────────────────────────────────── */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                            Change Password
                        </h3>

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Current Password
                                </label>
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    value={currentPwd}
                                    onChange={(e) => setCurrentPwd(e.target.value)}
                                    placeholder="Your current password"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPwd ? 'text' : 'password'}
                                        value={newPwd}
                                        onChange={(e) => setNewPwd(e.target.value)}
                                        placeholder="Minimum 6 characters"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                                    >
                                        {showPwd ? '🙈' : '👁'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Confirm New Password
                                </label>
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    value={confirmPwd}
                                    onChange={(e) => setConfirmPwd(e.target.value)}
                                    placeholder="Re-enter new password"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
                                />
                            </div>

                            {pwdError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">
                                    ⚠ {pwdError}
                                </div>
                            )}
                            {pwdMsg && (
                                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700">
                                    ✓ {pwdMsg}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={pwdLoading || !currentPwd || !newPwd || !confirmPwd}
                                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow hover:shadow-md transition-all disabled:opacity-50"
                            >
                                {pwdLoading ? 'Updating…' : 'Update Password'}
                            </button>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
