import React, { useState, useEffect, useCallback } from 'react';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getDashboardSummary } from '../../utils/farmApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtCurr = (n) => `₹${fmt(n)}`;
const fmtKg = (n) => {
    const v = Number(n || 0);
    if (v >= 1000) return `${(v / 1000).toFixed(1)} t`;
    return `${v.toFixed(0)} kg`;
};
const daysBetween = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    return Math.round((d - now) / (1000 * 60 * 60 * 24));
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const ACTIVITY_META = {
    FERTILISATION: { label: 'Fertilisation', emoji: '🌱', color: '#22c55e' },
    SPRAY:         { label: 'Spraying',       emoji: '💦', color: '#3b82f6' },
    IRRIGATION:    { label: 'Irrigation',     emoji: '💧', color: '#06b6d4' },
    PLUCKING:      { label: 'Plucking',       emoji: '🌿', color: '#a3e635' },
    MULCHING:      { label: 'Mulching',       emoji: '🍂', color: '#f59e0b' },
    PRUNING:       { label: 'Pruning',        emoji: '✂️',  color: '#8b5cf6' },
    PLANTING:      { label: 'Planting',       emoji: '🌾', color: '#10b981' },
    SORTING:       { label: 'Sorting',        emoji: '📦', color: '#ec4899' },
    GENERAL:       { label: 'General',        emoji: '👷', color: '#94a3b8' },
};

// ─── Theme Tokens Helper ──────────────────────────────────────────────────────
const getThemeTokens = (theme) => {
    const isDark = theme === 'dark';
    return {
        pageBg:         isDark ? 'linear-gradient(135deg, #0f172a 0%, #0d1f2d 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #f0fdf4 100%)',
        headerBg:       isDark ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(59,130,246,0.08) 100%)' : 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(59,130,246,0.04) 100%)',
        headerBorder:   isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e5e7eb',
        cardBg:         isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
        cardBorder:     isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e5e7eb',
        cardShadow:     isDark ? 'none' : '0 1px 6px rgba(0,0,0,0.06)',
        statCardBg:     isDark ? 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)' : '#ffffff',
        statCardBorder: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e5e7eb',
        titleColor:     isDark ? '#f1f5f9' : '#111827',
        subColor:       isDark ? '#94a3b8' : '#6b7280',
        mutedColor:     isDark ? '#64748b' : '#9ca3af',
        textColor:      isDark ? '#e2e8f0' : '#374151',
        labelColor:     isDark ? '#64748b' : '#9ca3af',
        gridStroke:     isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        tooltipBg:      isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.97)',
        tooltipBorder:  isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
        tooltipText:    isDark ? '#e2e8f0' : '#374151',
        tooltipLabel:   isDark ? '#94a3b8' : '#6b7280',
        tableRowBorder: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid #f3f4f6',
        chipBg:         isDark ? 'rgba(255,255,255,0.06)' : '#f9fafb',
        chipBorder:     isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
        divider:        isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
        hoverShadow:    isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.1)',
    };
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, currencyMode }) => {
    const { theme } = useTheme();
    const T = getThemeTokens(theme);
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: T.tooltipBg,
            border: `1px solid ${T.tooltipBorder}`,
            borderRadius: 10, padding: '10px 14px',
            color: T.tooltipText, fontSize: 13,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
        }}>
            <p style={{ fontWeight: 700, marginBottom: 6, color: T.tooltipLabel }}>{label}</p>
            {payload.map(p => (
                <p key={p.dataKey} style={{ color: p.color, margin: '2px 0' }}>
                    <span style={{ fontWeight: 600 }}>{p.name}: </span>
                    {currencyMode ? fmtCurr(p.value) : fmtKg(p.value)}
                </p>
            ))}
        </div>
    );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, title, value, sub, accent, trend }) => {
    const { theme } = useTheme();
    const T = getThemeTokens(theme);
    return (
        <div style={{
            background: T.statCardBg,
            border: T.statCardBorder,
            borderRadius: 16, padding: '20px 24px',
            backdropFilter: 'blur(8px)',
            position: 'relative', overflow: 'hidden',
            boxShadow: T.cardShadow,
            transition: 'transform 0.2s, box-shadow 0.2s',
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = T.hoverShadow; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.cardShadow; }}
        >
            <div style={{
                position: 'absolute', top: -20, right: -20, width: 80, height: 80,
                borderRadius: '50%', background: accent, opacity: 0.12, filter: 'blur(16px)'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ fontSize: 12, color: T.subColor, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
                    <p style={{ fontSize: 26, fontWeight: 800, color: T.titleColor, marginTop: 4, lineHeight: 1.2 }}>{value}</p>
                    {sub && <p style={{ fontSize: 12, color: T.mutedColor, marginTop: 6 }}>{sub}</p>}
                </div>
                <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: `${accent}22`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0
                }}>
                    {icon}
                </div>
            </div>
            {trend !== undefined && (
                <div style={{
                    marginTop: 12, paddingTop: 12,
                    borderTop: `1px solid ${T.divider}`,
                    fontSize: 12,
                    color: trend >= 0 ? '#4ade80' : '#f87171'
                }}>
                    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
                </div>
            )}
        </div>
    );
};

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, action }) => {
    const { theme } = useTheme();
    const T = getThemeTokens(theme);
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ color: T.textColor, fontWeight: 700, fontSize: 15, letterSpacing: '0.02em' }}>{title}</h3>
            {action}
        </div>
    );
};

