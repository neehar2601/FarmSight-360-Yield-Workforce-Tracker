import React, { useState, useEffect } from 'react';
import { useSPAuth } from '../../contexts/SPAuthContext';
import { spProviderApi, spPublicApi } from '../../utils/spApi';
import { COMMON_UNITS, billingMode, formatRate, describeBilling } from '../../utils/pricing';
import SPBlockCalendar from './SPBlockCalendar';

const SPProfilePage = ({ onBackToDashboard }) => {
    const { currentSP, updateProfile, refreshProfile } = useSPAuth();
    const [activeTab, setActiveTab] = useState('services'); // 'services' | 'profile' | 'calendar'

    // Profile state
    const [profileData, setProfileData] = useState({
        name: currentSP?.name || '',
        phone: currentSP?.phone || '',
        location: currentSP?.location || '',
        bio: currentSP?.bio || '',
        totalWorkers: currentSP?.totalWorkers || 1,
        worksAsTeam: Boolean(currentSP?.worksAsTeam),
        teamSize: currentSP?.teamSize || 5,
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileFeedback, setProfileFeedback] = useState(null);

    useEffect(() => {
        if (currentSP) {
            setProfileData({
                name: currentSP.name || '',
                phone: currentSP.phone || '',
                location: currentSP.location || '',
                bio: currentSP.bio || '',
                totalWorkers: currentSP.totalWorkers || 1,
                worksAsTeam: Boolean(currentSP.worksAsTeam),
                teamSize: currentSP.teamSize || 5,
            });
        }
    }, [currentSP]);

    // Services state
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [editingService, setEditingService] = useState(null); // null or service object or { isNew: true }
    const emptyService = { name: '', category: '', price: '', unit: 'day', unitIsCustom: false, description: '' };
    const [serviceFormData, setServiceFormData] = useState(emptyService);
    const [savingService, setSavingService] = useState(false);
    const [serviceError, setServiceError] = useState(null);

    // Load data
    const loadServices = async () => {
        setLoadingServices(true);
        try {
            const res = await spProviderApi.listMyServices();
            setServices(res.services || []);
        } catch (e) {
            console.error('Failed to load services:', e);
        } finally {
            setLoadingServices(false);
        }
    };

    useEffect(() => {
        loadServices();
        spPublicApi.listCategories()
            .then(res => setCategories(res.categories || []))
            .catch(() => {});
    }, []);

    // ── Profile Handlers ────────────────────────────────────────────────────────

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileFeedback(null);
        try {
            const workers = currentSP?.type === 'individual' ? 1 : Math.max(1, Number(profileData.totalWorkers) || 1);
            const isTeam = currentSP?.type === 'firm' && Boolean(profileData.worksAsTeam);
            const tSize = isTeam ? Math.min(Math.max(1, Number(profileData.teamSize) || 1), workers) : 1;

            await updateProfile({
                name: profileData.name,
                phone: profileData.phone,
                location: profileData.location,
                bio: profileData.bio,
                totalWorkers: workers,
                worksAsTeam: isTeam,
                teamSize: tSize,
            });
            setProfileFeedback({ type: 'success', message: 'Profile updated successfully!' });
            await refreshProfile();
        } catch (err) {
            setProfileFeedback({ type: 'error', message: err.message || 'Failed to update profile' });
        } finally {
            setSavingProfile(false);
        }
    };

    // ── Services Handlers ───────────────────────────────────────────────────────

    const handleOpenAddService = () => {
        setServiceFormData(emptyService);
        setServiceError(null);
        setEditingService({ isNew: true });
    };

    const handleOpenEditService = (service) => {
        const unit = service.unit || 'day';
        setServiceFormData({
            name: service.name,
            category: service.category,
            price: service.price ?? '',
            unit,
            unitIsCustom: !COMMON_UNITS.includes(unit),
            description: service.description || '',
        });
        setServiceError(null);
        setEditingService(service);
    };

    const handleSaveService = async (e) => {
        e.preventDefault();
        setServiceError(null);
        if (!serviceFormData.category.trim()) return setServiceError('Enter a category for this service');
        if (!serviceFormData.unit.trim()) return setServiceError('Enter the unit you charge by (e.g. bag, metre)');
        if (serviceFormData.price === '' || Number(serviceFormData.price) < 0) return setServiceError('Enter a valid price');

        setSavingService(true);
        try {
            const payload = {
                name: serviceFormData.name,
                category: serviceFormData.category.trim(),
                description: serviceFormData.description,
                unit: serviceFormData.unit.trim(),
                price: Number(serviceFormData.price),
            };

            if (editingService?.isNew) {
                await spProviderApi.createService(payload);
            } else {
                await spProviderApi.updateService(editingService.id, payload);
            }

            setEditingService(null);
            loadServices();
        } catch (err) {
            setServiceError(err.message || 'Failed to save service');
        } finally {
            setSavingService(false);
        }
    };

    const handleDeleteService = async (serviceId) => {
        if (!window.confirm('Are you sure you want to remove this service?')) return;
        try {
            await spProviderApi.deleteService(serviceId);
            loadServices();
        } catch (err) {
            alert(err.message || 'Failed to delete service');
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                        Provider Management
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Configure your marketplace services, worker capacity, and availability blackout dates.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onBackToDashboard}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors"
                >
                    ← Back to Dashboard
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-2">
                <button
                    type="button"
                    onClick={() => setActiveTab('services')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === 'services'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                >
                    🛠️ Services &amp; Pricing ({services.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === 'profile'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                >
                    👤 Profile &amp; Capacity
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('calendar')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === 'calendar'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                >
                    📅 Block Dates &amp; Leave
                </button>
            </div>

            {/* TAB 1: SERVICES CRUD */}
            {activeTab === 'services' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Add services you offer. Farmers can book these directly from your profile.
                        </p>
                        <button
                            type="button"
                            onClick={handleOpenAddService}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
                        >
                            <span>+ Add New Service</span>
                        </button>
                    </div>

                    {loadingServices ? (
                        <div className="py-12 text-center text-xs text-gray-400">Loading your services...</div>
                    ) : services.length === 0 ? (
                        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 space-y-3">
                            <div className="text-3xl">🛠️</div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">No Services Listed Yet</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                                List at least one service with a price — per day, per job, or per piece/plant — so farmers can discover and book you.
                            </p>
                            <button
                                type="button"
                                onClick={handleOpenAddService}
                                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                            >
                                Add Your First Service
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {services.map((s) => (
                                <div
                                    key={s.id}
                                    className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-3"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                                    {s.category}
                                                </span>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-base mt-1">
                                                    {s.name}
                                                </h3>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-sm text-gray-900 dark:text-white block">
                                                    {formatRate(s)}
                                                </span>
                                            </div>
                                        </div>

                                        {s.description && (
                                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                                                {s.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="pt-3 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                                        <span className="text-gray-400">{describeBilling(s)}</span>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEditService(s)}
                                                className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteService(s.id)}
                                                className="text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: PROFILE & CAPACITY */}
            {activeTab === 'profile' && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-slate-700 shadow-sm max-w-2xl">
                    <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
                        {profileFeedback && (
                            <div className={`p-3.5 rounded-xl text-xs font-semibold ${
                                profileFeedback.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                                {profileFeedback.message}
                            </div>
                        )}

                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Display Name / Firm Name
                            </label>
                            <input
                                type="text"
                                value={profileData.name}
                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                required
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Contact Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Primary Location / District
                                </label>
                                <input
                                    type="text"
                                    value={profileData.location}
                                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Total Worker Capacity
                            </label>
                            {currentSP?.type === 'individual' ? (
                                <p className="p-3 bg-gray-50 dark:bg-slate-700/60 rounded-xl text-gray-600 dark:text-gray-300">
                                    👤 Individual Specialist capacity is fixed at <strong>1 worker</strong>. When booked, your entire schedule is reserved.
                                </p>
                            ) : (
                                <div>
                                    <input
                                        type="number"
                                        min="1"
                                        max="500"
                                        value={profileData.totalWorkers}
                                        onChange={(e) => setProfileData({ ...profileData, totalWorkers: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        Note: Capacity cannot be lowered below the number of workers already booked on upcoming days.
                                    </p>

                                    {/* Team Deployment Option */}
                                    <div className="mt-4 p-4 rounded-xl border border-emerald-100 dark:border-slate-700 bg-emerald-50/50 dark:bg-slate-800/60 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                id="worksAsTeamCheckbox"
                                                checked={profileData.worksAsTeam}
                                                onChange={(e) => setProfileData({ ...profileData, worksAsTeam: e.target.checked })}
                                                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                                            />
                                            <div>
                                                <label htmlFor="worksAsTeamCheckbox" className="font-semibold text-xs text-gray-800 dark:text-gray-200 cursor-pointer block">
                                                    Deploy workers as a team / set
                                                </label>
                                                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                                    Workers will be deployed together in fixed sets (e.g. 5 at a time). Farmers must book full teams and cannot book 1 or 2 workers individually.
                                                </p>
                                            </div>
                                        </div>

                                        {profileData.worksAsTeam && (
                                            <div className="pl-7 space-y-2 pt-2 border-t border-emerald-100/60 dark:border-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-36">
                                                        Workers per Team (Set size):
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="2"
                                                        max={Math.max(2, Number(profileData.totalWorkers) || 2)}
                                                        value={profileData.teamSize}
                                                        onChange={(e) => setProfileData({ ...profileData, teamSize: Math.max(1, Number(e.target.value)) })}
                                                        className="w-24 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                    />
                                                </div>
                                                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                                    💡 <strong>{profileData.totalWorkers}</strong> total workers ={' '}
                                                    <strong>{Math.floor((Number(profileData.totalWorkers) || 0) / (Number(profileData.teamSize) || 1))} full team(s)</strong> of {profileData.teamSize} workers.
                                                    {(Number(profileData.totalWorkers) || 0) % (Number(profileData.teamSize) || 1) !== 0 && (
                                                        <span className="text-amber-700 dark:text-amber-400 block mt-0.5">
                                                            ⚠️ Note: {Number(profileData.totalWorkers) % Number(profileData.teamSize)} remaining worker(s) cannot form a complete team.
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Bio &amp; Experience
                            </label>
                            <textarea
                                rows={4}
                                value={profileData.bio}
                                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={savingProfile}
                            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-colors"
                        >
                            {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                        </button>
                    </form>
                </div>
            )}

            {/* TAB 3: CALENDAR & BLOCKED DATES */}
            {activeTab === 'calendar' && <SPBlockCalendar />}

            {/* Service Modal (Add / Edit) */}
            {editingService && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-gray-100 dark:border-slate-700 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {editingService.isNew ? 'Add New Service' : 'Edit Service'}
                        </h3>

                        <form onSubmit={handleSaveService} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Service Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Drip Pipe Laying & Testing"
                                    value={serviceFormData.name}
                                    onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {serviceError && (
                                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs border border-rose-200 dark:border-rose-900">
                                    {serviceError}
                                </div>
                            )}

                            <div>
                                <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                    Category *
                                </label>
                                <input
                                    type="text"
                                    required
                                    list="sp-category-options"
                                    maxLength={60}
                                    placeholder="Pick one or type your own — e.g. Coconut climbing"
                                    value={serviceFormData.category}
                                    onChange={(e) => setServiceFormData({ ...serviceFormData, category: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <datalist id="sp-category-options">
                                    {categories.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                        Charged per *
                                    </label>
                                    <select
                                        value={serviceFormData.unitIsCustom ? '__other__' : serviceFormData.unit}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setServiceFormData(v === '__other__'
                                                ? { ...serviceFormData, unit: '', unitIsCustom: true }
                                                : { ...serviceFormData, unit: v, unitIsCustom: false });
                                        }}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="day">Day (per worker)</option>
                                        <option value="job">Job (fixed price)</option>
                                        <option value="hour">Hour</option>
                                        <option value="piece">Piece</option>
                                        <option value="plant">Plant</option>
                                        <option value="tree">Tree</option>
                                        <option value="acre">Acre</option>
                                        <option value="sq ft">Sq ft</option>
                                        <option value="metre">Metre</option>
                                        <option value="kg">Kg</option>
                                        <option value="__other__">Other (type your own)…</option>
                                    </select>
                                    {serviceFormData.unitIsCustom && (
                                        <input
                                            type="text"
                                            required
                                            maxLength={30}
                                            autoFocus
                                            placeholder="e.g. bag, bed, pit"
                                            value={serviceFormData.unit}
                                            onChange={(e) => setServiceFormData({ ...serviceFormData, unit: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-2"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                        Price (₹){serviceFormData.unit ? ` per ${serviceFormData.unit}` : ''} *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        placeholder="e.g. 12.50"
                                        value={serviceFormData.price}
                                        onChange={(e) => setServiceFormData({ ...serviceFormData, price: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400 -mt-2">
                                {describeBilling({ unit: serviceFormData.unit || 'unit' })}.
                                {billingMode(serviceFormData.unit) === 'per_unit' && serviceFormData.unit
                                    ? ` e.g. ₹${serviceFormData.price || '12'} × 200 ${serviceFormData.unit} = ₹${((Number(serviceFormData.price) || 12) * 200).toLocaleString('en-IN')}.`
                                    : ''}
                            </p>

                            <div>
                                <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                    Description (Scope of Work)
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Tools included, crew specifications..."
                                    value={serviceFormData.description}
                                    onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingService(null)}
                                    className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingService}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
                                >
                                    {savingService ? 'Saving...' : 'Save Service'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SPProfilePage;
