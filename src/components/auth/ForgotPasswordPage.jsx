import React, { useState, useEffect, useRef } from 'react';
import { sendOtp, verifyOtp, resetPassword, isValidEmail, isValidPassword } from '../../utils/authUtils';

/**
 * ForgotPasswordPage
 *
 * 3-step wizard:
 *   Step 1 — Enter email → send OTP
 *   Step 2 — Enter 6-digit OTP (with 60-second resend timer)
 *   Step 3 — Enter new password + confirm → reset
 */
const ForgotPasswordPage = ({ onBack, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const otpRefs = useRef([]);

    // Countdown timer for OTP resend
    useEffect(() => {
        if (step !== 2) return;
        setResendTimer(60);
        setCanResend(false);
        const interval = setInterval(() => {
            setResendTimer((t) => {
                if (t <= 1) { clearInterval(interval); setCanResend(true); return 0; }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [step]);

    // ── Step 1: send OTP ──────────────────────────────────────────────────────
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        if (!isValidEmail(email)) { setError('Please enter a valid email address.'); return; }
        setIsLoading(true);
        const result = await sendOtp(email);
        setIsLoading(false);
        if (result.success) {
            setStep(2);
        } else {
            setError(result.error || 'Failed to send OTP. Please try again.');
        }
    };

    // ── Step 2: verify OTP ────────────────────────────────────────────────────
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const next = [...otp];
        next[index] = value.slice(-1);
        setOtp(next);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) { setError('Please enter all 6 digits.'); return; }
        setError('');
        setIsLoading(true);
        const result = await verifyOtp(email, code);
        setIsLoading(false);
        if (result.success) {
            setResetToken(result.resetToken);
            setStep(3);
        } else {
            setError(result.error || 'Invalid or expired OTP.');
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setError('');
        setIsLoading(true);
        const result = await sendOtp(email);
        setIsLoading(false);
        if (result.success) {
            setOtp(['', '', '', '', '', '']);
            setStep(2); // reset timer
        } else {
            setError(result.error || 'Failed to resend.');
        }
    };

    // ── Step 3: reset password ────────────────────────────────────────────────
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        if (!isValidPassword(newPassword)) { setError('Password must be at least 6 characters.'); return; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
        setIsLoading(true);
        const result = await resetPassword(resetToken, newPassword);
        setIsLoading(false);
        if (result.success) {
            onSuccess?.();
        } else {
            setError(result.error || 'Failed to reset password.');
        }
    };

    // ── Shared layout ─────────────────────────────────────────────────────────
    const stepTitles = [
        { title: 'Forgot Password', subtitle: "Enter your email and we'll send you a reset code." },
        { title: 'Enter OTP', subtitle: `We sent a 6-digit code to ${email}` },
        { title: 'New Password', subtitle: 'Choose a strong password for your account.' },
    ];
    const { title, subtitle } = stepTitles[step - 1];

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-green-600 to-emerald-700 px-8 pt-10 pb-8 text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                            {step === 1 ? '🔑' : step === 2 ? '📧' : '🔒'}
                        </div>
                        <h1 className="text-2xl font-bold text-white">{title}</h1>
                        <p className="text-green-200 text-sm mt-2">{subtitle}</p>

                        {/* Step dots */}
                        <div className="flex items-center justify-center gap-2 mt-5">
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={`rounded-full transition-all duration-300 ${
                                        s === step
                                            ? 'w-6 h-2 bg-white'
                                            : s < step
                                            ? 'w-2 h-2 bg-green-300'
                                            : 'w-2 h-2 bg-white/30'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="px-8 py-8">
                        {/* Error */}
                        {error && (
                            <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
                                <span className="text-red-500 text-lg flex-shrink-0">⚠</span>
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        )}

                        {/* ── Step 1 ── */}
                        {step === 1 && (
                            <form onSubmit={handleSendOtp} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Sending OTP…
                                        </span>
                                    ) : (
                                        'Send Reset Code →'
                                    )}
                                </button>
                            </form>
                        )}

                        {/* ── Step 2 ── */}
                        {step === 2 && (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                                        Enter the 6-digit code
                                    </label>
                                    <div className="flex gap-2 justify-center">
                                        {otp.map((digit, i) => (
                                            <input
                                                key={i}
                                                ref={(el) => (otpRefs.current[i] = el)}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                                className="w-11 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:bg-green-50 transition-all"
                                                autoFocus={i === 0}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || otp.join('').length < 6}
                                    className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Verifying…
                                        </span>
                                    ) : (
                                        'Verify Code →'
                                    )}
                                </button>

                                <div className="text-center text-sm text-gray-500">
                                    {canResend ? (
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            className="text-green-600 font-semibold hover:underline"
                                        >
                                            Resend code
                                        </button>
                                    ) : (
                                        <span>
                                            Resend in{' '}
                                            <span className="font-semibold text-gray-700">{resendTimer}s</span>
                                        </span>
                                    )}
                                </div>
                            </form>
                        )}

                        {/* ── Step 3 ── */}
                        {step === 3 && (
                            <form onSubmit={handleResetPassword} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Minimum 6 characters"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors pr-12"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl"
                                        >
                                            {showPassword ? '🙈' : '👁'}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Confirm Password
                                    </label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter your password"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
                                    />
                                </div>

                                {/* Password strength */}
                                {newPassword && (
                                    <div className="space-y-1">
                                        {[
                                            { label: 'At least 6 characters', ok: newPassword.length >= 6 },
                                            { label: 'Contains a number', ok: /\d/.test(newPassword) },
                                            { label: 'Passwords match', ok: newPassword === confirmPassword && confirmPassword !== '' },
                                        ].map(({ label, ok }) => (
                                            <div key={label} className="flex items-center gap-2 text-xs">
                                                <span className={ok ? 'text-green-500' : 'text-gray-300'}>
                                                    {ok ? '✓' : '○'}
                                                </span>
                                                <span className={ok ? 'text-green-700' : 'text-gray-400'}>{label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Resetting…
                                        </span>
                                    ) : (
                                        'Set New Password ✓'
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Back link */}
                        <button
                            type="button"
                            onClick={onBack}
                            className="mt-6 w-full text-center text-sm text-gray-500 hover:text-green-600 transition-colors"
                        >
                            ← Back to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
