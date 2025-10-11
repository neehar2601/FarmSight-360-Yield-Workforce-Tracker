import React, { useState, useEffect, createContext, useContext, Suspense, lazy } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// --- CONFIGURATION ---
// In a real app, this would come from environment variables
const API_ENDPOINTS = {
    YIELDS: '/api/yields',
    WORKERS: '/api/workers',
    FINANCIALS: '/api/financials',
    FERTILISERS: '/api/fertilisers',
};

// --- MOCK DATA LAYER (DEMO DATA) ---
const mockDatabase = {
    user: { name: 'Saanvi Patel', role: 'Farm Owner' },
    yields: [
        { id: 1, date: '2025-09-10', crop: 'Tomatoes', quantity: 550, unit: 'kg', grade: 'A', revenue: 22000 },
        { id: 2, date: '2025-09-09', crop: 'Potatoes', quantity: 1200, unit: 'kg', grade: 'B', revenue: 24000 },
        { id: 3, date: '2025-09-09', crop: 'Onions', quantity: 800, unit: 'kg', grade: 'A', revenue: 20000 },
        { id: 4, date: '2025-09-08', crop: 'Tomatoes', quantity: 520, unit: 'kg', grade: 'A', revenue: 20800 },
        { id: 5, date: '2025-09-07', crop: 'Spinach', quantity: 150, unit: 'kg', grade: 'C', revenue: 3000 },
    ],
    cropOptions: ['Tomatoes', 'Potatoes', 'Onions', 'Spinach', 'Wheat', 'Sugarcane', 'Cotton'],
    workers: [
        { id: 101, name: 'Ramesh Kumar', role: 'Field Supervisor', attendance: 'Present', salary: 25000 },
        { id: 102, name: 'Sunita Devi', role: 'Harvester', attendance: 'Present', salary: 18000 },
        { id: 103, name: 'Amit Singh', role: 'Irrigation Specialist', attendance: 'Absent', salary: 22000 },
        { id: 104, name: 'Priya Sharma', role: 'Harvester', attendance: 'Present', salary: 18000 },
    ],
    financials: {
        summary: { revenue: 89800, expenses: 45000, profit: 44800 },
        recentTransactions: [
            { id: 1, type: 'Revenue', description: 'Tomato Sale Batch #1', amount: 22000 },
            { id: 2, type: 'Expense', description: 'Fertiliser Purchase', amount: -15000 },
            { id: 3, type: 'Revenue', description: 'Potato Sale', amount: 24000 },
            { id: 4, type: 'Expense', description: 'Fuel for Tractor', amount: -5000 },
        ]
    },
    fertilisers: [
        { id: 1, name: 'Urea', stock: 50, unit: 'bags' },
        { id: 2, name: 'DAP', stock: 35, unit: 'bags' },
        { id: 3, name: 'Potash', stock: 20, unit: 'bags' },
    ],
    yieldChartData: [
        { name: 'May', Tomatoes: 4000, Potatoes: 2400 },
        { name: 'Jun', Tomatoes: 3000, Potatoes: 1398 },
        { name: 'Jul', Tomatoes: 2000, Potatoes: 9800 },
        { name: 'Aug', Tomatoes: 2780, Potatoes: 3908 },
        { name: 'Sep', Tomatoes: 1890, Potatoes: 4800 },
    ],
    financialChartData: [
      { name: 'May', revenue: 50000, expenses: 30000 },
      { name: 'Jun', revenue: 65000, expenses: 40000 },
      { name: 'Jul', revenue: 90000, expenses: 55000 },
      { name: 'Aug', revenue: 75000, expenses: 50000 },
      { name: 'Sep', revenue: 89800, expenses: 45000 },
    ]
};

