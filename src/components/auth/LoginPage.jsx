import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSPAuth } from '../../contexts/SPAuthContext';
import { isValidEmail } from '../../utils/authUtils';
import DemoBanner from '../demo/DemoBanner';

const LoginPage = ({
    onLoginSuccess,
    onNavigateToRegister,
    onForgotPassword,
    onSPLoginSuccess,
    onNavigateToSPRegister,
}) => {
    const { login: farmLogin } = useAuth();
    const { login: spLogin } = useSPAuth();

    // 'farmer' | 'sp'
    const [loginRole, setLoginRole] = useState('farmer');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!isValidEmail(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        setErrors({});

        try {
            if (loginRole === 'farmer') {
                const result = await farmLogin(formData.email, formData.password);
                if (result.success) {
                    onLoginSuccess(result);
                } else {
                    setErrors({ general: result.error || 'Login failed' });
                }
            } else {
                // Service Provider login
                const result = await spLogin(formData.email, formData.password);
                if (onSPLoginSuccess) {
                    onSPLoginSuccess(result);
                } else {
                    window.location.href = '/sp/dashboard';
                }
            }
        } catch (error) {
            setErrors({ general: error.message || 'An unexpected error occurred' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-6">
                    <div className="inline-block p-3.5 bg-green-600 rounded-3xl mb-3 shadow-lg shadow-green-600/30">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">FarmSight 360</h1>
                    <p className="text-xs text-gray-600 mt-1 font-medium">Yield, Workforce &amp; Services Platform</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                    {/* Role Selector Tabs */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-2xl mb-6 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => { setLoginRole('farmer'); setErrors({}); }}
                            className={`py-2.5 px-3 rounded-xl transition-all ${
                                loginRole === 'farmer'
                                    ? 'bg-white text-green-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            🌾 Farmer Login
                        </button>
                        <button
                            type="button"
                            onClick={() => { setLoginRole('sp'); setErrors({}); }}
                            className={`py-2.5 px-3 rounded-xl transition-all ${
                                loginRole === 'sp'
                                    ? 'bg-white text-teal-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            🧑‍🔧 Service Provider
                        </button>
                    </div>

                    <div className="mb-5">
                        <h2 className="text-xl font-bold text-gray-800">
                            {loginRole === 'farmer' ? 'Farmer Sign In' : 'Service Provider Portal'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {loginRole === 'farmer'
                                ? 'Access your crops, workforce, and farm finances'
                                : 'Manage your contract service requests and calendar'}
                        </p>
                    </div>

                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                            {errors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                    errors.email ? 'border-red-500' : 'border-gray-200 bg-gray-50/50'
                                }`}
                                placeholder={loginRole === 'farmer' ? 'farmer@example.com' : 'provider@example.com'}
                                disabled={isLoading}
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                    errors.password ? 'border-red-500' : 'border-gray-200 bg-gray-50/50'
                                }`}
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                            )}
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between text-xs">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    disabled={isLoading}
                                />
                                <span className="ml-2 text-gray-600">Remember me</span>
                            </label>
                            {loginRole === 'farmer' && (
                                <button
                                    type="button"
                                    onClick={onForgotPassword}
                                    className="text-green-600 hover:text-green-700 font-semibold"
                                    disabled={isLoading}
                                >
                                    Forgot password?
                                </button>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 ${
                                loginRole === 'farmer'
                                    ? 'bg-green-600 hover:bg-green-700 shadow-green-600/30'
                                    : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30'
                            }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Signing in...
                                </span>
                            ) : (
                                loginRole === 'farmer' ? 'Sign In as Farmer' : 'Sign In to Provider Portal'
                            )}
                        </button>
                    </form>

                    {/* Registration switch link */}
                    <div className="mt-6 text-center text-xs text-gray-600 pt-4 border-t border-gray-100">
                        {loginRole === 'farmer' ? (
                            <p>
                                Don't have a farm account?{' '}
                                <button
                                    type="button"
                                    onClick={onNavigateToRegister}
                                    className="text-green-600 hover:text-green-700 font-bold hover:underline"
                                    disabled={isLoading}
                                >
                                    Register now
                                </button>
                            </p>
                        ) : (
                            <p>
                                Are you a contractor or firm?{' '}
                                <button
                                    type="button"
                                    onClick={onNavigateToSPRegister}
                                    className="text-teal-600 hover:text-teal-700 font-bold hover:underline"
                                    disabled={isLoading}
                                >
                                    Register as Service Provider
                                </button>
                            </p>
                        )}
                    </div>
                </div>

                {/* 1-Click Live Demo Showcase Launcher */}
                <DemoBanner />

                {/* Footer */}
                <div className="mt-6 text-center text-xs text-gray-500">
                    <p>© 2026 FarmSight 360 • Isolated Workforce Verticals</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
