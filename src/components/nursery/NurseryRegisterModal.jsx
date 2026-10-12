import React, { useState } from 'react';
import { mockStore } from '../../mock/mockStore';

export default function NurseryRegisterModal({ isOpen, onClose, onRegistered }) {
    if (!isOpen) return null;

    const [nurseryName, setNurseryName] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [operatorName, setOperatorName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [polyhouseArea, setPolyhouseArea] = useState('2.5 Acres Polyhouse');
    const [monthlyCapacity, setMonthlyCapacity] = useState('1,00,000 Seedlings');
    const [selectedSpecialties, setSelectedSpecialties] = useState([
        'Vegetable Seedlings',
        'Certified Seeds',
    ]);
    const [error, setError] = useState('');

    const allSpecialties = [
        'Vegetable Seedlings',
        'Fruit Plants / Grafts',
        'Certified Seeds',
        'Commercial Timber / Plantation',
        'Flowers & Ornamentals',
        'Medicinal & Aromatic Plants',
    ];

    const toggleSpecialty = (item) => {
        if (selectedSpecialties.includes(item)) {
            setSelectedSpecialties(selectedSpecialties.filter(s => s !== item));
        } else {
            setSelectedSpecialties([...selectedSpecialties, item]);
        }
    };

    const handleRegister = (e) => {
        e.preventDefault();
        setError('');

        if (!nurseryName.trim()) {
            setError('Please enter nursery entity name.');
            return;
        }
        if (!email.trim()) {
            setError('Please enter contact email.');
            return;
        }

        const res = mockStore.registerNurseryVendor({
            name: nurseryName.trim(),
            license_number: licenseNumber.trim() || undefined,
            operator_name: operatorName.trim() || undefined,
            email: email.trim(),
            mobile_number: mobileNumber.trim() || undefined,
            address: streetAddress.trim() || undefined,
            polyhouse_area: polyhouseArea,
            monthly_capacity: monthlyCapacity,
            specialties: selectedSpecialties,
        });

        if (res.error) {
            setError(res.error);
        } else {
            if (onRegistered) onRegistered(res.data);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[92vh] overflow-y-auto border border-gray-100 animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-bold">
                            🌱
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Register Nursery as Separate Entity</h3>
                            <p className="text-xs text-gray-500">
                                Onboard your certified commercial nursery to sell seeds and saplings to farmers
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                    >
                        &times;
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4 text-xs">
                    <div className="space-y-1">
                        <label className="block font-bold text-gray-700">Official Nursery Business Name *</label>
                        <input
                            type="text"
                            value={nurseryName}
                            onChange={(e) => setNurseryName(e.target.value)}
                            placeholder="e.g. Deccan Green Horticultural Nursery"
                            className="w-full p-2.5 border border-gray-300 rounded-xl font-bold focus:border-emerald-500 focus:outline-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="block font-bold text-gray-700">Horticulture License No. (Optional)</label>
                            <input
                                type="text"
                                value={licenseNumber}
                                onChange={(e) => setLicenseNumber(e.target.value)}
                                placeholder="e.g. NUR-KA-2024-8841"
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-mono focus:border-emerald-500 focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block font-bold text-gray-700">Lead Horticulturist / Manager Name</label>
                            <input
                                type="text"
                                value={operatorName}
                                onChange={(e) => setOperatorName(e.target.value)}
                                placeholder="e.g. Anand Rao"
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="block font-bold text-gray-700">Official Contact Email *</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="contact@deccannursery.farm"
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block font-bold text-gray-700">Official Phone / Mobile</label>
                            <input
                                type="tel"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value)}
                                placeholder="+91 98451 22334"
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-mono focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block font-bold text-gray-700">Nursery Location & Gate Address</label>
                        <input
                            type="text"
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            placeholder="Plot 12-14, State Highway 17, Maddur Taluk, Mandya Dist, Karnataka"
                            className="w-full p-2.5 border border-gray-300 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="block font-bold text-gray-700">Polyhouse & Shade Net Area</label>
                            <input
                                type="text"
                                value={polyhouseArea}
                                onChange={(e) => setPolyhouseArea(e.target.value)}
                                placeholder="e.g. 3.0 Acres Polyhouse"
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block font-bold text-gray-700">Monthly Seedling Output</label>
                            <input
                                type="text"
                                value={monthlyCapacity}
                                onChange={(e) => setMonthlyCapacity(e.target.value)}
                                placeholder="e.g. 1,50,000 Seedlings"
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                            />
                        </div>
                    </div>

                    {/* Specializations checkbox pills */}
                    <div className="space-y-1.5 pt-1">
                        <label className="block font-bold text-gray-700">Plant Material Specializations:</label>
                        <div className="flex flex-wrap gap-2">
                            {allSpecialties.map((spec) => {
                                const isSelected = selectedSpecialties.includes(spec);
                                return (
                                    <button
                                        type="button"
                                        key={spec}
                                        onClick={() => toggleSpecialty(spec)}
                                        className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                                            isSelected
                                                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {isSelected ? '✓ ' : '+ '} {spec}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                        >
                            <span>✓</span> Complete Nursery Registration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
