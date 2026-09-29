import React, { useState, useEffect } from 'react';
import { mockStore } from './mock/mockStore';
import AuthApp from './AuthApp';
import ConsumerApp from './components/consumer/ConsumerApp';
import DepotApp from './components/depot/DepotApp';

export default function PrototypeShell() {
    const [activeRole, setActiveRole] = useState(mockStore.getActiveRole());
    const [, setTick] = useState(0);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

    useEffect(() => {
        const unsub = mockStore.subscribe(() => {
            setActiveRole(mockStore.getActiveRole());
            setTick(t => t + 1);
        });
        return unsub;
    }, []);

    const currentUser = mockStore.getCurrentUser();
    const storageSizeKB = mockStore.getStorageSizeKB();
    const lastSyncTime = mockStore.getLastSyncTime();

    const handleRoleChange = (role) => {
        mockStore.setActiveRole(role);
        setActiveRole(role);
    };

    const handleUserChange = (userId) => {
        mockStore.setCurrentUser(userId);
    };

    const handleReset = () => {
        if (window.confirm('Clear all marketplace data and reset to a clean slate (0 listings, 0 orders, 0 RFQs)? You can add fresh produce from the beginning.')) {
            mockStore.resetToDefault();
            setIsStorageModalOpen(false);
            window.location.reload();
        }
    };

    const handleExportBackup = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(mockStore.exportDatabase());
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `farm360_db_backup_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    const handleImportBackup = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const res = mockStore.importDatabase(event.target.result);
            if (res.error) {
                alert(`Import failed: ${res.error}`);
            } else {
                alert('Database successfully restored from backup file!');
                setIsStorageModalOpen(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="min-h-screen flex flex-col font-sans bg-gray-100">
            {/* ── TOP PROTOTYPE SWITCHER BAR ────────────────────────────────────── */}
            <div className="bg-gray-950 text-white border-b border-gray-800 sticky top-0 z-50 shadow-md">
                <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    {/* Left: Branding & Role Pills */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🌱</span>
                            <div>
                                <span className="font-extrabold tracking-tight text-white block leading-tight">
                                    farm360 <span className="text-emerald-400">Marketplace Prototype</span>
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                    Standalone Prototype &bull; Port 5180
                                </span>
                            </div>
                        </div>

                        {/* Center Role Buttons */}
                        <div className="bg-gray-900 p-1 rounded-xl flex items-center border border-gray-800">
                            <button
                                onClick={() => handleRoleChange('farmer')}
                                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                    activeRole === 'farmer'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <span>👨‍🌾</span> Farmer App
                            </button>

                            <button
                                onClick={() => handleRoleChange('consumer')}
                                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                    activeRole === 'consumer'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <span>🛒</span> Consumer & B2B Store
                            </button>

                            <button
                                onClick={() => handleRoleChange('depot')}
                                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                    activeRole === 'depot'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <span>🏢</span> Depot Inward Hub
                            </button>
                        </div>
                    </div>

                    {/* Right: Persona selector, Guide & Reset */}
                    <div className="flex items-center gap-3">
                        {/* Quick Persona Switch */}
                        <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-xl">
                            <span className="text-gray-400 text-[11px]">User:</span>
                            <select
                                value={currentUser?.id}
                                onChange={(e) => handleUserChange(e.target.value)}
                                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                            >
                                <option value="user-farmer-1" className="bg-gray-900 text-white">
                                    👨‍🌾 Ramesh Patel (Farmer)
                                </option>
                                <option value="user-customer-1" className="bg-gray-900 text-white">
                                    👤 Priya Sharma (Retail Consumer)
                                </option>
                                <option value="user-b2b-1" className="bg-gray-900 text-white">
                                    🏢 FreshMart Supermarkets (B2B Buyer)
                                </option>
                                <option value="user-admin-1" className="bg-gray-900 text-white">
                                    🛡️ Dr. Kiran Rao (Hub QA Inspector)
                                </option>
                            </select>
                        </div>

                        {/* Live Browser Storage Status Pill */}
                        <button
                            onClick={() => setIsStorageModalOpen(true)}
                            title="Data is persisted live in your browser's persistent cache across tabs and refreshes"
                            className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-inner"
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-[11px] whitespace-nowrap">Live Cache ({storageSizeKB} KB)</span>
                        </button>

                        {/* Interactive Testing Guide */}
                        <button
                            onClick={() => setIsGuideOpen(!isGuideOpen)}
                            className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl font-bold transition-all flex items-center gap-1 border border-gray-700"
                        >
                            <span>💡</span> Testing Guide
                        </button>

                        {/* Reset Data */}
                        <button
                            onClick={handleReset}
                            title="Reset all mock data back to initial clean state"
                            className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-all font-bold"
                        >
                            🔄
                        </button>
                    </div>
                </div>

                {/* ── EXPANDABLE TESTING GUIDE DRAWER ───────────────────────────── */}
                {isGuideOpen && (
                    <div className="bg-gray-900 border-t border-gray-800 p-5 text-gray-300 animate-in slide-in-from-top-2">
                        <div className="max-w-7xl mx-auto space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                                    <span>🧭</span> Interactive End-to-End Walkthrough Scenarios:
                                </h4>
                                <button
                                    onClick={() => setIsGuideOpen(false)}
                                    className="text-gray-400 hover:text-white text-xs font-bold"
                                >
                                    Close &times;
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] leading-relaxed">
                                {/* Flow 1 */}
                                <div className="bg-gray-950 p-3.5 rounded-2xl border border-emerald-500/30 space-y-1.5">
                                    <span className="font-black text-emerald-400 block uppercase tracking-wider text-[10px]">
                                        Scenario 1: Direct Farm Pickup (with 6-Digit PIN)
                                    </span>
                                    <ol className="list-decimal list-inside space-y-1 text-gray-300">
                                        <li>Switch to <strong>🛒 Consumer Store</strong>.</li>
                                        <li>Add Roma Tomatoes, select <strong>🚜 Farm Pickup</strong>, and complete checkout.</li>
                                        <li>Receive your <strong>6-digit pickup PIN (e.g. 482-910)</strong>.</li>
                                        <li>Switch to <strong>👨‍🌾 Farmer App</strong> &rarr; Click <strong>Marketplace &rarr; Orders Received</strong>.</li>
                                        <li>Click <strong>Verify Pickup PIN</strong>, enter the code, and confirm handover!</li>
                                    </ol>
                                </div>

                                {/* Flow 2 */}
                                <div className="bg-gray-950 p-3.5 rounded-2xl border border-blue-500/30 space-y-1.5">
                                    <span className="font-black text-blue-400 block uppercase tracking-wider text-[10px]">
                                        Scenario 2: Central Hub Consignment (Option 2)
                                    </span>
                                    <ol className="list-decimal list-inside space-y-1 text-gray-300">
                                        <li>In <strong>👨‍🌾 Farmer App</strong>, click <strong>Dispatch to Central Hub</strong>.</li>
                                        <li>Submit batch dispatch with vehicle number.</li>
                                        <li>Switch to <strong>🏢 Depot Inward Hub</strong> &rarr; Click <strong>Weigh, QA Inspect & Stock</strong>.</li>
                                        <li>Confirm inward inspection and publish to store.</li>
                                        <li>Switch to <strong>🛒 Consumer Store</strong> &rarr; Find it live under <strong>farm360 Assured</strong>!</li>
                                    </ol>
                                </div>

                                {/* Flow 3 */}
                                <div className="bg-gray-950 p-3.5 rounded-2xl border border-indigo-500/30 space-y-1.5">
                                    <span className="font-black text-indigo-400 block uppercase tracking-wider text-[10px]">
                                        Scenario 3: B2B Wholesale Bulk, RFQ & Freight Reception
                                    </span>
                                    <ol className="list-decimal list-inside space-y-1 text-gray-300">
                                        <li>In <strong>🛒 Store</strong>, toggle <strong>🏢 B2B Wholesale</strong> mode.</li>
                                        <li>Find wholesale crops &rarr; Click <strong>Request RFQ</strong> or Counter Offer.</li>
                                        <li>Farmer accepts deal in <strong>Wholesale Deals</strong> &rarr; Converts to B2B Order.</li>
                                        <li>Farmer clicks <strong>🚚 Confirm Loaded & Dispatch Truck</strong>.</li>
                                        <li>B2B Buyer opens <strong>My Orders</strong> &rarr; Clicks <strong>✓ Confirm Reception of Produce & Accept Delivery</strong> to verify inward gate pass & release 100% payment!</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── ACTIVE APPLICATION VIEW ──────────────────────────────────────── */}
            <div className="flex-1 flex flex-col">
                {activeRole === 'farmer' && (
                    <AuthApp />
                )}

                {activeRole === 'consumer' && (
                    <ConsumerApp />
                )}

                {activeRole === 'depot' && (
                    <DepotApp />
                )}
            </div>

            {/* ── BROWSER STORAGE & LIVE PERSISTENCE CENTER MODAL ───────────────────────── */}
            {isStorageModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-gray-900 text-white border border-gray-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">⚡</span>
                                <div>
                                    <h3 className="text-base font-extrabold text-white">Browser Cache & Live Persistence</h3>
                                    <p className="text-[11px] text-gray-400">Client-Side Database Active ({storageSizeKB} KB Synced)</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsStorageModalOpen(false)}
                                className="text-gray-400 hover:text-white text-xl font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="space-y-3 text-xs leading-relaxed text-gray-300">
                            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-3.5 space-y-1.5">
                                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Real-Time Live Website Architecture
                                </div>
                                <p className="text-[11px] text-gray-300">
                                    Even without an active backend server, your browser's persistent storage (LocalStorage & Cache API) acts as a high-performance local database.
                                </p>
                            </div>

                            <div className="space-y-2 text-[11px] bg-gray-950 p-3.5 rounded-2xl border border-gray-800">
                                <div className="flex items-center justify-between py-1 border-b border-gray-800">
                                    <span className="text-gray-400">Database Engine:</span>
                                    <span className="font-mono font-bold text-white">LocalStorage + Cache Storage API</span>
                                </div>
                                <div className="flex items-center justify-between py-1 border-b border-gray-800">
                                    <span className="text-gray-400">Multi-Tab Sync:</span>
                                    <span className="text-emerald-400 font-bold">✓ Active (Storage Event Listener)</span>
                                </div>
                                <div className="flex items-center justify-between py-1 border-b border-gray-800">
                                    <span className="text-gray-400">Service Worker (PWA):</span>
                                    <span className="text-emerald-400 font-bold">✓ Registered & Caching Assets</span>
                                </div>
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-gray-400">Last Synced:</span>
                                    <span className="text-gray-300 font-mono text-[10px]">{new Date(lastSyncTime).toLocaleTimeString()}</span>
                                </div>
                            </div>

                            <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-2xl text-[11px] text-blue-200">
                                💡 <strong>Multi-Window Tip:</strong> Open this website in two browser windows side-by-side (one as <em>Farmer App</em> and one as <em>Consumer Store</em>). Actions like placing an order or approving a pickup PIN will sync live across windows without reloading!
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2 pt-2 border-t border-gray-800">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <button
                                    onClick={handleExportBackup}
                                    className="py-2.5 px-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5"
                                >
                                    <span>📥</span> Export Backup (JSON)
                                </button>
                                <label className="py-2.5 px-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center">
                                    <span>📤</span> Import Backup
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImportBackup}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <button
                                onClick={handleReset}
                                className="w-full py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                                <span>🔄</span> Reset to Clean Slate (Start from Beginning)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