// ─── Chart Card ───────────────────────────────────────────────────────────────
const ChartCard = ({ title, children, action }) => {
    const { theme } = useTheme();
    const T = getThemeTokens(theme);
    return (
        <div style={{
            background: T.cardBg,
            border: T.cardBorder,
            borderRadius: 16, padding: '20px 24px',
            boxShadow: T.cardShadow,
            backdropFilter: 'blur(8px)',
        }}>
            <SectionHeader title={title} action={action} />
            {children}
        </div>
    );
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid rgba(16,185,129,0.2)',
            borderTopColor: '#10b981',
            animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

// ─── Farm Selector ────────────────────────────────────────────────────────────
const FarmSelector = ({ farms, selected, onChange }) => {
    if (farms.length <= 1) return null;
    return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
                onClick={() => onChange([])}
                style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    border: '1px solid',
                    borderColor: selected.length === 0 ? '#10b981' : 'rgba(255,255,255,0.1)',
                    background: selected.length === 0 ? 'rgba(16,185,129,0.15)' : 'transparent',
                    color: selected.length === 0 ? '#10b981' : '#94a3b8',
                    cursor: 'pointer', transition: 'all 0.2s'
                }}
            >
                🌐 All Farms
            </button>
            {farms.map(f => {
                const isActive = selected.includes(f.id);
                return (
                    <button
                        key={f.id}
                        onClick={() => onChange(isActive ? selected.filter(x => x !== f.id) : [...selected, f.id])}
                        style={{
                            padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                            border: '1px solid',
                            borderColor: isActive ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                            background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                            color: isActive ? '#60a5fa' : '#94a3b8',
                            cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        🏡 {f.name}
                    </button>
                );
            })}
        </div>
    );
};

