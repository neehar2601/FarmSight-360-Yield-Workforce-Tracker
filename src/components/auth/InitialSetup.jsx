import React, { useState } from 'react';

const InitialSetup = ({ onComplete, onSkip }) => {
    const [formData, setFormData] = useState({
        openingRevenue: '',
        openingExpenses: '',
        openingDate: new Date().toISOString().split('T')[0]
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (formData.openingRevenue && isNaN(formData.openingRevenue)) {
            newErrors.openingRevenue = 'Must be a valid number';
        }

        if (formData.openingExpenses && isNaN(formData.openingExpenses)) {
            newErrors.openingExpenses = 'Must be a valid number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);

        try {
            const financialData = {
                revenue: formData.openingRevenue ? parseFloat(formData.openingRevenue) : 0,
                expenses: formData.openingExpenses ? parseFloat(formData.openingExpenses) : 0,
                date: formData.openingDate
            };

            onComplete(financialData);
        } catch (error) {
            setErrors({ general: 'Failed to save financial data' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        onSkip();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-green-600 rounded-full mb-4">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Initial Setup</h1>
                    <p className="text-gray-600">Enter your opening financial balance (optional)</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Opening Balance</h2>

                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {errors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Opening Revenue */}
                        <div>
                            <label htmlFor="openingRevenue" className="block text-sm font-medium text-gray-700 mb-1">
                                Opening Revenue (₹)
                            </label>
                            <input
                                type="number"
                                id="openingRevenue"
                                name="openingRevenue"
                                value={formData.openingRevenue}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.openingRevenue ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="0"
                                step="0.01"
                                disabled={isLoading}
                            />
                            {errors.openingRevenue && (
                                <p className="mt-1 text-sm text-red-600">{errors.openingRevenue}</p>
                            )}
                        </div>

                        {/* Opening Expenses */}
                        <div>
                            <label htmlFor="openingExpenses" className="block text-sm font-medium text-gray-700 mb-1">
                                Opening Expenses (₹)
                            </label>
                            <input
                                type="number"
                                id="openingExpenses"
                                name="openingExpenses"
                                value={formData.openingExpenses}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.openingExpenses ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="0"
                                step="0.01"
                                disabled={isLoading}
                            />
                            {errors.openingExpenses && (
                                <p className="mt-1 text-sm text-red-600">{errors.openingExpenses}</p>
                            )}
                        </div>

                        {/* Opening Date */}
                        <div>
                            <label htmlFor="openingDate" className="block text-sm font-medium text-gray-700 mb-1">
                                As of Date
                            </label>
                            <input
                                type="date"
                                id="openingDate"
                                name="openingDate"
                                value={formData.openingDate}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex">
                                <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-blue-800">
                                    This is optional. You can enter your current financial position to start tracking from today. You can skip this step and start fresh.
                                </p>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={handleSkip}
                                disabled={isLoading}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 focus:ring-4 focus:ring-gray-300 font-medium transition-colors disabled:opacity-50"
                            >
                                Skip
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Saving...' : 'Continue'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InitialSetup;
