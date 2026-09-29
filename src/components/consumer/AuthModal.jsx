import React, { useState } from 'react';
import { mockStore } from '../../mock/mockStore';

export default function AuthModal({ isOpen, onClose, defaultTab = 'retail', onAuthenticated }) {
    const [tab, setTab] = useState(defaultTab); // 'retail' | 'b2b' | 'login'

    // Retail form
    const [retailForm, setRetailForm] = useState({
        name: '',
        email: '',
        mobile_number: '',
        street: '',
        city: 'Bengaluru',
        pincode: '560103',
    });

    // B2B form
    const [b2bForm, setB2BForm] = useState({
        name: '',
        email: '',
        mobile_number: '',
        company_name: '',
        business_type: 'Supermarket Chain',
        gstin: '',
        warehouse_address: '',
    });

    // Login form
    const [loginEmail, setLoginEmail] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    // Quick Autofill Presets
    const handleAutofillRetail = () => {
        setRetailForm({
            name: 'Priya Sharma',
            email: 'priya.sharma@example.com',
            mobile_number: '+91 98765 43210',
            street: 'Flat 402, Green Glen Layout, Outer Ring Road, Bellandur',
            city: 'Bengaluru',
            pincode: '560103',
        });
        setError('');
    };

    const handleAutofillB2B = () => {
        setB2BForm({
            name: 'Rajesh Gupta',
            email: 'procurement@freshmart.in',
            mobile_number: '+91 91234 56789',
            company_name: 'FreshMart Supermarkets Pvt Ltd',
            business_type: 'Supermarket Chain (12 Outlets)',
            gstin: '29ABCDE1234F1Z5',
            warehouse_address: 'Central Warehouse Plot 14, APMC Yard, Yeshwanthpur, Bengaluru 560022',
        });
        setError('');
    };

    const handleRegisterRetail = (e) => {
        e.preventDefault();
        setError('');
        if (!retailForm.name || !retailForm.email || !retailForm.mobile_number) {
            setError('Please fill in name, email, and phone number');
            return;
        }

        const res = mockStore.registerCustomer({
            name: retailForm.name,
            email: retailForm.email,
            mobile_number: retailForm.mobile_number,
            address: {
                street: retailForm.street,
                city: retailForm.city,
                state: 'Karnataka',
                pincode: retailForm.pincode,
            },
        });

        if (res.error) {
            setError(res.error);
        } else {
            if (onAuthenticated) onAuthenticated(res.data);
            onClose();
        }
    };

    const handleRegisterB2B = (e) => {
        e.preventDefault();
        setError('');
        if (!b2bForm.name || !b2bForm.email || !b2bForm.company_name || !b2bForm.gstin) {
            setError('Company Name, GSTIN, and contact details are required for B2B registration');
            return;
        }

        // Basic GSTIN validation format (15 characters)
        if (b2bForm.gstin.length < 10) {
            setError('Please provide a valid GSTIN / Tax ID');
            return;
        }

        const res = mockStore.registerB2BBuyer({
            name: b2bForm.name,
            email: b2bForm.email,
            mobile_number: b2bForm.mobile_number,
            b2b_profile: {
                company_name: b2bForm.company_name,
                business_type: b2bForm.business_type,
                gstin: b2bForm.gstin,
                warehouse_address: b2bForm.warehouse_address,
            },
        });

        if (res.error) {
            setError(res.error);
        } else {
            if (onAuthenticated) onAuthenticated(res.data);
            onClose();
        }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        const res = mockStore.login(loginEmail);
        if (res.error) {
            setError(res.error);
        } else {
            if (onAuthenticated) onAuthenticated(res.data);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                        <h3 className="text-xl font-extrabold text-gray-900">Buyer Registration & Login</h3>
                        <p className="text-xs text-gray-500">Registration is required to purchase and place orders</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                        &times;
                    </button>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-3 p-1 bg-gray-100 rounded-2xl text-xs font-bold">
                    <button
                        type="button"
                        onClick={() => { setTab('retail'); setError(''); }}
                        className={`py-2 rounded-xl transition-all ${
                            tab === 'retail' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        🛒 Direct Retail
                    </button>
                    <button
                        type="button"
                        onClick={() => { setTab('b2b'); setError(''); }}
                        className={`py-2 rounded-xl transition-all ${
                            tab === 'b2b' ? 'bg-white text-indigo-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        🏢 Wholesale B2B
                    </button>
                    <button
                        type="button"
                        onClick={() => { setTab('login'); setError(''); }}
                        className={`py-2 rounded-xl transition-all ${
                            tab === 'login' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        🔑 Sign In
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                        {error}
                    </div>
                )}

                {/* TAB 1: RETAIL CONSUMER REGISTRATION */}
                {tab === 'retail' && (
                    <form onSubmit={handleRegisterRetail} className="space-y-3 text-xs">
                        <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between">
                            <span className="text-emerald-800 font-medium">Quick Test Mode:</span>
                            <button
                                type="button"
                                onClick={handleAutofillRetail}
                                className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-800"
                            >
                                ⚡ Fill as Priya (Consumer)
                            </button>
                        </div>

                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Priya Sharma"
                                value={retailForm.name}
                                onChange={(e) => setRetailForm({ ...retailForm, name: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="font-bold text-gray-700 block mb-1">Mobile Number</label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="+91 98765 43210"
                                    value={retailForm.mobile_number}
                                    onChange={(e) => setRetailForm({ ...retailForm, mobile_number: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                                />
                            </div>
                            <div>
                                <label className="font-bold text-gray-700 block mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="priya@example.com"
                                    value={retailForm.email}
                                    onChange={(e) => setRetailForm({ ...retailForm, email: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Delivery Address</label>
                            <input
                                type="text"
                                placeholder="Flat, Street, Landmark"
                                value={retailForm.street}
                                onChange={(e) => setRetailForm({ ...retailForm, street: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="font-bold text-gray-700 block mb-1">City</label>
                                <input
                                    type="text"
                                    value={retailForm.city}
                                    onChange={(e) => setRetailForm({ ...retailForm, city: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                                />
                            </div>
                            <div>
                                <label className="font-bold text-gray-700 block mb-1">Pincode</label>
                                <input
                                    type="text"
                                    value={retailForm.pincode}
                                    onChange={(e) => setRetailForm({ ...retailForm, pincode: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all mt-2"
                        >
                            Register Direct Consumer Account
                        </button>
                    </form>
                )}

                {/* TAB 2: B2B WHOLESALE REGISTRATION */}
                {tab === 'b2b' && (
                    <form onSubmit={handleRegisterB2B} className="space-y-3 text-xs">
                        <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl flex items-center justify-between">
                            <span className="text-indigo-800 font-medium">Quick Test Mode:</span>
                            <button
                                type="button"
                                onClick={handleAutofillB2B}
                                className="px-2.5 py-1 bg-indigo-700 text-white rounded-lg text-[11px] font-bold hover:bg-indigo-800"
                            >
                                ⚡ Fill as FreshMart (B2B)
                            </button>
                        </div>

                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Company / Enterprise Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. FreshMart Supermarkets Pvt Ltd"
                                value={b2bForm.company_name}
                                onChange={(e) => setB2BForm({ ...b2bForm, company_name: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="font-bold text-gray-700 block mb-1">Business Type</label>
                                <select
                                    value={b2bForm.business_type}
                                    onChange={(e) => setB2BForm({ ...b2bForm, business_type: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                                >
                                    <option value="Supermarket Chain">Supermarket Chain</option>
                                    <option value="Retail Grocery Store">Retail Grocery Store</option>
                                    <option value="Restaurant / Hotel Chain">Restaurant / Hotel Chain</option>
                                    <option value="Food Processing Unit">Food Processing Unit</option>
                                    <option value="Agri Wholesale Trader">Agri Wholesale Trader</option>
                                </select>
                            </div>
                            <div>
                                <label className="font-bold text-gray-700 block mb-1">GSTIN / Tax ID</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="29ABCDE1234F1Z5"
                                    value={b2bForm.gstin}
                                    onChange={(e) => setB2BForm({ ...b2bForm, gstin: e.target.value.toUpperCase() })}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-mono font-medium uppercase"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="font-bold text-gray-700 block mb-1">Contact Person Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Rajesh Gupta"
                                    value={b2bForm.name}
                                    onChange={(e) => setB2BForm({ ...b2bForm, name: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                                />
                            </div>
                            <div>
                                <label className="font-bold text-gray-700 block mb-1">Business Email</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="procurement@freshmart.in"
                                    value={b2bForm.email}
                                    onChange={(e) => setB2BForm({ ...b2bForm, email: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Warehouse / Depot Delivery Address</label>
                            <input
                                type="text"
                                placeholder="Plot, APMC Yard, Logistics Hub"
                                value={b2bForm.warehouse_address}
                                onChange={(e) => setB2BForm({ ...b2bForm, warehouse_address: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all mt-2"
                        >
                            Register Verified B2B Wholesale Buyer
                        </button>
                    </form>
                )}

                {/* TAB 3: SIGN IN */}
                {tab === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-4 text-xs">
                        <p className="text-gray-500 text-[11px]">Select or enter an existing registered account email:</p>

                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => {
                                    mockStore.setCurrentUser('user-customer-1');
                                    onClose();
                                }}
                                className="w-full p-3 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all flex items-center justify-between"
                            >
                                <div>
                                    <span className="font-bold text-gray-800 block text-xs">Priya Sharma</span>
                                    <span className="text-[10px] text-gray-500">priya.sharma@example.com &bull; Retail Consumer</span>
                                </div>
                                <span className="text-xs text-emerald-700 font-extrabold">1-Click Sign In &rarr;</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    mockStore.setCurrentUser('user-b2b-1');
                                    onClose();
                                }}
                                className="w-full p-3 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition-all flex items-center justify-between"
                            >
                                <div>
                                    <span className="font-bold text-gray-800 block text-xs">FreshMart Supermarkets</span>
                                    <span className="text-[10px] text-gray-500">procurement@freshmart.in &bull; B2B Wholesale Retailer</span>
                                </div>
                                <span className="text-xs text-indigo-700 font-extrabold">1-Click Sign In &rarr;</span>
                            </button>
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                            <label className="font-bold text-gray-700 block mb-1">Or enter account email</label>
                            <input
                                type="email"
                                placeholder="your-email@domain.com"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium mb-3"
                            />
                            <button
                                type="submit"
                                className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold shadow-md"
                            >
                                Sign In
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