// ─── Crop Status Badge ────────────────────────────────────────────────────────
const HarvestBadge = ({ expectedDate }) => {
    const { theme } = useTheme();
    const T = getThemeTokens(theme);
    const days = daysBetween(expectedDate);
    if (days === null) return <span style={{ color: T.mutedColor, fontSize: 12 }}>—</span>;
    if (days < 0)  return <span style={{ background: '#1e293b', color: '#94a3b8', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>Overdue</span>;
    if (days <= 14) return <span style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>In {days}d</span>;
    if (days <= 60) return <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>In {days}d</span>;
    return <span style={{ background: 'rgba(148,163,184,0.1)', color: '#64748b', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{fmtDate(expectedDate)}</span>;
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
    const { currentUser, currentFarm } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const T = getThemeTokens(theme);
    const farms = currentUser?.farms || [];

    const [selectedFarmIds, setSelectedFarmIds] = useState([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchDashboard = useCallback(async (farmIds) => {
        setLoading(true);
        setError(null);
        const { data: d, error: e } = await getDashboardSummary(farmIds);
        setLoading(false);
        if (e) { setError(e); return; }
        setData(d);
        setLastUpdated(new Date());
    }, []);

    useEffect(() => {
        fetchDashboard(selectedFarmIds);
    }, [selectedFarmIds, fetchDashboard]);

    const handleFarmChange = (ids) => {
        setSelectedFarmIds(ids);
    };

    const activeFarmLabel = selectedFarmIds.length === 0
        ? (farms.length > 1 ? 'All Farms' : (farms[0]?.name || 'My Farm'))
        : farms.filter(f => selectedFarmIds.includes(f.id)).map(f => f.name).join(' + ');

    const fin = data?.finance_kpi || { total_income: 0, total_expense: 0, net_profit: 0 };
    const workers = data?.workers || { total_active: 0, working_today: 0 };
    const monthlyTrend = data?.monthly_trend || [];
    const harvestTrend = data?.harvest_trend || [];
    const activeCrops = data?.active_crops || [];
    const lowStockItems = data?.low_stock_items || [];
    const activityBreakdown = data?.activity_breakdown || [];

    const totalHarvested = harvestTrend.reduce((s, r) => s + r.total_kg, 0);

    return (
        <div style={{
            minHeight: '100%',
            background: T.pageBg,
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            padding: '0 0 40px 0',
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
            `}</style>

            {/* ─── Header ─────────────────────────────────────────────────────── */}
            <div style={{
                background: T.headerBg,
                borderBottom: T.headerBorder,
                padding: '28px 32px 24px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <span style={{ fontSize: 28 }}>🌾</span>
                            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.titleColor, letterSpacing: '-0.02em' }}>
                                Farm Dashboard
                            </h1>
                        </div>
                        <p style={{ color: T.subColor, fontSize: 13 }}>
                            {activeFarmLabel}
                            {lastUpdated && <span style={{ marginLeft: 8, color: T.mutedColor }}>· Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                        <FarmSelector farms={farms} selected={selectedFarmIds} onChange={handleFarmChange} />
                        <button
                            onClick={() => fetchDashboard(selectedFarmIds)}
                            disabled={loading}
                            style={{
                                padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                                background: 'rgba(16,185,129,0.15)', color: '#34d399',
                                border: '1px solid rgba(16,185,129,0.25)', cursor: 'pointer',
                                opacity: loading ? 0.6 : 1, transition: 'all 0.2s'
                            }}
                        >
                            {loading ? '⟳ Refreshing…' : '⟳ Refresh'}
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ padding: '24px 32px' }}>
                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: 12, padding: '12px 16px', color: '#fca5a5', marginBottom: 20, fontSize: 13
                    }}>
                        ⚠️ {error} — Check that backend services are running.
                    </div>
                )}

                {/* ─── KPI Stat Cards ─────────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                    <StatCard icon="💰" title="Total Income" value={fmtCurr(fin.total_income)} accent="#10b981"
                        sub={`Net: ${fmtCurr(fin.net_profit)}`} />
                    <StatCard icon="📉" title="Total Expense" value={fmtCurr(fin.total_expense)} accent="#ef4444"
                        sub="Inventory purchases" />
                    <StatCard icon={fin.net_profit >= 0 ? "📈" : "📊"} title="Net Profit"
                        value={fmtCurr(fin.net_profit)}
                        accent={fin.net_profit >= 0 ? '#22c55e' : '#ef4444'}
                        sub={fin.total_income > 0 ? `Margin: ${((fin.net_profit / fin.total_income) * 100).toFixed(1)}%` : 'No income recorded'}
                    />
                    <StatCard icon="🌾" title="Total Harvested" value={fmtKg(totalHarvested)} accent="#f59e0b"
                        sub="Last 6 months" />
                    <StatCard icon="👷" title="Active Workers"
                        value={workers.total_active}
                        accent="#3b82f6"
                        sub={`${workers.working_today} working today`}
                    />
                </div>

                {/* ─── Charts Row ──────────────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                    {/* Income vs Expense chart */}
                    <ChartCard title="📊 Income & Expense — Last 6 Months"
                        action={
                            <a href="/farm/finance" onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/farm/finance'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                                style={{ fontSize: 12, color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>
                                View Finance →
                            </a>
                        }
                    >
                        {loading ? <Spinner /> : (
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={monthlyTrend} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                                    <defs>
                                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={T.gridStroke} />
                                    <XAxis dataKey="label" tick={{ fill: T.labelColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                                    <Tooltip content={<ChartTooltip currencyMode />} />
                                    <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
                                    <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" dot={false} />
                                    <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>

                    {/* Harvest trend chart */}
                    <ChartCard title="🌾 Harvest Yield — Last 6 Months"
                        action={
                            <a href="/farm/crops" onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/farm/crops'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                                style={{ fontSize: 12, color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>
                                View Crops →
                            </a>
                        }
                    >
                        {loading ? <Spinner /> : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={harvestTrend} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                                    <defs>
                                        <linearGradient id="harvestGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.4} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}t` : `${v}kg`} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="total_kg" name="Harvest (kg)" fill="url(#harvestGrad)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                </div>

                {/* ─── Bottom Grid ──────────────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 24 }}>
                    {/* Active Crops Table */}
                    <ChartCard title="🌱 Active Crops"
                        action={
                            <a href="/farm/crops" onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/farm/crops'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                                style={{ fontSize: 12, color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>
                                Manage →
                            </a>
                        }
                    >
                        {loading ? <Spinner /> : activeCrops.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: '#475569' }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>🌱</div>
                                <p style={{ fontSize: 13 }}>No active crops</p>
                                <a href="/farm/crops" onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/farm/crops'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                                    style={{ color: '#10b981', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                                    + Add your first crop
                                </a>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            {['Crop', 'Area', 'Harvested', 'Expected Harvest'].map(h => (
                                                <th key={h} style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: 10, textAlign: 'left', paddingRight: 12 }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeCrops.map((crop, i) => (
                                            <tr key={crop.id} style={{ borderTop: T.tableRowBorder }}>
                                                <td style={{ padding: '10px 12px 10px 0' }}>
                                                    <p style={{ color: T.textColor, fontWeight: 600, fontSize: 13 }}>{crop.name}</p>
                                                    {crop.variety && <p style={{ color: T.mutedColor, fontSize: 11 }}>{crop.variety}</p>}
                                                    {farms.length > 1 && <p style={{ color: '#334155', fontSize: 10 }}>🏡 {crop.farm_name}</p>}
                                                </td>
                                                <td style={{ padding: '10px 12px 10px 0', color: '#94a3b8', fontSize: 12 }}>
                                                    {crop.area_planted ? `${crop.area_planted} ${crop.area_unit}` : '—'}
                                                </td>
                                                <td style={{ padding: '10px 12px 10px 0', color: '#34d399', fontSize: 13, fontWeight: 600 }}>
                                                    {Number(crop.total_harvested) > 0 ? fmtKg(crop.total_harvested) : <span style={{ color: '#334155' }}>None yet</span>}
                                                </td>
                                                <td style={{ padding: '10px 0 10px 0' }}>
                                                    <HarvestBadge expectedDate={crop.expected_harvest_date} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </ChartCard>

                    {/* Right column: Workers + Low Stock */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Workers today */}
                        <ChartCard title="👷 Workers Today"
                            action={
                                <a href="/workers" onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/workers'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                                    style={{ fontSize: 12, color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>
                                    Attendance →
                                </a>
                            }
                        >
                            {loading ? <Spinner /> : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                                            <div style={{
                                                width: 52, height: 52, borderRadius: '50%',
                                                background: 'rgba(59,130,246,0.15)',
                                                border: '2px solid rgba(59,130,246,0.3)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 22
                                            }}>👷</div>
                                            <div>
                                                <p style={{ fontSize: 28, fontWeight: 800, color: '#60a5fa', lineHeight: 1 }}>{workers.working_today}</p>
                                                <p style={{ fontSize: 12, color: T.subColor, marginTop: 2 }}>working today</p>
                                            </div>
                                            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.06)' }} />
                                            <div>
                                                <p style={{ fontSize: 22, fontWeight: 700, color: '#94a3b8', lineHeight: 1 }}>{workers.total_active}</p>
                                                <p style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>total active</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </ChartCard>

                        {/* Low Stock Alerts */}
                        <ChartCard title="⚠️ Low Stock Alerts"
                            action={
                                <a href="/farm/inventory" onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/farm/inventory'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                                    style={{ fontSize: 12, color: '#f59e0b', textDecoration: 'none', fontWeight: 600 }}>
                                    Inventory →
                                </a>
                            }
                        >
                            {loading ? <Spinner /> : lowStockItems.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '16px 0', color: '#22c55e', fontSize: 13 }}>
                                    ✅ No items out of stock
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {lowStockItems.map(item => {
                                        const lastBought = item.last_purchased
                                            ? new Date(item.last_purchased).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                                            : 'Never';
                                        return (
                                            <div key={item.id} style={{
                                                display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '8px 10px', borderRadius: 10,
                                                background: 'rgba(239,68,68,0.08)',
                                                border: '1px solid rgba(239,68,68,0.15)'
                                            }}>
                                                <span style={{ fontSize: 18 }}>⚠️</span>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 12, fontWeight: 600, color: T.textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                                                    <p style={{ fontSize: 10, color: '#64748b' }}>{item.category} · Last bought: {lastBought}</p>
                                                </div>
                                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <p style={{ fontSize: 12, fontWeight: 700, color: '#f87171' }}>Out of stock</p>
                                                    <p style={{ fontSize: 10, color: '#475569' }}>{item.unit}</p>
                                                </div>
                                                <div style={{ width: 4, height: 32, borderRadius: 2, flexShrink: 0, background: '#ef4444' }} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </ChartCard>
                    </div>
                </div>

                {/* ─── Activity Breakdown ──────────────────────────────────────── */}
                {!loading && activityBreakdown.length > 0 && (
                    <ChartCard title="⚡ Farm Activity (Last 30 Days)"
                        action={
                            <a href="/workers" onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/workers'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                                style={{ fontSize: 12, color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>
                                Worker Details →
                            </a>
                        }
                    >
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                            {activityBreakdown.map(act => {
                                const meta = ACTIVITY_META[act.activity_type] || ACTIVITY_META.GENERAL;
                                return (
                                    <div key={act.activity_type} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 16px', borderRadius: 12, minWidth: 160,
                                        background: `${meta.color}10`,
                                        border: `1px solid ${meta.color}25`,
                                        flex: '1 1 160px'
                                    }}>
                                        <span style={{ fontSize: 22 }}>{meta.emoji}</span>
                                        <div>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{meta.label}</p>
                                            <p style={{ fontSize: 11, color: '#64748b' }}>{act.worked_days} work-days · {act.event_count} sessions</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ChartCard>
                )}

                {/* ─── Quick Links ─────────────────────────────────────────────── */}
                <div style={{ marginTop: 20 }}>
                    <p style={{ color: T.subColor, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Quick Links</p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {[
                            { label: '🌾 Crops', href: '/farm/crops', color: '#10b981' },
                            { label: '📦 Inventory', href: '/farm/inventory', color: '#3b82f6' },
                            { label: '🌱 Crop Care', href: '/farm/crop-care', color: '#22c55e' },
                            { label: '💰 Finance', href: '/farm/finance', color: '#f59e0b' },
                            { label: '👷 Workers', href: '/workers', color: '#8b5cf6' },
                        ].map(link => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={e => { e.preventDefault(); window.history.pushState({}, '', link.href); window.dispatchEvent(new PopStateEvent('popstate')); }}
                                style={{
                                    padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                                    background: `${link.color}12`,
                                    border: `1px solid ${link.color}25`,
                                    color: link.color,
                                    textDecoration: 'none',
                                    transition: 'all 0.2s',
                                    display: 'inline-block'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = `${link.color}22`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = `${link.color}12`; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
