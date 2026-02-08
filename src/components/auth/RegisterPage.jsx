import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { isValidEmail, isValidPassword, emailExists } from '../../utils/authUtils';

const RegisterPage = ({ onRegisterSuccess, onNavigateToLogin }) => {
    const { register } = useAuth();
    const [step, setStep] = useState(1); // 1: User details, 2: Farm details
    const [formData, setFormData] = useState({
        // User details
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        // Farm details
        farmName: '',
        location: '',
        area: '',
        areaUnit: 'acres'
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateStep1 = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!isValidEmail(formData.email)) {
            newErrors.email = 'Invalid email format';
        } else if (emailExists(formData.email)) {
            newErrors.email = 'Email already exists';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (!isValidPassword(formData.password)) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors = {};

        if (!formData.farmName.trim()) {
            newErrors.farmName = 'Farm name is required';
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
        }

        if (formData.area && isNaN(formData.area)) {
            newErrors.area = 'Area must be a number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep2()) return;

        setIsLoading(true);
        setErrors({});

        try {
            const userData = {
                name: formData.name,
                email: formData.email,
                password: formData.password
            };

            const farmData = {
                name: formData.farmName,
                location: formData.location,
                area: formData.area ? parseFloat(formData.area) : null,
                areaUnit: formData.areaUnit
            };

            const result = await register(userData, farmData);

            if (result.success) {
                onRegisterSuccess(result);
            } else {
                setErrors({ general: result.error || 'Registration failed' });
            }
        } catch (error) {
            setErrors({ general: 'An unexpected error occurred' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-green-600 rounded-full mb-4">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">FarmSight 360</h1>
                    <p className="text-gray-600">Create Your Account</p>
                </div>

                {/* Registration Form */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center mb-6">
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                                }`}>
                                1
                            </div>
                            <div className={`w-16 h-1 ${step >= 2 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                                }`}>
                                2
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                        {step === 1 ? 'User Details' : 'Farm Details'}
                    </h2>

                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {errors.general}
                        </div>
                    )}

                    {/* Step 1: User Details */}
                    {step === 1 && (
                        <form className="space-y-4">
                            {/* Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="John Doe"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="you@example.com"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.password ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="••••••••"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password *
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="••••••••"
                                />
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                                )}
                            </div>

                            {/* Next Button */}
                            <button
                                type="button"
                                onClick={handleNext}
                                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium transition-colors"
                            >
                                Next: Farm Details
                            </button>
                        </form>
                    )}

                    {/* Step 2: Farm Details */}
                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Farm Name */}
                            <div>
                                <label htmlFor="farmName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Farm Name *
                                </label>
                                <input
                                    type="text"
                                    id="farmName"
                                    name="farmName"
                                    value={formData.farmName}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.farmName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Green Valley Farm"
                                    disabled={isLoading}
                                />
                                {errors.farmName && (
                                    <p className="mt-1 text-sm text-red-600">{errors.farmName}</p>
                                )}
                            </div>

                            {/* Location */}
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                                    Location *
                                </label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.location ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Maharashtra, India"
                                    disabled={isLoading}
                                />
                                {errors.location && (
                                    <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                                )}
                            </div>

                            {/* Area */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                                        Area (Optional)
                                    </label>
                                    <input
                                        type="number"
                                        id="area"
                                        name="area"
                                        value={formData.area}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.area ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="10"
                                        step="0.01"
                                        disabled={isLoading}
                                    />
                                    {errors.area && (
                                        <p className="mt-1 text-sm text-red-600">{errors.area}</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="areaUnit" className="block text-sm font-medium text-gray-700 mb-1">
                                        Unit
                                    </label>
                                    <select
                                        id="areaUnit"
                                        name="areaUnit"
                                        value={formData.areaUnit}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        disabled={isLoading}
                                    >
                                        <option value="acres">Acres</option>
                                        <option value="hectares">Hectares</option>
                                    </select>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    disabled={isLoading}
                                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 focus:ring-4 focus:ring-gray-300 font-medium transition-colors disabled:opacity-50"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating...
                                        </span>
                                    ) : (
                                        'Create Account'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <button
                                onClick={onNavigateToLogin}
                                className="text-green-600 hover:text-green-700 font-medium"
                                disabled={isLoading}
                            >
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-gray-600">
                    <p>© 2026 FarmSight 360. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
