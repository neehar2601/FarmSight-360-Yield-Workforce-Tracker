import React, { useState, useEffect, createContext, useContext, Suspense, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// --- MOCK DATA LAYER (DEMO DATA) ---
// Simulates a backend database. Current date is mocked as Oct 13, 2025.
const MOCK_CURRENT_DATE = new Date('2025-10-13T12:00:00Z');

const mockDatabase = {
    user: { name: 'Saanvi Patel', role: 'Farm Owner' },
    yields: [
        { id: 1, date: '2025-09-10', crop: 'Tomatoes', quantity: 550, unit: 'kg', grade: 'A' },
        { id: 2, date: '2025-08-09', crop: 'Potatoes', quantity: 1200, unit: 'kg', grade: 'B' },
        { id: 3, date: '2025-07-09', crop: 'Onions', quantity: 800, unit: 'kg', grade: 'A' },
        { id: 4, date: '2025-06-08', crop: 'Tomatoes', quantity: 520, unit: 'kg', grade: 'B' },
        { id: 5, date: '2025-02-07', crop: 'Spinach', quantity: 150, unit: 'kg', grade: 'C' },
    ],
    sales: [
        { id: 1, date: '2025-09-11', crop: 'Tomatoes', quantity: 100, unit: 'kg', grade: 'A', revenue: 4000 },
    ],
    cropOptions: ['Tomatoes', 'Potatoes', 'Onions', 'Spinach', 'Wheat', 'Sugarcane', 'Cotton'],
    workers: [
        { id: 101, name: 'Ramesh Kumar', role: 'Field Supervisor', perDaySalary: 800, loanBalance: 2000, contact: '9876543210' },
        { id: 102, name: 'Sunita Devi', role: 'Harvester', perDaySalary: 600, loanBalance: 0, contact: '9876543211' },
        { id: 103, name: 'Amit Singh', role: 'Irrigation Specialist', perDaySalary: 750, loanBalance: 500, contact: '9876543212' },
        { id: 104, name: 'Priya Sharma', role: 'Harvester', perDaySalary: 600, loanBalance: 3500, contact: '9876543213' },
        { id: 105, name: 'Vikram Choudhary', role: 'Tractor Operator', perDaySalary: 900, loanBalance: 0, contact: '9876543214' },
    ],
    attendance: {
        '101': { '2025-10-01': 'P', '2025-10-02': 'P', '2025-10-03': 'H', '2025-10-04': 'A', '2025-10-06': 'P', '2025-10-07': 'P', '2025-10-08': 'P', '2025-10-09': 'P', '2025-10-10': 'P', '2025-10-11': 'A', '2025-10-13': 'P' },
        '102': { '2025-10-01': 'P', '2025-10-02': 'P', '2025-10-03': 'P', '2025-10-04': 'P', '2025-10-06': 'H', '2025-10-07': 'P', '2025-10-08': 'P', '2025-10-09': 'P', '2025-10-10': 'P', '2025-10-11': 'P', '2025-10-13': 'H' },
        '103': { '2025-10-01': 'A', '2025-10-02': 'A', '2025-10-03': 'A', '2025-10-04': 'A', '2025-10-06': 'P', '2025-10-07': 'P', '2025-10-08': 'P', '2025-10-09': 'H', '2025-10-10': 'P', '2025-10-11': 'A', '2025-10-13': 'P' },
        '104': { '2025-10-13': 'A'},
    },
    financials: {
        summary: { revenue: 4000, expenses: 45000, profit: -41000 },
        recentTransactions: [ { id: 1, type: 'Revenue', description: 'Sale of Tomatoes (Grade A)', amount: 4000 } ]
    },
    fertilisers: [ { id: 1, name: 'Urea', stock: 50, unit: 'bags' }, { id: 2, name: 'DAP', stock: 35, unit: 'bags' }, ],
    yieldChartData: [ { name: 'May', Tomatoes: 4000, Potatoes: 2400 }, { name: 'Jun', Tomatoes: 3000, Potatoes: 1398 }, { name: 'Jul', Tomatoes: 2000, Potatoes: 9800 }, { name: 'Aug', Tomatoes: 2780, Potatoes: 3908 }, { name: 'Sep', Tomatoes: 1890, Potatoes: 4800 }, ],
    financialChartData: [ { name: 'May', revenue: 50000, expenses: 30000 }, { name: 'Jun', revenue: 65000, expenses: 40000 }, { name: 'Jul', revenue: 90000, expenses: 55000 }, { name: 'Aug', revenue: 75000, expenses: 50000 }, { name: 'Sep', revenue: 98800, expenses: 45000 }, ]
};

// --- DATA UTILITIES & HELPERS ---
const aggregateInventory = (yields, sales) => {
    const inventoryMap = new Map();
    yields.forEach(y => {
        const key = `${y.crop}-${y.grade}`;
        const currentQty = inventoryMap.get(key)?.quantity || 0;
        inventoryMap.set(key, { crop: y.crop, grade: y.grade, quantity: currentQty + y.quantity, unit: y.unit });
    });
    sales.forEach(s => {
        const key = `${s.crop}-${s.grade}`;
        if (inventoryMap.has(key)) {
            const currentQty = inventoryMap.get(key).quantity;
            inventoryMap.set(key, { ...inventoryMap.get(key), quantity: currentQty - s.quantity });
        }
    });
    return Array.from(inventoryMap.values()).sort((a,b) => a.crop.localeCompare(b.crop) || a.grade.localeCompare(b.grade));
};

const formatDate = (date) => date.toISOString().split('T')[0];


// --- STATE MANAGEMENT (REACT CONTEXT) ---
const DataContext = createContext(null);

const DataProvider = ({ children }) => {
    const [data, setData] = useState({
        yields: [], cropOptions: [], workers: [], financials: null, fertilisers: [], sales: [], inventory: [], attendance: {}
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initialInventory = aggregateInventory(mockDatabase.yields, mockDatabase.sales);
        const initialRevenue = mockDatabase.sales.reduce((acc, sale) => acc + sale.revenue, 0);
        setData({
            ...mockDatabase,
            inventory: initialInventory,
            financials: {
                ...mockDatabase.financials,
                summary: { ...mockDatabase.financials.summary, revenue: initialRevenue, profit: initialRevenue - mockDatabase.financials.summary.expenses }
            }
        });
        setIsLoading(false);
    }, []);
    
    const addYield = (yieldData) => {
       setData(prev => {
            const newYields = [{...yieldData, id: Date.now()}, ...prev.yields];
            const newInventory = aggregateInventory(newYields, prev.sales);
            const newCropOptions = prev.cropOptions.includes(yieldData.crop) ? prev.cropOptions : [...prev.cropOptions, yieldData.crop];
            return { ...prev, yields: newYields, inventory: newInventory, cropOptions: newCropOptions };
        });
    };
    
    const addSale = (saleData) => {
        setData(prev => {
            const newSales = [{ ...saleData, id: Date.now() }, ...prev.sales];
            const newInventory = aggregateInventory(prev.yields, newSales);
            const newTransaction = { id: Date.now(), type: 'Revenue', description: `Sale of ${saleData.crop} (Grade ${saleData.grade})`, amount: parseInt(saleData.revenue, 10) };
            const newFinancials = {
                ...prev.financials,
                summary: { ...prev.financials.summary, revenue: prev.financials.summary.revenue + newTransaction.amount, profit: prev.financials.summary.profit + newTransaction.amount },
                recentTransactions: [newTransaction, ...prev.financials.recentTransactions],
            };
            return { ...prev, sales: newSales, inventory: newInventory, financials: newFinancials };
        });
    };

    const updateWorkerDetails = (updatedWorker) => {
        setData(prev => ({ ...prev, workers: prev.workers.map(w => w.id === updatedWorker.id ? updatedWorker : w) }));
    };

    const markAttendance = (workerId, date, status) => {
        setData(prev => {
            const newAttendance = { ...prev.attendance };
            if (!newAttendance[workerId]) newAttendance[workerId] = {};
            newAttendance[workerId][date] = status;
            return { ...prev, attendance: newAttendance };
        });
    };

    const confirmWorkerPayment = ({ workerId, workerName, payout, advance, repayment }) => {
        setData(prev => {
            const newWorkers = prev.workers.map(w => (w.id === workerId ? { ...w, loanBalance: w.loanBalance + advance - repayment } : w));
            const newTransaction = { id: Date.now(), type: 'Expense', description: `Weekly Payout: ${workerName}`, amount: -payout };
            const newFinancials = {
                ...prev.financials,
                summary: { ...prev.financials.summary, expenses: prev.financials.summary.expenses + payout, profit: prev.financials.summary.profit - payout },
                recentTransactions: [newTransaction, ...prev.financials.recentTransactions],
            };
            return { ...prev, workers: newWorkers, financials: newFinancials };
        });
    };

    const adjustLoanBalance = ({ workerId, workerName, advance, repayment }) => {
        setData(prev => {
            const newWorkers = prev.workers.map(w => (w.id === workerId ? { ...w, loanBalance: w.loanBalance + advance - repayment } : w));
            let newFinancials = { ...prev.financials };
            const newTransactions = [];

            if (advance > 0) {
                const advanceTransaction = { id: Date.now(), type: 'Expense', description: `Advance to ${workerName}`, amount: -advance };
                newTransactions.push(advanceTransaction);
                newFinancials.summary.expenses += advance;
                newFinancials.summary.profit -= advance;
            }
            if (repayment > 0) {
                const repaymentTransaction = { id: Date.now() + 1, type: 'Revenue', description: `Loan Repayment from ${workerName}`, amount: repayment };
                newTransactions.push(repaymentTransaction);
                newFinancials.summary.revenue += repayment;
                newFinancials.summary.profit += repayment;
            }
            newFinancials.recentTransactions = [...newTransactions, ...prev.financials.recentTransactions];

            return { ...prev, workers: newWorkers, financials: newFinancials };
        });
    };
    
    const value = { ...data, isLoading, addYield, addSale, updateWorkerDetails, markAttendance, confirmWorkerPayment, adjustLoanBalance, currentDate: MOCK_CURRENT_DATE };
    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

const useData = () => useContext(DataContext);
const AuthContext = createContext(null);
const AuthProvider = ({ children }) => {
    const [user] = useState(mockDatabase.user);
    return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};
const useAuth = () => useContext(AuthContext);


// --- SHARED UI COMPONENTS & ICONS ---
const Spinner = () => <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-600"></div></div>;
const Card = ({ title, children, className = "", titleActions = null }) => (<div className={`bg-white rounded-xl shadow-md p-6 ${className}`}><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold text-gray-700">{title}</h3><div>{titleActions}</div></div>{children}</div>);
const StatCard = ({ title, value, icon }) => (<div className="bg-white rounded-xl shadow-md p-4 flex items-center"><div className="p-3 bg-green-100 rounded-full mr-4">{icon}</div><div><p className="text-sm text-gray-500">{title}</p><p className="text-2xl font-bold text-gray-800">{value}</p></div></div>);
const DashboardIcon=()=><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const YieldIcon=()=><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const WorkerIcon=()=><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const FinancialIcon=()=><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const FertiliserIcon=()=><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.443 2.216a2 2 0 002.164 1.743h10.398a2 2 0 002.164-1.743l.443-2.216a2 2 0 00-.547-1.806z" /></svg>;
const InventoryIcon=()=><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7s0 0 0 0M12 11s0 0 0 0m-8 4s0 0 0 0m16 0s0 0 0 0" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 11s0 0 0 0m16 0s0 0 0 0m-8-4c4.418 0 8 1.79 8 4M4 7c0 2.21 3.582 4 8 4" /></svg>;
const RevenueIcon=()=><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
const ExpenseIcon=()=><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>;
const ProfitIcon=()=><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>;
const EditIcon=()=><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const LoanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m8-4h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2a2 2 0 012-2z" /></svg>;

// --- MODAL COMPONENTS ---
const YieldModal = ({ isOpen, onClose, onSave, cropOptions }) => {
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], crop: '', quantity: '', unit: 'kg', grade: 'A' });
    useEffect(() => { if (isOpen) setFormData({ date: new Date().toISOString().split('T')[0], crop: cropOptions[0] || '', quantity: '', unit: 'kg', grade: 'A' }); }, [isOpen, cropOptions]);
    if (!isOpen) return null;
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center"><div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md"><h2 className="text-2xl font-bold mb-6">Add New Harvest</h2><form onSubmit={handleSubmit}><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><div><label className="block text-sm font-medium text-gray-700">Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required /></div><div><label className="block text-sm font-medium text-gray-700">Crop/Produce</label><input list="crop-options" name="crop" value={formData.crop} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required /><datalist id="crop-options">{cropOptions.map(c => <option key={c} value={c} />)}</datalist></div><div><label className="block text-sm font-medium text-gray-700">Quantity</label><input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required /></div><div><label className="block text-sm font-medium text-gray-700">Unit</label><input type="text" name="unit" value={formData.unit} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required /></div><div><label className="block text-sm font-medium text-gray-700">Quality/Grade</label><select name="grade" value={formData.grade} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"><option value="A">A (Premium)</option><option value="B">B (Standard)</option><option value="C">C (Basic)</option></select></div></div><div className="flex justify-end space-x-4 mt-8"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancel</button><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">Save</button></div></form></div></div>);
};
const SaleModal = ({ isOpen, onClose, onSave, itemToSell }) => {
    const [formData, setFormData] = useState({ date: '', crop: '', grade: '', quantity: '', unit: '', pricePerUnit: '' });
    const [error, setError] = useState('');
    useEffect(() => { if (itemToSell) { setFormData({ date: new Date().toISOString().split('T')[0], crop: itemToSell.crop, grade: itemToSell.grade, quantity: '', unit: itemToSell.unit, pricePerUnit: '' }); setError(''); } }, [itemToSell, isOpen]);
    if (!isOpen) return null;
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
        if (name === 'quantity' && (parseInt(value, 10) > itemToSell.quantity || parseInt(value, 10) <= 0)) {
            setError(`Quantity must be between 1 and ${itemToSell.quantity}`);
        } else { setError(''); }
    };
    const calculatedRevenue = (formData.quantity && formData.pricePerUnit) ? parseFloat(formData.quantity) * parseFloat(formData.pricePerUnit) : 0;
    const handleSubmit = (e) => { e.preventDefault(); if (error || !formData.quantity || !formData.pricePerUnit || calculatedRevenue <= 0) return; onSave({ ...formData, revenue: calculatedRevenue }); };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center"><div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md"><h2 className="text-2xl font-bold mb-2">Record Sale for {itemToSell.crop} (Grade {itemToSell.grade})</h2><p className="text-sm text-gray-500 mb-6">Available Stock: {itemToSell.quantity} {itemToSell.unit}</p><form onSubmit={handleSubmit}><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><div><label>Date</label><input type="date" name="date" value={formData.date || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300" required /></div><div><label>Quantity Sold</label><input type="number" name="quantity" value={formData.quantity || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300" required /></div><div><label>Unit</label><input type="text" name="unit" value={formData.unit || ''} readOnly className="mt-1 block w-full bg-gray-100 rounded-md border-gray-300" /></div><div><label>Price per {formData.unit} (₹)</label><input type="number" name="pricePerUnit" value={formData.pricePerUnit || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300" required /></div></div>{error && <p className="text-red-500 text-sm mb-4">{error}</p>}<div className="col-span-2 mt-4 bg-gray-100 p-3 rounded-md"><p className="text-lg font-semibold text-gray-800 text-center">Calculated Revenue: ₹{calculatedRevenue.toLocaleString('en-IN')}</p></div><div className="flex justify-end space-x-4 mt-8"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button><button type="submit" disabled={!!error || calculatedRevenue <= 0} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400">Confirm Sale</button></div></form></div></div>);
};
const EditWorkerModal = ({ isOpen, onClose, onSave, worker }) => {
    const [formData, setFormData] = useState({});
    useEffect(() => { if (worker) setFormData(worker); }, [worker]);
    if (!isOpen) return null;
    const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center"><div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md"><h2 className="text-2xl font-bold mb-6">Edit Worker Details</h2><form onSubmit={handleSubmit}><div className="space-y-4"><div><label className="block text-sm font-medium">Name</label><input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300" required /></div><div><label className="block text-sm font-medium">Role</label><input type="text" name="role" value={formData.role || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300" required /></div><div><label className="block text-sm font-medium">Salary per Day (₹)</label><input type="number" name="perDaySalary" value={formData.perDaySalary || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300" required /></div><div><label className="block text-sm font-medium">Contact</label><input type="text" name="contact" value={formData.contact || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300" /></div></div><div className="flex justify-end space-x-4 mt-8"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">Save Changes</button></div></form></div></div>);
};
const LoanAdjustmentModal = ({ isOpen, onClose, onSave, worker }) => {
    const [advance, setAdvance] = useState('');
    const [repayment, setRepayment] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setAdvance('');
            setRepayment('');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen || !worker) return null;

    const handleSave = () => {
        const advanceAmount = parseInt(advance, 10) || 0;
        const repaymentAmount = parseInt(repayment, 10) || 0;

        if (repaymentAmount > worker.loanBalance) {
            setError(`Repayment cannot exceed outstanding loan of ₹${worker.loanBalance.toLocaleString('en-IN')}`);
            return;
        }
        if(advanceAmount > 0 && repaymentAmount > 0) {
            setError('Please enter either an advance or a repayment, not both.');
            return;
        }

        onSave({ workerId: worker.id, workerName: worker.name, advance: advanceAmount, repayment: repaymentAmount });
    };
    
    return (<div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center"><div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md"><h2 className="text-2xl font-bold mb-2">Adjust Loan for {worker.name}</h2><p className="text-sm text-gray-500 mb-6">Current Outstanding Loan: ₹{worker.loanBalance.toLocaleString('en-IN')}</p><div className="space-y-4"><div><label className="block text-sm font-medium">Give Advance (₹)</label><input type="number" placeholder="Enter advance amount" value={advance} onChange={e => {setAdvance(e.target.value); setError('');}} className="mt-1 block w-full rounded-md border-gray-300" /></div><div><label className="block text-sm font-medium">Record Repayment (₹)</label><input type="number" placeholder="Enter repayment amount" value={repayment} onChange={e => {setRepayment(e.target.value); setError('');}} className="mt-1 block w-full rounded-md border-gray-300" /></div></div>{error && <p className="text-red-500 text-sm mt-4">{error}</p>}<div className="flex justify-end space-x-4 mt-8"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button><button type="button" onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md">Confirm Adjustment</button></div></div></div>);
};


// --- FEATURE MODULES (SUB-COMPONENTS FOR WORKERS) ---
const WorkerPayments = ({ workers, attendance, onEdit, currentDate, onConfirmPayment, onAdjustLoan }) => {
    const [adjustments, setAdjustments] = useState({});
    const [confirmedPayments, setConfirmedPayments] = useState({});

    useEffect(() => {
        if (currentDate.getDay() === 1) setConfirmedPayments({});
    }, [currentDate]);

    const workerPaymentData = useMemo(() => {
        const calculateDaysPresent = (workerId) => {
            let count = 0;
            const workerAttendance = attendance[workerId] || {};
            const sunday = 0;
            for (let i = 0; i < 7; i++) {
                const date = new Date(currentDate);
                date.setDate(currentDate.getDate() - i);
                if (date.getDay() === sunday) continue;
                const dateStr = formatDate(date);
                const status = workerAttendance[dateStr];
                if (status === 'P') count += 1;
                if (status === 'H') count += 0.5;
            }
            return count;
        };
        return workers.map(w => ({ ...w, daysPresent: calculateDaysPresent(w.id), baseSalary: w.perDaySalary * calculateDaysPresent(w.id) }));
    }, [workers, attendance, currentDate]);

    const handleAdjustmentChange = (workerId, field, value) => {
        const numericValue = value === '' ? '' : parseInt(value, 10);
        if (!isNaN(numericValue) || value === '') {
            setAdjustments(prev => ({...prev, [workerId]: {...prev[workerId], [field]: numericValue }}));
        }
    };

    const handleConfirmPayment = (worker) => {
        const advance = adjustments[worker.id]?.advance || 0;
        const repayment = adjustments[worker.id]?.repayment || 0;
        const finalPayout = worker.baseSalary + advance - repayment;
        if (repayment > worker.loanBalance) {
            alert(`Repayment cannot exceed the outstanding loan of ₹${worker.loanBalance.toLocaleString('en-IN')}`);
            return;
        }
        onConfirmPayment({ workerId: worker.id, workerName: worker.name, payout: finalPayout, advance, repayment });
        setAdjustments(prev => ({...prev, [worker.id]: { advance: '', repayment: '' }}));
        setConfirmedPayments(prev => ({ ...prev, [worker.id]: true }));
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead><tr className="bg-gray-100"><th className="p-3">Worker</th><th className="p-3">Loan (₹)</th><th className="p-3">Weekly Base Salary (₹)</th><th className="p-3">Adjustments (₹)</th><th className="p-3 font-bold">Payout (₹)</th><th className="p-3">Actions</th></tr></thead>
                <tbody>
                    {workerPaymentData.map(w => {
                        const advance = adjustments[w.id]?.advance || 0;
                        const repayment = adjustments[w.id]?.repayment || 0;
                        const finalPayout = w.baseSalary + advance - repayment;
                        const isConfirmed = confirmedPayments[w.id];
                        return (
                            <tr key={w.id} className="border-b">
                                <td className="p-3 font-medium">{w.name}<span className="block text-xs text-gray-500">{w.role}</span></td>
                                <td className={`p-3 font-semibold ${w.loanBalance > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                    <div className="flex items-center space-x-2">
                                        <span>{w.loanBalance.toLocaleString('en-IN')}</span>
                                        <button onClick={() => onAdjustLoan(w)} className="text-gray-500 hover:text-gray-700" title="Adjust Loan/Advance"><LoanIcon /></button>
                                    </div>
                                </td>
                                <td className="p-3">{w.baseSalary.toLocaleString('en-IN')}<span className="text-xs text-gray-500"> ({w.daysPresent} days)</span></td>
                                <td className="p-3"><div className="flex space-x-2"><input type="number" placeholder="Advance" value={adjustments[w.id]?.advance || ''} onChange={(e) => handleAdjustmentChange(w.id, 'advance', e.target.value)} disabled={isConfirmed} className="w-24 p-1 border rounded disabled:bg-gray-100" /><input type="number" placeholder="Repay" value={adjustments[w.id]?.repayment || ''} onChange={(e) => handleAdjustmentChange(w.id, 'repayment', e.target.value)} disabled={isConfirmed} className="w-24 p-1 border rounded disabled:bg-gray-100" /></div></td>
                                <td className="p-3 font-bold text-lg text-blue-600">{finalPayout.toLocaleString('en-IN')}</td>
                                <td className="p-3 flex items-center space-x-2">
                                    <button onClick={() => onEdit(w)} className="text-blue-600 hover:text-blue-800"><EditIcon /></button>
                                    <button onClick={() => handleConfirmPayment(w)} disabled={isConfirmed} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">{isConfirmed ? 'Paid' : 'Confirm'}</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
const DailyAttendance = ({ workers, attendance, onMark, currentDate }) => {
    const todayStr = formatDate(currentDate);
    return (<div><h4 className="text-lg font-semibold mb-3">Mark Attendance for {currentDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4><div className="space-y-2">{workers.map(worker => (<div key={worker.id} className="grid grid-cols-5 items-center bg-gray-50 p-2 rounded-md"><span className="font-medium col-span-2">{worker.name}</span><div className="col-span-3 flex justify-around">{['P', 'H', 'A'].map(status => (<label key={status} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name={`attendance-${worker.id}`} value={status} checked={(attendance[worker.id]?.[todayStr] || '') === status} onChange={() => onMark(worker.id, todayStr, status)} className="form-radio h-4 w-4 text-green-600" /><span>{{'P': 'Present', 'H': 'Half Day', 'A': 'Absent'}[status]}</span></label>))}</div></div>))}</div></div>);
};
const MonthlyAttendance = ({ workers, attendance, onMark, currentDate }) => {
    const [displayMonth, setDisplayMonth] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    const daysInMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const getStatusStyle = (status) => ({'P': 'bg-green-500 text-white', 'H': 'bg-yellow-400 text-white', 'A': 'bg-red-500 text-white'}[status] || 'bg-gray-200');
    return (<div><div className="flex justify-between items-center mb-4"><button onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))} className="px-3 py-1 bg-gray-200 rounded">&lt; Prev</button><h4 className="text-lg font-semibold">{displayMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h4><button onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))} className="px-3 py-1 bg-gray-200 rounded">Next &gt;</button></div><div className="overflow-x-auto"><table className="w-full text-center text-sm border-collapse"><thead><tr className="bg-gray-100"><th className="p-2 border">Worker</th>{daysArray.map(day => <th key={day} className="p-2 border w-10">{day}</th>)}</tr></thead><tbody>{workers.map(worker => (<tr key={worker.id}><td className="p-2 border text-left font-medium">{worker.name}</td>{daysArray.map(day => {const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day); const dateStr = formatDate(date); const status = attendance[worker.id]?.[dateStr]; const isEditable = date <= currentDate; return (<td key={day} className={`p-0 border`}>{isEditable ? (<select value={status || 'U'} onChange={(e) => onMark(worker.id, dateStr, e.target.value)} className={`w-full h-full text-center border-0 focus:ring-0 ${getStatusStyle(status)}`}><option value="U" disabled hidden></option><option value="P">P</option><option value="H">H</option><option value="A">A</option></select>) : (<div className="p-2 bg-gray-100"></div>)}</td>)})}</tr>))}</tbody></table></div></div>);
};


// --- MAIN FEATURE MODULES ---
const Dashboard = () => {
    const { financials, isLoading, yieldChartData, financialChartData } = useData();
    if (isLoading || !financials) return <Spinner />;
    return (<div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><StatCard title="Total Revenue" value={`₹${financials.summary.revenue.toLocaleString('en-IN')}`} icon={<RevenueIcon />} /><StatCard title="Total Expenses" value={`₹${financials.summary.expenses.toLocaleString('en-IN')}`} icon={<ExpenseIcon />} /><StatCard title="Net Profit" value={`₹${financials.summary.profit.toLocaleString('en-IN')}`} icon={<ProfitIcon />} /></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card title="Yield Performance"><ResponsiveContainer width="100%" height={300}><BarChart data={yieldChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Tomatoes" fill="#8884d8" /><Bar dataKey="Potatoes" fill="#82ca9d" /></BarChart></ResponsiveContainer></Card><Card title="Financial Overview"><ResponsiveContainer width="100%" height={300}><LineChart data={financialChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="revenue" stroke="#8884d8" /><Line type="monotone" dataKey="expenses" stroke="#82ca9d" /></LineChart></ResponsiveContainer></Card></div></div>);
};
const YieldTracking = () => {
    const { yields, cropOptions, addYield, isLoading } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedYear, setSelectedYear] = useState('All');
    const [selectedSeason, setSelectedSeason] = useState('All');
    const availableYears = useMemo(() => ['All', ...new Set(yields.map(y => new Date(y.date).getFullYear()))].sort(), [yields]);
    const filteredYields = useMemo(() => {return yields.filter(y => {const date = new Date(y.date); const year = date.getFullYear(); const month = date.getMonth() + 1; const yearMatch = selectedYear === 'All' || year === parseInt(selectedYear); if (!yearMatch) return false; if (selectedSeason === 'All') return true; if (selectedSeason === 'Kharif' && month >= 6 && month <= 10) return true; if (selectedSeason === 'Rabi' && (month >= 11 || month <= 4)) return true; return false;});}, [yields, selectedYear, selectedSeason]);
    const groupedYields = useMemo(() => {return filteredYields.reduce((acc, item) => {if (!acc[item.crop]) acc[item.crop] = []; acc[item.crop].push(item); return acc;}, {});}, [filteredYields]);
    const handleSaveYield = (yieldData) => { addYield(yieldData); setIsModalOpen(false); };
    if (isLoading) return <Spinner />;
    return (<><YieldModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveYield} cropOptions={cropOptions} /><Card title="Yield Harvest Records" titleActions={<div className="flex items-center space-x-2"><select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className="text-sm rounded-md border-gray-300 shadow-sm"><option value="All">All Seasons</option><option value="Kharif">Kharif (Jun-Oct)</option><option value="Rabi">Rabi (Nov-Apr)</option></select><select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="text-sm rounded-md border-gray-300 shadow-sm">{availableYears.map(y => <option key={y} value={y}>{y}</option>)}</select><button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md">Add Harvest</button></div>}><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-100"><th className="p-3">Date</th><th className="p-3">Crop</th><th className="p-3">Quantity</th><th className="p-3">Grade</th></tr></thead><tbody>{Object.entries(groupedYields).map(([crop, yields]) => (yields.map((y, index) => (<tr key={y.id} className="border-b"><td className="p-3">{y.date}</td><td className="p-3 font-medium">{index === 0 ? crop : ''}</td><td className="p-3">{y.quantity} {y.unit}</td><td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${y.grade === 'A' ? 'bg-green-200 text-green-800' : y.grade === 'B' ? 'bg-blue-200 text-blue-800' : 'bg-yellow-200 text-yellow-800'}`}>{y.grade}</span></td></tr>))))}</tbody></table></div></Card></>);
};
const InventoryAndSales = () => {
    const { inventory, sales, addSale, isLoading } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToSell, setItemToSell] = useState(null);
    const groupedInventory = useMemo(() => {return inventory.reduce((acc, item) => {if (!acc[item.crop]) acc[item.crop] = []; acc[item.crop].push(item); return acc;}, {});}, [inventory]);
    const groupedSales = useMemo(() => {return sales.reduce((acc, item) => {if (!acc[item.crop]) acc[item.crop] = []; acc[item.crop].push(item); return acc;}, {});}, [sales]);
    const handleOpenModal = (item) => { setItemToSell(item); setIsModalOpen(true); };
    const handleSaveSale = (saleData) => { addSale(saleData); setIsModalOpen(false); };
    if (isLoading) return <Spinner />;
    return (<><SaleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveSale} itemToSell={itemToSell} /><div className="space-y-6"><Card title="Current Crop Inventory"><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-100"><th className="p-3">Crop</th><th className="p-3">Grade</th><th className="p-3">Available Quantity</th><th className="p-3">Actions</th></tr></thead><tbody>{Object.entries(groupedInventory).map(([crop, grades]) => (grades.map((item, index) => (<tr key={`${item.crop}-${item.grade}`} className="border-b"><td className="p-3 font-medium">{index === 0 ? crop : ''}</td><td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.grade === 'A' ? 'bg-green-200 text-green-800' : item.grade === 'B' ? 'bg-blue-200 text-blue-800' : 'bg-yellow-200 text-yellow-800'}`}>{item.grade}</span></td><td className="p-3">{item.quantity} {item.unit}</td><td className="p-3"><button onClick={() => handleOpenModal(item)} disabled={item.quantity <= 0} className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:bg-gray-400">Record Sale</button></td></tr>))))}</tbody></table></div></Card><Card title="Recent Sales Log"><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-100"><th className="p-3">Date</th><th className="p-3">Crop</th><th className="p-3">Grade</th><th className="p-3">Quantity</th><th className="p-3">Revenue</th></tr></thead><tbody>{Object.entries(groupedSales).map(([crop, salesList]) => (salesList.map((s, index) => (<tr key={s.id} className="border-b"><td className="p-3">{s.date}</td><td className="p-3 font-medium">{index === 0 ? crop : ''}</td><td className="p-3">{s.grade}</td><td className="p-3">{s.quantity} {s.unit}</td><td className="p-3 text-green-600 font-semibold">+₹{s.revenue.toLocaleString('en-IN')}</td></tr>))))}</tbody></table></div></Card></div></>);
};
const FinancialTracking = () => {
    const { financials, isLoading } = useData();
    if (isLoading || !financials) return <Spinner />;
    return (<Card title="Financial Transactions"><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-100"><th className="p-3">Description</th><th className="p-3">Type</th><th className="p-3">Amount</th></tr></thead><tbody>{financials.recentTransactions.map(t => (<tr key={t.id} className="border-b"><td className="p-3">{t.description}</td><td className="p-3">{t.type}</td><td className={`p-3 font-semibold ${t.type === 'Revenue' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'Revenue' ? '+' : ''}₹{Math.abs(t.amount).toLocaleString('en-IN')}</td></tr>))}</tbody></table></div></Card>);
};
const FertiliserManagement = () => {
    const { fertilisers, isLoading } = useData();
    if (isLoading) return <Spinner />;
    return (<Card title="Fertiliser Inventory"><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-100"><th className="p-3">Name</th><th className="p-3">Stock</th></tr></thead><tbody>{fertilisers.map(f => (<tr key={f.id} className="border-b"><td className="p-3">{f.name}</td><td className="p-3 font-medium">{f.stock} {f.unit}</td></tr>))}</tbody></table></div></Card>);
};
const WorkerManagement = () => {
    const { workers, attendance, updateWorkerDetails, markAttendance, confirmWorkerPayment, adjustLoanBalance, currentDate, isLoading } = useData();
    const [view, setView] = useState('payments');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState(null);

    const handleEditClick = (worker) => { setSelectedWorker(worker); setIsEditModalOpen(true); };
    const handleSaveWorker = (updatedWorker) => { updateWorkerDetails(updatedWorker); setIsEditModalOpen(false); };
    
    const handleAdjustLoanClick = (worker) => { setSelectedWorker(worker); setIsLoanModalOpen(true); };
    const handleSaveLoanAdjustment = (adjustmentData) => { adjustLoanBalance(adjustmentData); setIsLoanModalOpen(false); };

    if (isLoading) return <Spinner />;
    return (<>
        <EditWorkerModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveWorker} worker={selectedWorker} />
        <LoanAdjustmentModal isOpen={isLoanModalOpen} onClose={() => setIsLoanModalOpen(false)} onSave={handleSaveLoanAdjustment} worker={selectedWorker} />
        <div className="mb-4 border-b border-gray-200"><nav className="-mb-px flex space-x-6"><button onClick={() => setView('payments')} className={`py-3 px-1 border-b-2 font-medium ${view === 'payments' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Weekly Payments</button><button onClick={() => setView('daily')} className={`py-3 px-1 border-b-2 font-medium ${view === 'daily' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Daily Attendance</button><button onClick={() => setView('monthly')} className={`py-3 px-1 border-b-2 font-medium ${view === 'monthly' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Monthly View</button></nav></div>
        <Card title={{'payments': 'Weekly Worker Payments', 'daily': "Today's Attendance", 'monthly': 'Monthly Attendance View'}[view]}>
            {view === 'payments' && <WorkerPayments workers={workers} attendance={attendance} onEdit={handleEditClick} currentDate={currentDate} onConfirmPayment={confirmWorkerPayment} onAdjustLoan={handleAdjustLoanClick} />}
            {view === 'daily' && <DailyAttendance workers={workers} attendance={attendance} onMark={markAttendance} currentDate={currentDate} />}
            {view === 'monthly' && <MonthlyAttendance workers={workers} attendance={attendance} onMark={markAttendance} currentDate={currentDate} />}
        </Card>
    </>);
};


// --- LAYOUT & APP ROUTING ---
const NavLink = ({ to, icon, children, currentPath }) => { const isActive = (currentPath === '/' && to === '/') || (currentPath === to); return (<a href={to} className={`flex items-center px-4 py-3 text-lg rounded-lg ${isActive ? 'bg-green-700 text-white' : 'text-green-100 hover:bg-green-700'}`}>{icon}<span className="ml-4">{children}</span></a>); }
const Sidebar = ({ isSidebarOpen, currentPath }) => (<aside className={`bg-green-800 text-white w-64 space-y-2 py-7 px-2 absolute inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 z-30`}><div className="px-4 mb-8 text-center"><h1 className="text-3xl font-bold">FarmSight 360</h1><p className="text-sm text-green-200">Yield & Workforce Tracker</p></div><nav><NavLink to="/" icon={<DashboardIcon />} currentPath={currentPath}>Dashboard</NavLink><NavLink to="/yields" icon={<YieldIcon />} currentPath={currentPath}>Yield Records</NavLink><NavLink to="/inventory" icon={<InventoryIcon />} currentPath={currentPath}>Inventory & Sales</NavLink><NavLink to="/workers" icon={<WorkerIcon />} currentPath={currentPath}>Workers</NavLink><NavLink to="/financials" icon={<FinancialIcon />} currentPath={currentPath}>Financials</NavLink><NavLink to="/fertilisers" icon={<FertiliserIcon />} currentPath={currentPath}>Fertilisers</NavLink></nav></aside>);
const Header = ({ toggleSidebar }) => { const { user } = useAuth(); return (<header className="bg-white shadow-sm p-4 flex justify-between items-center z-10"><button onClick={toggleSidebar} className="text-gray-500 focus:outline-none md:hidden"><svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button><div className="text-2xl font-bold text-gray-700 hidden md:block">Welcome, {user ? user.name : 'Guest'}!</div>{user && (<div className="flex items-center"><div className="text-right mr-4"><p className="font-semibold">{user.name}</p><p className="text-sm text-gray-500">{user.role}</p></div><img className="h-12 w-12 rounded-full" src={`https://i.pravatar.cc/150?u=${user.name}`} alt="User Avatar" /></div>)}</header>);};

const routes = { '/': Dashboard, '/yields': YieldTracking, '/workers': WorkerManagement, '/financials': FinancialTracking, '/fertilisers': FertiliserManagement, '/inventory': InventoryAndSales };

export default function App() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [currentPath, setCurrentPath] = useState(window.location.pathname);
    useEffect(() => { const onLocationChange = () => setCurrentPath(window.location.pathname); window.addEventListener('popstate', onLocationChange); const handleLinkClick = (e) => {if (e.target.tagName === 'A' && e.target.href.startsWith(window.location.origin) && e.target.target !== '_blank') { e.preventDefault(); window.history.pushState({}, '', e.target.href); onLocationChange();}}; window.addEventListener('click', handleLinkClick); return () => { window.removeEventListener('popstate', onLocationChange); window.removeEventListener('click', handleLinkClick); };}, []);
    const Page = routes[currentPath] || routes['/'];
    return (
        <AuthProvider>
            <DataProvider>
                <div className="flex h-screen bg-gray-100 font-sans">
                    <Sidebar isSidebarOpen={isSidebarOpen} currentPath={currentPath} />
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <Header toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
                        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                            <Suspense fallback={<Spinner />}>
                                <Page />
                            </Suspense>
                        </main>
                    </div>
                </div>
            </DataProvider>
        </AuthProvider>
    );
}

