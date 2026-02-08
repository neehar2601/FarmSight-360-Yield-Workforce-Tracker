import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const FarmSelector = ({ onFarmSelected, onAddFarm }) => {
    const { currentUser, switchFarm } = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleSelectFarm = async (farmId) => {
        setIsLoading(true);
        setError('');

        try {
            const result = await switchFarm(farmId);

            if (result.success) {
                onFarmSelected(result.farm);
            } else {
                setError(result.error || 'Failed to select farm');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentUser || !currentUser.farms) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Select Your Farm</h1>
                    <p className="text-gray-600">Choose which farm you want to manage</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Farm Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {currentUser.farms.map((farm) => (
                        <div
                            key={farm.id}
                            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500"
                            onClick={() => !isLoading && handleSelectFarm(farm.id)}
                        >
                            {/* Farm Icon */}
                            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 mx-auto">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </div>

                            {/* Farm Details */}
                            <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">
                                {farm.name}
                            </h3>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center justify-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {farm.location}
                                </div>

                                {farm.area && (
                                    <div className="flex items-center justify-center">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                        </svg>
                                        {farm.area} {farm.areaUnit}
                                    </div>
                                )}
                            </div>

                            {/* Select Button */}
                            <button
                                className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium transition-colors disabled:opacity-50"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Selecting...' : 'Select Farm'}
                            </button>
                        </div>
                    ))}

                    {/* Add New Farm Card */}
                    <div
                        className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-dashed border-gray-300 hover:border-green-500 flex flex-col items-center justify-center"
                        onClick={() => !isLoading && onAddFarm()}
                    >
                        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-600 text-center">
                            Add New Farm
                        </h3>
                        <p className="text-sm text-gray-500 text-center mt-2">
                            Create a new farm to manage
                        </p>
                    </div>
                </div>

                {/* User Info */}
                <div className="text-center text-sm text-gray-600">
                    <p>Logged in as <span className="font-medium">{currentUser.name}</span></p>
                </div>
            </div>
        </div>
    );
};

export default FarmSelector;