// --- DATA SERVICES (ABSTRACTION LAYER) ---
const api = {
    get: (endpoint) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`Fetching data from: ${endpoint}`);
                if (endpoint === API_ENDPOINTS.YIELDS) resolve({yields: mockDatabase.yields, cropOptions: mockDatabase.cropOptions});
                if (endpoint === API_ENDPOINTS.WORKERS) resolve(mockDatabase.workers);
                if (endpoint === API_ENDPOINTS.FINANCIALS) resolve(mockDatabase.financials);
                if (endpoint === API_ENDPOINTS.FERTILISERS) resolve(mockDatabase.fertilisers);
            }, 500);
        });
    },
};

const yieldService = {
    getYields: () => api.get(API_ENDPOINTS.YIELDS),
    getYieldChartData: () => Promise.resolve(mockDatabase.yieldChartData),
};
const workerService = { getWorkers: () => api.get(API_ENDPOINTS.WORKERS) };
const financialService = {
    getFinancials: () => api.get(API_ENDPOINTS.FINANCIALS),
    getFinancialChartData: () => Promise.resolve(mockDatabase.financialChartData),
};
const fertiliserService = { getFertilisers: () => api.get(API_ENDPOINTS.FERTILISERS) };

// --- STATE MANAGEMENT (REACT CONTEXT) ---
const AuthContext = createContext(null);
const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    useEffect(() => { setUser(mockDatabase.user); }, []);
    return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};
const useAuth = () => useContext(AuthContext);

// --- SHARED UI COMPONENTS ---
const Spinner = () => <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-600"></div></div>;

const Card = ({ title, children, className = "", titleActions = null }) => (
    <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
            <div>{titleActions}</div>
        </div>
        {children}
    </div>
);

const StatCard = ({ title, value, icon }) => (
    <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
        <div className="p-3 bg-green-100 rounded-full mr-4">{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

// --- ICONS (INLINE SVGS) ---
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const YieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const WorkerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const FinancialIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const FertiliserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.443 2.216a2 2 0 002.164 1.743h10.398a2 2 0 002.164-1.743l.443-2.216a2 2 0 00-.547-1.806z" /></svg>;
const RevenueIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>
const ExpenseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
const ProfitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;


// --- HOOK FOR DATA FETCHING ---
const useData = (serviceFn) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const result = await serviceFn();
                if(isMounted) setData(result);
            } catch (err) {
                if(isMounted) setError(err);
            } finally {
                if(isMounted) setIsLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false };
    }, [serviceFn]);

    return { data, isLoading, error };
};

