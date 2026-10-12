import React, { useState } from 'react';
import { mockStore } from '../../mock/mockStore';

export default function NurseryProfileView({ onOpenRegisterModal }) {
    const nursery = mockStore.getCurrentNursery();

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(nursery?.name || '');
    const [license, setLicense] = useState(nursery?.license_number || '');
    const [operatorName, setOperatorName] = useState(nursery?.operator_name || '');
    const [polyhouseArea, setPolyhouseArea] = useState(nursery?.polyhouse_area || '');
    const [monthlyCapacity, setMonthlyCapacity] = useState(nursery?.monthly_capacity || '');
    const [street, setStreet] = useState(nursery?.address?.street || '');
    const [phone, setPhone] = useState(nursery?.mobile_number || '');
    const [email, setEmail] = useState(nursery?.email || '');
    const [savedToast, setSavedToast] = useState(false);

    const handleSave = (e) => {
        e.preventDefault();
        if (nursery) {
            nursery.name = name;
            nursery.license_number = license;
            nursery.operator_name = operatorName;
            nursery.polyhouse_area = polyhouseArea;
            nursery.monthly_capacity = monthlyCapacity;
            if (!nursery.address) nursery.address = {};
            nursery.address.street = street;
            nursery.mobile_number = phone;
            nursery.email = email;
            mockStore.saveState();
        }
        setIsEditing(false);
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 3000);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {savedToast && (
                <div className="p-4 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-md flex items-center justify-between">
                    <span>✓ Nursery entity profile successfully updated in live database!</span>
                    <button onClick={() => setSavedToast(false)} className="text-white font-bold">&times;</button>
                </div>
            )}

            {/* Profile Card */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-100 pb-6">
                    <div className="flex items-center gap-4">
                        <img
                            src={nursery?.avatar_url || 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=300&auto=format&fit=crop&q=80'}
                            alt="Nursery logo"
                            className="w-16 h-16 rounded-3xl object-cover border-2 border-emerald-500 shadow-md"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-black text-gray-900">{nursery?.name || 'Sunrise Agro Nursery'}</h3>
                                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                                    <span>🛡️</span> Verified Entity
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                License: <strong className="font-mono text-gray-800">{nursery?.license_number || 'NUR-KA-2024-5519'}</strong> &bull; {nursery?.accreditation || 'NHB Certified 4-Star'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                            {isEditing ? 'Cancel Edit' : '✏️ Edit Profile'}
                        </button>
                        <button
                            onClick={onOpenRegisterModal}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md"
                        >
                            + Register New Nursery
                        </button>
                    </div>
                </div>

                {/* Form or Display */}
                {isEditing ? (
                    <form onSubmit={handleSave} className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block font-bold text-gray-700">Official Nursery Business Name:</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-bold"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block font-bold text-gray-700">Horticulture Dept License No:</label>
                                <input
                                    type="text"
                                    value={license}
                                    onChange={(e) => setLicense(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-mono font-bold"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="block font-bold text-gray-700">Lead Horticulturist / Operator:</label>
                                <input
                                    type="text"
                                    value={operatorName}
                                    onChange={(e) => setOperatorName(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block font-bold text-gray-700">Protected Polyhouse Area:</label>
                                <input
                                    type="text"
                                    value={polyhouseArea}
                                    onChange={(e) => setPolyhouseArea(e.target.value)}
                                    placeholder="e.g. 3.5 Acres Polyhouse"
                                    className="w-full p-2.5 border border-gray-300 rounded-xl"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block font-bold text-gray-700">Monthly Seedling Output:</label>
                                <input
                                    type="text"
                                    value={monthlyCapacity}
                                    onChange={(e) => setMonthlyCapacity(e.target.value)}
                                    placeholder="e.g. 1,50,000 Seedlings"
                                    className="w-full p-2.5 border border-gray-300 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="block font-bold text-gray-700">Nursery Gate Address:</label>
                                <input
                                    type="text"
                                    value={street}
                                    onChange={(e) => setStreet(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block font-bold text-gray-700">Contact Mobile:</label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-mono"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block font-bold text-gray-700">Contact Email:</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-mono"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md"
                            >
                                ✓ Save Entity Changes
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                            <span className="text-gray-400 uppercase text-[10px] font-bold block">Operator & Contact</span>
                            <span className="font-extrabold text-gray-900 block text-sm">{nursery?.operator_name || 'Anand Rao'}</span>
                            <span className="text-gray-600 block">{nursery?.mobile_number}</span>
                            <span className="text-gray-600 font-mono text-[11px] block">{nursery?.email}</span>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                            <span className="text-gray-400 uppercase text-[10px] font-bold block">Infrastructure</span>
                            <span className="font-extrabold text-gray-900 block text-sm">{nursery?.polyhouse_area || '3.5 Acres Polyhouse'}</span>
                            <span className="text-gray-600 block">Monthly Capacity: {nursery?.monthly_capacity || '1.5 Lakh Plugs'}</span>
                            <span className="text-emerald-700 font-bold text-[11px] block">✓ Mist Chamber & Hardening Yard</span>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                            <span className="text-gray-400 uppercase text-[10px] font-bold block">Location & Dispatch</span>
                            <span className="font-extrabold text-gray-900 block text-sm">
                                {nursery?.address?.street || 'State Highway 17, Maddur'}
                            </span>
                            <span className="text-gray-600 block">District: Mandya, Karnataka</span>
                            <span className="text-gray-600 text-[11px] block">Gate Timings: {nursery?.pickup_timings || 'Mon–Sat: 7:30 AM – 6:00 PM'}</span>
                        </div>
                    </div>
                )}

                {/* Specialties Tag Cloud */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-700 block">Certified Plant Material Specializations:</span>
                    <div className="flex flex-wrap gap-2">
                        {(nursery?.specialties || ['Vegetable Seedlings', 'Certified Seeds', 'Fruit Grafts', 'Timber Saplings']).map((spec, sidx) => (
                            <span key={sidx} className="px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold">
                                🌿 {spec}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
