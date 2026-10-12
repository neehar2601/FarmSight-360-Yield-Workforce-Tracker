import React, { useState } from 'react';
import { mockStore } from '../../mock/mockStore';

export default function NurseryStageUpdateModal({ isOpen, onClose, targetItem, isOrder = false, onUpdated }) {
    if (!isOpen || !targetItem) return null;

    const stages = [
        {
            key: 'booked',
            label: '1. Booked (Advance Received)',
            desc: 'Seed lot reserved, cocopeat trays prepared.',
            badge: 'bg-gray-100 text-gray-800 border-gray-300',
            icon: '📋',
        },
        {
            key: 'sown',
            label: '2. Sown (Germination in Mist Chamber)',
            desc: 'Seeds precision sown in plug cavities under mist chamber.',
            badge: 'bg-amber-100 text-amber-900 border-amber-300',
            icon: '🌱',
        },
        {
            key: 'growing',
            label: '3. Growing (Vegetative Growth in Polyhouse)',
            desc: 'Active seedling growth, 2nd–4th leaf stage, micronutrient fertigation.',
            badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
            icon: '🌿',
        },
        {
            key: 'collected',
            label: '4. Collected (Hardening Yard under Sun)',
            desc: 'Seedlings shifted to hardening yard to build stress tolerance.',
            badge: 'bg-teal-100 text-teal-900 border-teal-300',
            icon: '☀️',
        },
        {
            key: 'processed',
            label: '5. Processed (Graded & Moisture Sealed)',
            desc: 'Taproots inspected, sorted, root-balled and packed in ventilated crates.',
            badge: 'bg-blue-100 text-blue-900 border-blue-300',
            icon: '📦',
        },
        {
            key: 'ready_available',
            label: '6. Ready for Collection / Delivery Handover',
            desc: 'Batch ready! Triggers 80% final balance collection and pickup PIN / dispatch.',
            badge: 'bg-purple-100 text-purple-900 border-purple-300',
            icon: '🎉',
        },
    ];

    const [selectedStage, setSelectedStage] = useState(targetItem.current_stage || 'growing');
    const [notes, setNotes] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [readyByDate, setReadyByDate] = useState(targetItem.ready_by_date || '');

    const handleUpdate = (e) => {
        e.preventDefault();
        mockStore.updateNurseryBatchStage(targetItem.id, {
            stage: selectedStage,
            notes: notes.trim() || undefined,
            photo_url: photoUrl.trim() || undefined,
            ready_by_date: readyByDate || undefined,
        });

        if (onUpdated) onUpdated();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[92vh] overflow-y-auto border border-gray-100 animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold">
                            🔄
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-900">Update Seedling Progress Stage</h3>
                            <p className="text-xs text-gray-500">
                                {isOrder ? `Order #${targetItem.order_number}` : targetItem.title} &bull; Buyer: {targetItem.customer_name || 'All Pre-Order Farmers'}
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

                <form onSubmit={handleUpdate} className="space-y-4">
                    {/* STAGE SELECTOR RADIO TILES */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                            Select Current Growth Lifecycle Stage:
                        </label>
                        <div className="space-y-2">
                            {stages.map((stg) => {
                                const isCurrent = selectedStage === stg.key;
                                return (
                                    <div
                                        key={stg.key}
                                        onClick={() => setSelectedStage(stg.key)}
                                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                                            isCurrent
                                                ? 'border-indigo-600 bg-indigo-50/80 shadow-sm ring-2 ring-indigo-500/20'
                                                : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className="text-2xl mt-0.5">{stg.icon}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-extrabold text-xs text-gray-900">{stg.label}</span>
                                                {isCurrent && (
                                                    <span className="text-[10px] font-black uppercase bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                                                        Selected Stage
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-600 mt-0.5">{stg.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* READY BY DATE */}
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-700">
                            Expected Harvest / Collection Ready Date:
                        </label>
                        <input
                            type="date"
                            value={readyByDate}
                            onChange={(e) => setReadyByDate(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-bold bg-white"
                        />
                    </div>

                    {/* STAGE NOTE */}
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-700">
                            Horticulture Notes & Progress Log to Buyer *
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Seedlings have achieved 3rd true leaf stage. Foliar zinc and humic acid applied. Root balls are sturdy and ready for sun hardening."
                            className="w-full p-2.5 border border-gray-300 rounded-xl text-xs"
                        />
                    </div>

                    {/* PHOTO URL */}
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-700">
                            Growth Progress Photo URL (Optional)
                        </label>
                        <input
                            type="url"
                            value={photoUrl}
                            onChange={(e) => setPhotoUrl(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full p-2 border border-gray-300 rounded-xl text-xs font-mono"
                        />
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                        >
                            <span>✓</span> Broadcast Stage Update to Farmers
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
