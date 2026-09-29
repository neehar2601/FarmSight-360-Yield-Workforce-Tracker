import React, { useState, useEffect } from 'react';
import { mockStore } from '../../mock/mockStore';

export default function DepotApp() {
    const [, setTick] = useState(0);
    const [selectedConsignment, setSelectedConsignment] = useState(null);
    const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);

    // Inward Form state
    const [receivedQty, setReceivedQty] = useState('');
    const [transitCullQty, setTransitCullQty] = useState('0');
    const [qaGrade, setQaGrade] = useState('Grade A (Approved)');
    const [inspectorNotes, setInspectorNotes] = useState('Optimal brix, firm flesh, zero pest damage. Approved for cold room Bay 2.');
    const [marketPrice, setMarketPrice] = useState('');
    const [publishToStore, setPublishToStore] = useState(true);

    useEffect(() => {
        const unsub = mockStore.subscribe(() => setTick(t => t + 1));
        return unsub;
    }, []);

    const user = mockStore.getCurrentUser();
    const consignments = mockStore.getAllConsignments ? mockStore.getAllConsignments() : mockStore.getConsignments();
    const pendingConsignments = consignments.filter(c => c.status === 'in_transit');
    const verifiedConsignments = consignments.filter(c => c.status === 'verified_and_stocked');

    const handleOpenInward = (con) => {
        setSelectedConsignment(con);
        setReceivedQty(con.dispatched_qty);
        setTransitCullQty(0);
        setMarketPrice(con.market_price_per_unit || 40);
        setIsInwardModalOpen(true);
    };

    const handleConfirmInward = (e) => {
        e.preventDefault();
        mockStore.inwardAndGradeConsignment(selectedConsignment.id, {
            received_qty: receivedQty,
            transit_cull_qty: transitCullQty,
            qa_grade: qaGrade,
            inspector_notes: inspectorNotes,
            price_per_unit: marketPrice,
            publish_to_store: publishToStore,
        });
        setIsInwardModalOpen(false);
        setSelectedConsignment(null);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
                        Central Hub Logistics & Depot QA
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight">
                        farm360 Central Depot #1 (Bengaluru Hub)
                    </h1>
                    <p className="text-blue-200 text-xs md:text-sm mt-1 max-w-xl">
                        Logged in as: <strong>{user?.name || 'Dr. Kiran Rao'}</strong> (Quality Assurance & Intake Manager).
                        Inspect incoming farmer shipments and publish verified produce for consolidated multi-farm delivery.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10 text-center">
                        <span className="text-xs text-blue-200 block">Pending Inward</span>
                        <span className="text-2xl font-black text-white">{pendingConsignments.length}</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10 text-center">
                        <span className="text-xs text-blue-200 block">Stocked Lots</span>
                        <span className="text-2xl font-black text-emerald-400">{verifiedConsignments.length}</span>
                    </div>
                </div>
            </div>

            {/* PENDING INWARD SHIPMENTS */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Inbound Farmer Shipments (Pending Intake)</h2>
                        <p className="text-xs text-gray-500">Produce arriving from partner farms requiring weighbridge verification & grading</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
                        {pendingConsignments.length} Awaiting Intake
                    </span>
                </div>

                <div className="space-y-3">
                    {pendingConsignments.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 text-xs">
                            No incoming shipments in transit right now.
                        </div>
                    ) : (
                        pendingConsignments.map(con => (
                            <div key={con.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-300 transition-all">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-gray-900 text-base">{con.crop_name}</span>
                                        <span className="text-xs font-bold text-gray-500">&bull; {con.dispatched_qty} {con.unit}</span>
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 animate-pulse">
                                            In Transit
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        From: <strong className="text-gray-800">{con.farm_name}</strong> ({con.farmer_name})
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                        Vehicle: <strong>{con.vehicle_number}</strong> &bull; Driver: {con.driver_name} &bull; Dispatched: {new Date(con.dispatch_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleOpenInward(con)}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 hover:scale-105"
                                >
                                    <span>⚖️</span> Weigh, QA Inspect & Stock &rarr;
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* VERIFIED & STOCKED DEPOT INVENTORY */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Verified Central Depot Inventory</h2>
                    <p className="text-xs text-gray-500">Produce currently stocked in cold room bays available for consolidated customer orders</p>
                </div>

                <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">Crop & Batch</th>
                                    <th className="p-4">Source Farm</th>
                                    <th className="p-4">Accepted Quantity</th>
                                    <th className="p-4">QA Grade</th>
                                    <th className="p-4">Market Price</th>
                                    <th className="p-4">Store Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {verifiedConsignments.map(con => (
                                    <tr key={con.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-extrabold text-gray-900">
                                            {con.crop_name}
                                            <span className="text-[10px] text-gray-400 block font-normal">#{con.id}</span>
                                        </td>
                                        <td className="p-4 text-gray-700">{con.farm_name}</td>
                                        <td className="p-4 font-bold text-emerald-800">
                                            {con.received_qty} {con.unit}
                                            <span className="text-[10px] text-gray-400 block">(-{con.transit_cull_qty} {con.unit} transit cull)</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-bold">
                                                {con.qa_grade_assigned}
                                            </span>
                                        </td>
                                        <td className="p-4 font-extrabold text-gray-900">₹{con.market_price_per_unit}/{con.unit}</td>
                                        <td className="p-4">
                                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                                <span>●</span> Live in "farm360 Assured"
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* INWARD QA INSPECTION MODAL */}
            {isInwardModalOpen && selectedConsignment && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-lg">
                                ⚖️
                            </div>
                            <div>
                                <h3 className="font-extrabold text-gray-900 text-lg">Depot Inward Inspection Slip</h3>
                                <p className="text-xs text-gray-500">
                                    Consignment #{selectedConsignment.id} from {selectedConsignment.farm_name}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleConfirmInward} className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-gray-700 block mb-1">
                                        Weighed Quantity Accepted ({selectedConsignment.unit})
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={receivedQty}
                                        onChange={(e) => setReceivedQty(e.target.value)}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl font-black text-emerald-800 text-base"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-gray-700 block mb-1">
                                        Transit Cull / Damaged ({selectedConsignment.unit})
                                    </label>
                                    <input
                                        type="number"
                                        value={transitCullQty}
                                        onChange={(e) => setTransitCullQty(e.target.value)}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-red-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-gray-700 block mb-1">QA Grade Certified</label>
                                    <select
                                        value={qaGrade}
                                        onChange={(e) => setQaGrade(e.target.value)}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                                    >
                                        <option value="Grade A (Approved)">Grade A (Approved Premium)</option>
                                        <option value="Grade B (Approved)">Grade B (Commercial / Processing)</option>
                                        <option value="Export Certified">Export Certified</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-gray-700 block mb-1">
                                        Market Price (₹/{selectedConsignment.unit})
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={marketPrice}
                                        onChange={(e) => setMarketPrice(e.target.value)}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl font-extrabold text-gray-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-gray-700 block mb-1">Quality Inspector Notes</label>
                                <textarea
                                    rows="2"
                                    value={inspectorNotes}
                                    onChange={(e) => setInspectorNotes(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                                />
                            </div>

                            <label className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={publishToStore}
                                    onChange={(e) => setPublishToStore(e.target.checked)}
                                    className="w-4 h-4 text-emerald-600"
                                />
                                <span className="font-bold text-emerald-950 text-xs">
                                    Publish directly to "farm360 Assured" on customer store
                                </span>
                            </label>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsInwardModalOpen(false)}
                                    className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md"
                                >
                                    Confirm Inward & Stock
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