// --- YIELD MODAL COMPONENT ---
const YieldModal = ({ isOpen, onClose, onSave, yieldToEdit, cropOptions }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (yieldToEdit) {
            setFormData(yieldToEdit);
        } else {
            // Default values for a new entry
            setFormData({
                date: new Date().toISOString().split('T')[0], // today's date
                crop: cropOptions[0] || '',
                quantity: '',
                unit: 'kg',
                grade: 'A',
                revenue: ''
            });
        }
    }, [yieldToEdit, isOpen, cropOptions]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">{yieldToEdit ? 'Edit Yield' : 'Add New Yield'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input type="date" name="date" value={formData.date || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Crop</label>
                            <select name="crop" value={formData.crop || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                                {cropOptions.map(crop => <option key={crop} value={crop}>{crop}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Quantity</label>
                            <input type="number" name="quantity" value={formData.quantity || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Unit</label>
                            <input type="text" name="unit" value={formData.unit || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Grade</label>
                             <select name="grade" value={formData.grade || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Revenue (₹)</label>
                            <input type="number" name="revenue" value={formData.revenue || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 mt-8">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- FEATURE MODULES (LAZY LOADED) ---

const Dashboard = () => {
    const { data: financials, isLoading: financialsLoading } = useData(financialService.getFinancials);
    const { data: yieldChartData, isLoading: yieldChartLoading } = useData(yieldService.getYieldChartData);
    const { data: financialChartData, isLoading: financialChartLoading } = useData(financialService.getFinancialChartData);
    if (financialsLoading || yieldChartLoading || financialChartLoading) return <Spinner />;
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Revenue" value={`₹${financials.summary.revenue.toLocaleString('en-IN')}`} icon={<RevenueIcon />} />
                <StatCard title="Total Expenses" value={`₹${financials.summary.expenses.toLocaleString('en-IN')}`} icon={<ExpenseIcon />} />
                <StatCard title="Net Profit" value={`₹${financials.summary.profit.toLocaleString('en-IN')}`} icon={<ProfitIcon />} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card title="Yield Performance (Last 5 Months)">
                    <ResponsiveContainer width="100%" height={300}><BarChart data={yieldChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Tomatoes" fill="#8884d8" /><Bar dataKey="Potatoes" fill="#82ca9d" /></BarChart></ResponsiveContainer>
                </Card>
                <Card title="Financial Overview (Last 5 Months)">
                     <ResponsiveContainer width="100%" height={300}><LineChart data={financialChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} /><Line type="monotone" dataKey="expenses" stroke="#82ca9d" /></LineChart></ResponsiveContainer>
                </Card>
            </div>
        </div>
    );
};

const YieldTracking = () => {
    const { data: initialData, isLoading } = useData(yieldService.getYields);
    const [yields, setYields] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [yieldToEdit, setYieldToEdit] = useState(null);

    useEffect(() => {
        if (initialData) {
            setYields(initialData.yields);
        }
    }, [initialData]);

    const handleOpenModal = (yieldData = null) => {
        setYieldToEdit(yieldData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setYieldToEdit(null);
        setIsModalOpen(false);
    };
    
    const handleSaveYield = (yieldData) => {
        if (yieldData.id) {
            // Update existing yield
            setYields(yields.map(y => y.id === yieldData.id ? yieldData : y));
        } else {
            // Add new yield
            const newYield = { ...yieldData, id: Date.now() }; // Use timestamp for unique ID in demo
            setYields([newYield, ...yields]);
        }
        handleCloseModal();
    };

    const handleDeleteYield = (yieldId) => {
        // In a real app, you would show a confirmation dialog first
        setYields(yields.filter(y => y.id !== yieldId));
    };

    if (isLoading) return <Spinner />;

    return (
        <>
            <YieldModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveYield}
                yieldToEdit={yieldToEdit}
                cropOptions={initialData?.cropOptions || []}
            />
            <Card 
                title="Yield Records"
                titleActions={
                    <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700">
                        Add New Yield
                    </button>
                }
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="bg-gray-100"><th className="p-3">Date</th><th className="p-3">Crop</th><th className="p-3">Quantity</th><th className="p-3">Grade</th><th className="p-3">Revenue</th><th className="p-3">Actions</th></tr></thead>
                        <tbody>
                            {yields.map(y => (
                                <tr key={y.id} className="border-b">
                                    <td className="p-3">{y.date}</td>
                                    <td className="p-3">{y.crop}</td>
                                    <td className="p-3">{y.quantity} {y.unit}</td>
                                    <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${y.grade === 'A' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>{y.grade}</span></td>
                                    <td className="p-3">₹{y.revenue.toLocaleString('en-IN')}</td>
                                    <td className="p-3">
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleOpenModal(y)} className="text-blue-600 hover:text-blue-800"><EditIcon /></button>
                                            <button onClick={() => handleDeleteYield(y.id)} className="text-red-600 hover:text-red-800"><DeleteIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
    );
};

const WorkerManagement = () => {
    const { data: workers, isLoading } = useData(workerService.getWorkers);
    if (isLoading) return <Spinner />;
    return (
         <Card title="Worker Roster">
            <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-100"><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Today's Attendance</th><th className="p-3">Monthly Salary</th></tr></thead><tbody>{workers.map(w => (<tr key={w.id} className="border-b"><td className="p-3 font-medium">{w.name}</td><td className="p-3">{w.role}</td><td className="p-3"><span className={`font-semibold ${w.attendance === 'Present' ? 'text-green-600' : 'text-red-600'}`}>{w.attendance}</span></td><td className="p-3">₹{w.salary.toLocaleString('en-IN')}</td></tr>))}</tbody></table></div>
        </Card>
    );
};
const FinancialTracking = () => {
    const { data: financials, isLoading } = useData(financialService.getFinancials);
    if (isLoading) return <Spinner />;
    return (
        <Card title="Financial Transactions">
            <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-100"><th className="p-3">Description</th><th className="p-3">Type</th><th className="p-3">Amount</th></tr></thead><tbody>{financials.recentTransactions.map(t => (<tr key={t.id} className="border-b"><td className="p-3">{t.description}</td><td className="p-3">{t.type}</td><td className={`p-3 font-semibold ${t.type === 'Revenue' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'Revenue' ? '+' : ''}₹{Math.abs(t.amount).toLocaleString('en-IN')}</td></tr>))}</tbody></table></div>
        </Card>
    );
};
const FertiliserManagement = () => {
    const { data: fertilisers, isLoading } = useData(fertiliserService.getFertilisers);
    if (isLoading) return <Spinner />;
    return (
        <Card title="Fertiliser Inventory">
             <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-100"><th className="p-3">Name</th><th className="p-3">Stock</th></tr></thead><tbody>{fertilisers.map(f => (<tr key={f.id} className="border-b"><td className="p-3">{f.name}</td><td className="p-3 font-medium">{f.stock} {f.unit}</td></tr>))}</tbody></table></div>
        </Card>
    );
};

// --- LAYOUT COMPONENTS ---
const NavLink = ({ to, icon, children }) => {
    const pathname = window.location.pathname;
    const isActive = pathname === to || (pathname === '/' && to === '/');
    return (<a href={to} className={`flex items-center px-4 py-3 text-lg rounded-lg transition-colors duration-200 ${isActive ? 'bg-green-700 text-white' : 'text-green-100 hover:bg-green-700 hover:text-white'}`}>{icon}<span className="ml-4">{children}</span></a>);
}
const Sidebar = ({ isSidebarOpen }) => (<aside className={`bg-green-800 text-white w-64 space-y-2 py-7 px-2 absolute inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-30`}><div className="px-4 mb-8 text-center"><h1 className="text-3xl font-bold text-white">FarmSight 360</h1><p className="text-sm text-green-200">Yield & Workforce Tracker</p></div><nav><NavLink to="/" icon={<DashboardIcon />}>Dashboard</NavLink><NavLink to="/yields" icon={<YieldIcon />}>Yield Tracking</NavLink><NavLink to="/workers" icon={<WorkerIcon />}>Worker Management</NavLink><NavLink to="/financials" icon={<FinancialIcon />}>Financials</NavLink><NavLink to="/fertilisers" icon={<FertiliserIcon />}>Fertilisers</NavLink></nav></aside>);
const Header = ({ toggleSidebar }) => {
    const { user } = useAuth();
    return (
        <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
            <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none md:hidden"><svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
            <div className="text-2xl font-bold text-gray-700 hidden md:block">Welcome, {user ? user.name : 'Guest'}!</div>
            {user && (<div className="flex items-center"><div className="text-right mr-4"><p className="font-semibold">{user.name}</p><p className="text-sm text-gray-500">{user.role}</p></div><img className="h-12 w-12 rounded-full object-cover" src={`https://i.pravatar.cc/150?u=${user.name}`} alt="User Avatar" /></div>)}
        </header>
    );
};

// --- APP ROUTING & MAIN COMPONENT ---
const routes = {
    '/': Dashboard,
    '/yields': YieldTracking,
    '/workers': WorkerManagement,
    '/financials': FinancialTracking,
    '/fertilisers': FertiliserManagement,
};
export default function App() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const pathname = window.location.pathname;
    const Page = routes[pathname] || routes['/'];
    return (
        <AuthProvider><div className="flex h-screen bg-gray-100 font-sans"><Sidebar isSidebarOpen={isSidebarOpen} /><div className="flex-1 flex flex-col overflow-hidden"><Header toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} /><main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6"><Suspense fallback={<Spinner />}><Page /></Suspense></main></div></div></AuthProvider>
    );
}

