import React, { useState } from 'react';
import { useSPAuth } from '../../contexts/SPAuthContext';

const SPRegisterPage = ({ onNavigateToLogin, onRegisterSuccess }) => {
    const { register } = useSPAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        type: 'individual', // 'individual' | 'firm'
        totalWorkers: 1,
        phone: '',
        location: '',
        bio: '',
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'totalWorkers' ? Number(value) : value,
        }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleTypeChange = (newType) => {
        setFormData(prev => ({
            ...prev,
            type: newType,
            totalWorkers: newType === 'individual' ? 1 : Math.max(2, prev.totalWorkers || 5),
        }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name or Firm Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
        if (!formData.password || formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }
        if (formData.type === 'firm' && (!formData.totalWorkers || formData.totalWorkers < 1)) {
            newErrors.totalWorkers = 'Total workers must be at least 1';
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
            const res = await register({
                ...formData,
                totalWorkers: formData.type === 'individual' ? 1 : formData.totalWorkers,
            });
            if (onRegisterSuccess) onRegisterSuccess(res);
        } catch (err) {
            setErrors({ general: err.message || 'Registration failed' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-8 sm:p-10 my-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-emerald-600 rounded-2xl mb-3 shadow-lg shadow-emerald-600/30 text-white">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                        Join as a Service Provider
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Register your contract workforce or individual skills to get booked by farms.
                    </p>
                </div>

                {errors.general && (
                    <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs text-rose-700 dark:text-rose-400">
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    {/* Provider Type Segmented Toggle */}
                    <div>
                        <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            Provider Structure
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-slate-700/60 rounded-xl">
                            <button
                                type="button"
                                onClick={() => handleTypeChange('individual')}
                                className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                                    formData.type === 'individual'
                                        ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                                }`}
                            >
                                👤 Individual Worker
                            </button>
                            <button
                                type="button"
                                onClick={() => handleTypeChange('firm')}
                                className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                                    formData.type === 'firm'
                                        ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                                }`}
                            >
                                🏢 Workforce Firm / Agency
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                {formData.type === 'firm' ? 'Agency / Firm Name' : 'Full Name'} *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder={formData.type === 'firm' ? 'e.g. GreenAgri Workforce Ltd' : 'e.g. Ramesh Kumar'}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                            {errors.name && <p className="text-rose-600 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="provider@example.com"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                            {errors.email && <p className="text-rose-600 mt-1">{errors.email}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Password (min. 8 chars) *
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                            {errors.password && <p className="text-rose-600 mt-1">{errors.password}</p>}
                        </div>

                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="9876543210"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Primary Location / Region
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g. Pune & Satara District"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                        </div>

                        {formData.type === 'firm' && (
                            <div>
                                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Total Available Workers (Capacity) *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="500"
                                    name="totalWorkers"
                                    value={formData.totalWorkers}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                />
                                {errors.totalWorkers && <p className="text-rose-600 mt-1">{errors.totalWorkers}</p>}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Bio / Specialization Overview
                        </label>
                        <textarea
                            rows={3}
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Describe your capabilities, years of experience, specialized equipment..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Creating Provider Account...</span>
                            </>
                        ) : (
                            <span>Register as Service Provider</span>
                        )}
                    </button>

                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={onNavigateToLogin}
                            className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                        >
                            Already registered? Sign in to Provider Portal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SPRegisterPage;
