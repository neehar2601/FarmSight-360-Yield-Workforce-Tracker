import React, { useState, useEffect, createContext, useContext, Suspense, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from './contexts/AuthContext';
import AccountSettings from './components/settings/AccountSettings';

// --- MOCK DATA LAYER (DEMO DATA) ---
const MOCK_CURRENT_DATE = new Date('2025-10-13T12:00:00Z');

const mockDatabase = {
    user: { name: 'Saanvi Patel', role: 'Farm Owner' },
    // User-defined crop grades (flexible strings instead of enum)
    yields: [
        { id: 1, date: '2025-09-10', crop: 'Tomatoes', quantity: 550, unit: 'kg', grade: 'Premium' },
        { id: 2, date: '2025-08-09', crop: 'Potatoes', quantity: 1200, unit: 'kg', grade: 'Standard' },
        { id: 3, date: '2025-07-09', crop: 'Onions', quantity: 800, unit: 'kg', grade: 'Export Quality' },
        { id: 4, date: '2025-06-08', crop: 'Tomatoes', quantity: 520, unit: 'kg', grade: 'Standard' },
        { id: 5, date: '2025-02-07', crop: 'Spinach', quantity: 150, unit: 'kg', grade: 'Organic Premium' },
        { id: 6, date: '2025-09-15', crop: 'Wheat', quantity: 2000, unit: 'kg', grade: 'Grade A' },
    ],
    sales: [
        { id: 1, date: '2025-09-11', crop: 'Tomatoes', quantity: 100, unit: 'kg', grade: 'Premium', revenue: 4000, isMiscellaneous: false },
        { id: 2, date: '2025-09-12', crop: null, quantity: 5, unit: 'kg', grade: null, revenue: 2500, isMiscellaneous: true, partyName: 'Local Nursery', description: 'Tomato Seeds' },
    ],
    cropOptions: ['Tomatoes', 'Potatoes', 'Onions', 'Spinach', 'Wheat', 'Sugarcane', 'Cotton'],
    // Farm Crops - Cultivation Planning
    farmCrops: [
        { id: 1, crop: 'Tomatoes', area: 2.5, areaUnit: 'acres', plantCount: 5000, plantingDate: '2025-08-01', expectedHarvestDate: '2025-11-15', notes: 'Hybrid variety - Better Boy', isActive: true },
        { id: 2, crop: 'Potatoes', area: 3.0, areaUnit: 'acres', plantCount: 8000, plantingDate: '2025-07-15', expectedHarvestDate: '2025-10-30', notes: 'Kufri Jyoti variety', isActive: true },
        { id: 3, crop: 'Onions', area: 1.5, areaUnit: 'acres', plantCount: 3000, plantingDate: '2025-09-01', expectedHarvestDate: '2025-12-20', notes: 'Red onion variety', isActive: true },
        { id: 4, crop: 'Wheat', area: 5.0, areaUnit: 'acres', plantCount: 12000, plantingDate: '2025-11-01', expectedHarvestDate: '2026-03-15', notes: 'Rabi season crop', isActive: true },
    ],
    // Workers with skills and seasonal status (active/inactive)
    workers: [
        { id: 101, name: 'Ramesh Kumar', role: 'Field Supervisor', perDaySalary: 800, loanBalance: 2000, contact: '9876543210', lastSettlementDate: null, skills: 'Team Management, Crop Planning, Pest Control', isActive: true, lastActiveDate: null, seasonalNotes: '' },
        { id: 102, name: 'Sunita Devi', role: 'Harvester', perDaySalary: 600, loanBalance: 0, contact: '9876543211', lastSettlementDate: null, skills: 'Harvesting, Sorting, Packaging', isActive: true, lastActiveDate: null, seasonalNotes: '' },
        { id: 103, name: 'Amit Singh', role: 'Irrigation Specialist', perDaySalary: 750, loanBalance: 500, contact: '9876543212', lastSettlementDate: null, skills: 'Drip Irrigation, Pump Operation, Water Management', isActive: true, lastActiveDate: null, seasonalNotes: '' },
        { id: 104, name: 'Priya Sharma', role: 'Harvester', perDaySalary: 600, loanBalance: 3500, contact: '9876543213', lastSettlementDate: null, skills: 'Harvesting, Quality Grading', isActive: true, lastActiveDate: null, seasonalNotes: '' },
        { id: 105, name: 'Vikram Choudhary', role: 'Tractor Operator', perDaySalary: 900, loanBalance: 0, contact: '9876543214', lastSettlementDate: null, skills: 'Tractor Operation, Plowing, Land Preparation', isActive: true, lastActiveDate: null, seasonalNotes: '' },
        { id: 106, name: 'Rajesh Yadav', role: 'Seasonal Harvester', perDaySalary: 500, loanBalance: 0, contact: '9876543215', lastSettlementDate: '2025-09-30', skills: 'General Farm Work, Harvesting', isActive: false, lastActiveDate: '2025-09-30', seasonalNotes: 'Harvest season ended - Expected return: March 2026' },
    ],
    attendance: {
        '101': { '2025-10-01': 'P', '2025-10-02': 'P', '2025-10-03': 'H', '2025-10-04': 'A', '2025-10-06': 'P', '2025-10-07': 'P', '2025-10-08': 'P', '2025-10-09': 'P', '2025-10-10': 'P', '2025-10-11': 'A', '2025-10-13': 'P' },
        '102': { '2025-10-01': 'P', '2025-10-02': 'P', '2025-10-03': 'P', '2025-10-04': 'P', '2025-10-06': 'H', '2025-10-07': 'P', '2025-10-08': 'P', '2025-10-09': 'P', '2025-10-10': 'P', '2025-10-11': 'P', '2025-10-13': 'H' },
        '103': { '2025-10-01': 'A', '2025-10-02': 'A', '2025-10-03': 'A', '2025-10-04': 'A', '2025-10-06': 'P', '2025-10-07': 'P', '2025-10-08': 'P', '2025-10-09': 'H', '2025-10-10': 'P', '2025-10-11': 'A', '2025-10-13': 'P' },
        '104': { '2025-10-13': 'A' },
    },
    financials: {
        summary: { revenue: 6500, expenses: 45000, profit: -38500 },
        recentTransactions: [
            { id: 1, type: 'Revenue', description: 'Sale of Tomatoes (Premium)', amount: 4000, category: 'Crop Sale', isMiscellaneous: false },
            { id: 2, type: 'Revenue', description: 'Tomato Seeds to Local Nursery', amount: 2500, category: 'Miscellaneous Sale', isMiscellaneous: true, partyName: 'Local Nursery' }
        ]
    },
    resources: {
        'Fertilisers': [{ id: 1, name: 'Urea', stock: 50, unit: 'bags' }, { id: 2, name: 'DAP', stock: 35, unit: 'bags' }],
        'Pesticides': [{ id: 1, name: 'Neem Oil', stock: 10, unit: 'L' }, { id: 2, name: 'Lambda', stock: 5, unit: 'L' }],
        'Equipments': [{ id: 1, name: 'Sprayer', stock: 2, unit: 'units' }, { id: 2, name: 'Spade', stock: 5, unit: 'units' }],
        'Vehicles': [{ id: 1, name: 'Tractor', stock: 1, unit: 'pcs' }],
    },
    yieldChartData: [{ name: 'May', Tomatoes: 4000, Potatoes: 2400 }, { name: 'Jun', Tomatoes: 3000, Potatoes: 1398 }, { name: 'Jul', Tomatoes: 2000, Potatoes: 9800 }, { name: 'Aug', Tomatoes: 2780, Potatoes: 3908 }, { name: 'Sep', Tomatoes: 1890, Potatoes: 4800 },],
    financialChartData: [{ name: 'May', revenue: 50000, expenses: 30000 }, { name: 'Jun', revenue: 65000, expenses: 40000 }, { name: 'Jul', revenue: 90000, expenses: 55000 }, { name: 'Aug', revenue: 75000, expenses: 50000 }, { name: 'Sep', revenue: 98800, expenses: 45000 },]
};

// --- DATA UTILITIES & HELPERS ---
const aggregateInventory = (yields, sales) => {
    const inventoryMap = new Map();
    yields.forEach(y => {
        const key = `${y.crop}-${y.grade}`;
        const currentQty = inventoryMap.get(key)?.quantity || 0;
        inventoryMap.set(key, { crop: y.crop, grade: y.grade, quantity: currentQty + y.quantity, unit: y.unit });
    });
    // Only subtract non-miscellaneous sales from inventory
    sales.forEach(s => {
        if (!s.isMiscellaneous && s.crop && s.grade) {
            const key = `${s.crop}-${s.grade}`;
            if (inventoryMap.has(key)) {
                const currentQty = inventoryMap.get(key).quantity;
                inventoryMap.set(key, { ...inventoryMap.get(key), quantity: currentQty - s.quantity });
            }
        }
    });
    return Array.from(inventoryMap.values()).sort((a, b) => a.crop.localeCompare(b.crop) || a.grade.localeCompare(b.grade));
};

const formatDate = (date) => date.toISOString().split('T')[0];


// --- STATE MANAGEMENT (REACT CONTEXT) ---
const DataContext = createContext(null);

const DataProvider = ({ children }) => {
    const [data, setData] = useState({
        yields: [], cropOptions: [], workers: [], financials: null, resources: {}, sales: [], inventory: [], attendance: {}, workerTransactions: [], farmCrops: []
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedData = localStorage.getItem('farmSightData');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);

                // Migrate old deletedAt format to new isActive format
                if (parsedData.workers) {
                    parsedData.workers = parsedData.workers.map(worker => {
                        // If worker has deletedAt but no isActive field, migrate it
                        if (worker.deletedAt !== undefined && worker.isActive === undefined) {
                            return {
                                ...worker,
                                isActive: !worker.deletedAt,  // If deletedAt exists, worker is inactive
                                lastActiveDate: worker.deletedAt || null,
                                seasonalNotes: worker.deletedAt ? 'Migrated from previous version' : '',
                                deletedAt: undefined  // Remove old field
                            };
                        }
                        // Ensure all workers have the new fields
                        return {
                            ...worker,
                            isActive: worker.isActive !== undefined ? worker.isActive : true,
                            lastActiveDate: worker.lastActiveDate || null,
                            seasonalNotes: worker.seasonalNotes || ''
                        };
                    });
                }

                setData(parsedData);
            } catch (e) {
                console.error("Failed to load saved data", e);
                // Fallback to mock data if parse fails
                const initialInventory = aggregateInventory(mockDatabase.yields, mockDatabase.sales);
                const initialRevenue = mockDatabase.sales.reduce((acc, sale) => acc + sale.revenue, 0);
                setData({
                    ...mockDatabase,
                    inventory: initialInventory,
                    workerTransactions: [],
                    financials: {
                        ...mockDatabase.financials,
                        summary: { ...mockDatabase.financials.summary, revenue: initialRevenue, profit: initialRevenue - mockDatabase.financials.summary.expenses }
                    }
                });
            }
        } else {
            const initialInventory = aggregateInventory(mockDatabase.yields, mockDatabase.sales);
            const initialRevenue = mockDatabase.sales.reduce((acc, sale) => acc + sale.revenue, 0);
            setData({
                ...mockDatabase,
                inventory: initialInventory,
                workerTransactions: [],
                financials: {
                    ...mockDatabase.financials,
                    summary: { ...mockDatabase.financials.summary, revenue: initialRevenue, profit: initialRevenue - mockDatabase.financials.summary.expenses }
                }
            });
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (!isLoading) {
            localStorage.setItem('farmSightData', JSON.stringify(data));
        }
    }, [data, isLoading]);

    const addYield = (yieldData) => {
        setData(prev => {
            const newYields = [{ ...yieldData, id: Date.now() }, ...prev.yields];
            const newInventory = aggregateInventory(newYields, prev.sales);
            const newCropOptions = prev.cropOptions.includes(yieldData.crop) ? prev.cropOptions : [...prev.cropOptions, yieldData.crop];
            return { ...prev, yields: newYields, inventory: newInventory, cropOptions: newCropOptions };
        });
    };

    const addSale = (saleData) => {
        setData(prev => {
            const newSales = [{ ...saleData, id: Date.now() }, ...prev.sales];
            // Only update inventory for non-miscellaneous sales
            const newInventory = saleData.isMiscellaneous
                ? prev.inventory
                : aggregateInventory(prev.yields, newSales);

            // Create transaction description based on sale type
            let description;
            if (saleData.isMiscellaneous) {
                description = saleData.description || 'Miscellaneous Sale';
                if (saleData.partyName) {
                    description += ` to ${saleData.partyName}`;
                }
            } else {
                description = `Sale of ${saleData.crop} (${saleData.grade})`;
            }

            const newTransaction = {
                id: Date.now(),
                type: 'Revenue',
                description,
                amount: parseInt(saleData.revenue, 10),
                category: saleData.isMiscellaneous ? 'Miscellaneous Sale' : 'Crop Sale',
                isMiscellaneous: saleData.isMiscellaneous || false
            };

            const newFinancials = {
                ...prev.financials,
                summary: {
                    ...prev.financials.summary,
                    revenue: prev.financials.summary.revenue + newTransaction.amount,
                    profit: prev.financials.summary.profit + newTransaction.amount
                },
                recentTransactions: [newTransaction, ...prev.financials.recentTransactions],
            };
            return { ...prev, sales: newSales, inventory: newInventory, financials: newFinancials };
        });
    };

    const addWorker = (workerData) => {
        setData(prev => {
            const newWorker = {
                id: Date.now(), // Generate unique ID
                ...workerData,
                loanBalance: workerData.loanBalance || 0,
                lastSettlementDate: null,
                isActive: true,
                lastActiveDate: null,
                seasonalNotes: ''
            };
            return { ...prev, workers: [...prev.workers, newWorker] };
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

    const confirmWorkerPayment = ({ workerId, workerName, payout, advance, repayment, bonus = 0 }) => {
        setData(prev => {
            const currentDateStr = formatDate(MOCK_CURRENT_DATE);
            const newWorkers = prev.workers.map(w => (w.id === workerId ? { ...w, loanBalance: w.loanBalance + advance - repayment, lastSettlementDate: currentDateStr } : w));
            const newTransaction = { id: Date.now(), type: 'Expense', description: `Weekly Payout: ${workerName}${bonus > 0 ? ` (incl. ₹${bonus} bonus)` : ''}`, amount: -payout };

            // Mark all mid-week transactions for this worker this week as settled
            const weekStart = new Date(MOCK_CURRENT_DATE);
            weekStart.setDate(weekStart.getDate() - 6);
            const weekStartStr = formatDate(weekStart);

            const updatedTransactions = (prev.workerTransactions || []).map(t => {
                if (t.workerId === workerId && t.date >= weekStartStr && t.date <= currentDateStr && !t.settled) {
                    return { ...t, settled: true, settledDate: currentDateStr };
                }
                return t;
            });

            const newFinancials = {
                ...prev.financials,
                summary: { ...prev.financials.summary, expenses: prev.financials.summary.expenses + payout, profit: prev.financials.summary.profit - payout },
                recentTransactions: [newTransaction, ...prev.financials.recentTransactions],
            };
            return { ...prev, workers: newWorkers, financials: newFinancials, workerTransactions: updatedTransactions };
        });
    };

    const adjustLoanBalance = ({ workerId, workerName, advance, repayment }) => {
        setData(prev => {
            const newWorkers = prev.workers.map(w => (w.id === workerId ? { ...w, loanBalance: w.loanBalance + advance - repayment } : w));
            let newFinancials = { ...prev.financials };
            const newTransactions = [];
            const newWorkerTransactions = [...(prev.workerTransactions || [])];
            const currentDate = formatDate(MOCK_CURRENT_DATE);

            if (advance > 0) {
                const advanceTransaction = { id: Date.now(), type: 'Expense', description: `Advance to ${workerName}`, amount: -advance };
                newTransactions.push(advanceTransaction);
                newFinancials.summary.expenses += advance;
                newFinancials.summary.profit -= advance;

                // Record worker transaction
                newWorkerTransactions.push({
                    id: Date.now(),
                    workerId,
                    workerName,
                    date: currentDate,
                    type: 'advance',
                    amount: advance,
                    description: 'Mid-week advance'
                });
            }
            if (repayment > 0) {
                const repaymentTransaction = { id: Date.now() + 1, type: 'Revenue', description: `Loan Repayment from ${workerName}`, amount: repayment };
                newTransactions.push(repaymentTransaction);
                newFinancials.summary.revenue += repayment;
                newFinancials.summary.profit += repayment;

                // Record worker transaction
                newWorkerTransactions.push({
                    id: Date.now() + 1,
                    workerId,
                    workerName,
                    date: currentDate,
                    type: 'repayment',
                    amount: repayment,
                    description: 'Mid-week repayment'
                });
            }
            newFinancials.recentTransactions = [...newTransactions, ...prev.financials.recentTransactions];

            return { ...prev, workers: newWorkers, financials: newFinancials, workerTransactions: newWorkerTransactions };
        });
    };

    const updateResource = (category, item) => {
        setData(prev => {
            // Extract price for transaction, keep other fields for storage
            const { pricePerUnit, ...itemToStore } = item;
            const price = parseFloat(pricePerUnit) || 0;

            const list = prev.resources[category] || [];
            let newList;
            let quantityAdded = 0;

            // Check if item exists to calculate stock difference
            if (itemToStore.id) {
                const oldItem = list.find(i => i.id === itemToStore.id);
                if (oldItem) {
                    quantityAdded = itemToStore.stock - oldItem.stock;
                }
                newList = list.map(i => i.id === itemToStore.id ? itemToStore : i);
            } else {
                quantityAdded = itemToStore.stock;
                newList = [...list, { ...itemToStore, id: Date.now() }];
            }

            // Handle Financials
            let newFinancials = prev.financials;
            if (quantityAdded > 0 && price > 0) {
                const cost = quantityAdded * price;
                const newTransaction = {
                    id: Date.now(),
                    type: 'Expense',
                    description: `Purchase of ${category} - ${itemToStore.name} (${quantityAdded} ${itemToStore.unit})`,
                    amount: -cost
                };
                newFinancials = {
                    ...prev.financials,
                    summary: {
                        ...prev.financials.summary,
                        expenses: prev.financials.summary.expenses + cost,
                        profit: prev.financials.summary.profit - cost
                    },
                    recentTransactions: [newTransaction, ...prev.financials.recentTransactions]
                };
            }

            return { ...prev, resources: { ...prev.resources, [category]: newList }, financials: newFinancials };
        });
    };

    const getWeekIdentifier = (date) => {
        const d = new Date(date);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - 6);
        return formatDate(weekStart);
    };

    const getWeeklyTransactions = (workerId, currentDate, unsettledOnly = false) => {
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - 6); // Last 7 days including today
        const weekStartStr = formatDate(weekStart);
        const currentDateStr = formatDate(currentDate);

        return (data.workerTransactions || []).filter(t => {
            const inDateRange = t.workerId === workerId && t.date >= weekStartStr && t.date <= currentDateStr;
            if (unsettledOnly) {
                return inDateRange && !t.settled;
            }
            return inDateRange;
        });
    };

    const addResourceCategory = (categoryName) => {
        setData(prev => {
            if (prev.resources[categoryName]) return prev;
            return { ...prev, resources: { ...prev.resources, [categoryName]: [] } };
        });
    };

    // Farm Crops Management
    const addFarmCrop = (farmCropData) => {
        setData(prev => {
            const newFarmCrops = [{ ...farmCropData, id: Date.now() }, ...prev.farmCrops];
            return { ...prev, farmCrops: newFarmCrops };
        });
    };

    const updateFarmCrop = (updatedCrop) => {
        setData(prev => ({
            ...prev,
            farmCrops: prev.farmCrops.map(fc => fc.id === updatedCrop.id ? updatedCrop : fc)
        }));
    };

    const deleteFarmCrop = (cropId) => {
        setData(prev => ({
            ...prev,
            farmCrops: prev.farmCrops.filter(fc => fc.id !== cropId)
        }));
    };

    // Seasonal Worker Management (Active/Inactive Status)
    const deactivateWorker = (workerId, seasonalNotes = '') => {
        setData(prev => ({
            ...prev,
            workers: prev.workers.map(w =>
                w.id === workerId
                    ? {
                        ...w,
                        isActive: false,
                        lastActiveDate: formatDate(MOCK_CURRENT_DATE),
                        seasonalNotes
                    }
                    : w
            )
        }));
    };

    const activateWorker = (workerId) => {
        setData(prev => ({
            ...prev,
            workers: prev.workers.map(w =>
                w.id === workerId
                    ? {
                        ...w,
                        isActive: true,
                        lastActiveDate: null,
                        seasonalNotes: ''
                    }
                    : w
            )
        }));
    };

    // Get active workers (filter out inactive seasonal workers)
    const getActiveWorkers = () => {
        return data.workers.filter(w => w.isActive !== false);
    };

    // Get inactive workers (seasonal workers not currently working)
    const getInactiveWorkers = () => {
        return data.workers.filter(w => w.isActive === false);
    };

    // Get all grades used in the system
    const getAllGrades = () => {
        const gradesSet = new Set();
        data.yields.forEach(y => { if (y.grade) gradesSet.add(y.grade); });
        data.sales.forEach(s => { if (s.grade) gradesSet.add(s.grade); });
        return Array.from(gradesSet).sort();
    };

    const value = {
        ...data,
        isLoading,
        addYield,
        addSale,
        addWorker,
        updateWorkerDetails,
        markAttendance,
        confirmWorkerPayment,
        adjustLoanBalance,
        updateResource,
        addResourceCategory,
        getWeeklyTransactions,
        addFarmCrop,
        updateFarmCrop,
        deleteFarmCrop,
        deactivateWorker,
        activateWorker,
        getActiveWorkers,
        getInactiveWorkers,
        getAllGrades,
        currentDate: MOCK_CURRENT_DATE
    };
    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};


const useData = () => useContext(DataContext);




// --- SHARED UI COMPONENTS & ICONS ---
const Spinner = () => <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-600"></div></div>;
const Card = ({ title, children, className = "", titleActions = null }) => (<div className={`bg-white rounded-xl shadow-md p-6 ${className}`}><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold text-gray-700">{title}</h3><div>{titleActions}</div></div>{children}</div>);
const StatCard = ({ title, value, icon }) => (<div className="bg-white rounded-xl shadow-md p-4 flex items-center"><div className="p-3 bg-green-100 rounded-full mr-4">{icon}</div><div><p className="text-sm text-gray-500">{title}</p><p className="text-2xl font-bold text-gray-800">{value}</p></div></div>);
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const YieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const WorkerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const FinancialIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const FertiliserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.443 2.216a2 2 0 002.164 1.743h10.398a2 2 0 002.164-1.743l.443-2.216a2 2 0 00-.547-1.806z" /></svg>;
const InventoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7s0 0 0 0M12 11s0 0 0 0m-8 4s0 0 0 0m16 0s0 0 0 0" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 11s0 0 0 0m16 0s0 0 0 0m-8-4c4.418 0 8 1.79 8 4M4 7c0 2.21 3.582 4 8 4" /></svg>;
const RevenueIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
const ExpenseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>;
const ProfitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const LoanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m8-4h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2a2 2 0 012-2z" /></svg>;

// --- MODAL COMPONENTS ---
const YieldModal = ({ isOpen, onClose, onSave, cropOptions }) => {
    const { getAllGrades } = useData();
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], crop: '', quantity: '', unit: 'kg', grade: '' });
    const availableGrades = getAllGrades ? getAllGrades() : ['Premium', 'Standard', 'Export Quality', 'Grade A', 'Grade B', 'Organic Premium'];

    useEffect(() => {
        if (isOpen) setFormData({
            date: new Date().toISOString().split('T')[0],
            crop: cropOptions[0] || '',
            quantity: '',
            unit: 'kg',
            grade: ''
        });
    }, [isOpen, cropOptions]);

    if (!isOpen) return null;
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.grade || formData.grade.trim() === '') {
            alert('Please enter a quality grade');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">Add New Harvest</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Crop/Produce</label>
                            <input list="crop-options" name="crop" value={formData.crop} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                            <datalist id="crop-options">{cropOptions.map(c => <option key={c} value={c} />)}</datalist>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Quantity</label>
                            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Unit</label>
                            <input type="text" name="unit" value={formData.unit} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Quality/Grade</label>
                            <input
                                list="grade-options"
                                name="grade"
                                value={formData.grade}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                placeholder="e.g., Premium, Export Quality, Grade A"
                                required
                            />
                            <datalist id="grade-options">
                                {availableGrades.map(g => <option key={g} value={g} />)}
                            </datalist>
                            <p className="text-xs text-gray-500 mt-1">Enter any grade name or select from previously used grades</p>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 mt-8">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
const SaleModal = ({ isOpen, onClose, onSave, itemToSell }) => {
    const [formData, setFormData] = useState({ date: '', crop: '', grade: '', quantity: '', unit: '', pricePerUnit: '' });
    const [error, setError] = useState('');
    useEffect(() => { if (itemToSell) { setFormData({ date: new Date().toISOString().split('T')[0], crop: itemToSell.crop, grade: itemToSell.grade, quantity: '', unit: itemToSell.unit, pricePerUnit: '' }); setError(''); } }, [itemToSell, isOpen]);
    if (!isOpen) return null;
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">Edit Worker Details</h2>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Name</label>
                            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Role</label>
                            <input type="text" name="role" value={formData.role || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Skills</label>
                            <input type="text" name="skills" value={formData.skills || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300" placeholder="e.g., Tractor Operation, Irrigation, Harvesting" />
                            <p className="text-xs text-gray-500 mt-1">Comma-separated list of skills</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Salary per Day (₹)</label>
                            <input type="number" name="perDaySalary" value={formData.perDaySalary || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Contact</label>
                            <input type="text" name="contact" value={formData.contact || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 mt-8">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AddWorkerModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        skills: '',
        perDaySalary: '',
        contact: '',
        loanBalance: 0
    });

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setFormData({
                name: '',
                role: '',
                skills: '',
                perDaySalary: '',
                contact: '',
                loanBalance: 0
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">Add New Worker</h2>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Name *</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 border p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Role *</label>
                            <input type="text" name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 border p-2" placeholder="e.g., Harvester, Tractor Operator" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Skills</label>
                            <input type="text" name="skills" value={formData.skills} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 border p-2" placeholder="e.g., Tractor Operation, Irrigation, Harvesting" />
                            <p className="text-xs text-gray-500 mt-1">Comma-separated list of skills</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Salary per Day (₹) *</label>
                            <input type="number" name="perDaySalary" value={formData.perDaySalary} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 border p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Contact</label>
                            <input type="text" name="contact" value={formData.contact} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 border p-2" placeholder="Phone number" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Initial Loan Balance (₹)</label>
                            <input type="number" name="loanBalance" value={formData.loanBalance} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 border p-2" placeholder="0" />
                            <p className="text-xs text-gray-500 mt-1">Leave as 0 if no existing loan</p>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 mt-8">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Add Worker</button>
                    </div>
                </form>
            </div>
        </div>
    );
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
        if (advanceAmount > 0 && repaymentAmount > 0) {
            setError('Please enter either an advance or a repayment, not both.');
            return;
        }
        if (advanceAmount === 0 && repaymentAmount === 0) {
            setError('Please enter an amount.');
            return;
        }

        onSave({ workerId: worker.id, workerName: worker.name, advance: advanceAmount, repayment: repaymentAmount });
    };

    const currentDateStr = MOCK_CURRENT_DATE.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    return (<div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center"><div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md"><h2 className="text-2xl font-bold mb-2">Adjust Loan for {worker.name}</h2><p className="text-sm text-gray-500 mb-6">Current Outstanding Loan: ₹{worker.loanBalance.toLocaleString('en-IN')}</p><div className="space-y-4"><div><label className="block text-sm font-medium">Give Advance (₹)</label><input type="number" placeholder="Enter advance amount" value={advance} onChange={e => { setAdvance(e.target.value); setError(''); }} className="mt-1 block w-full rounded-md border-gray-300" /></div><div><label className="block text-sm font-medium">Record Repayment (₹)</label><input type="number" placeholder="Enter repayment amount" value={repayment} onChange={e => { setRepayment(e.target.value); setError(''); }} className="mt-1 block w-full rounded-md border-gray-300" /></div></div><div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md"><p className="text-xs text-blue-800"><strong>📅 Transaction Date:</strong> {currentDateStr}</p><p className="text-xs text-blue-700 mt-2">ℹ️ This mid-week transaction will be automatically included in the next weekly settlement.</p></div>{error && <p className="text-red-500 text-sm mt-4">{error}</p>}<div className="flex justify-end space-x-4 mt-8"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button><button type="button" onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Confirm Adjustment</button></div></div></div>);
};

const ResourceModal = ({ isOpen, onClose, onSave, item }) => {
    if (!isOpen) return null;
    const [formData, setFormData] = useState({ name: '', stock: 0, unit: '', pricePerUnit: '' });

    useEffect(() => {
        if (item) setFormData({ ...item, pricePerUnit: '' }); // Reset price on edit
        else setFormData({ name: '', stock: 0, unit: '', pricePerUnit: '' });
    }, [item, isOpen]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, stock: Number(formData.stock) });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
                <h2 className="text-xl font-bold mb-4">{item ? 'Edit' : 'Add'} Resource</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-sm font-medium">Name</label><input name="name" className="w-full border p-2 rounded" value={formData.name} onChange={handleChange} required /></div>
                    <div><label className="block text-sm font-medium">Stock</label><input type="number" name="stock" className="w-full border p-2 rounded" value={formData.stock} onChange={handleChange} required /></div>
                    <div><label className="block text-sm font-medium">Unit</label><input name="unit" className="w-full border p-2 rounded" value={formData.unit} onChange={handleChange} required /></div>
                    <div className="pt-2 border-t mt-2">
                        <label className="block text-sm font-medium text-gray-700">Price per Unit (₹) <span className="text-xs font-normal text-gray-500">(Optional - for Tracking Expenses)</span></label>
                        <input type="number" name="pricePerUnit" className="w-full border p-2 rounded" value={formData.pricePerUnit} onChange={handleChange} placeholder="e.g. 50" />
                        <p className="text-xs text-gray-500 mt-1">Leave empty if you don't want to record an expense transaction.</p>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- FEATURE MODULES (SUB-COMPONENTS FOR WORKERS) ---
const WorkerPayments = ({ workers, attendance, onEdit, currentDate, onConfirmPayment, onAdjustLoan, onDeactivate, onActivate }) => {
    const { getWeeklyTransactions } = useData();
    const [adjustments, setAdjustments] = useState({});
    const [confirmedPayments, setConfirmedPayments] = useState({});
    const [expandedWorkers, setExpandedWorkers] = useState({});

    useEffect(() => {
        if (currentDate.getDay() === 1) setConfirmedPayments({});
    }, [currentDate]);

    const workerPaymentData = useMemo(() => {
        const calculateDaysPresent = (worker) => {
            let count = 0;
            const workerAttendance = attendance[worker.id] || {};
            const sunday = 0;

            // Only count days after last settlement (compare as strings)
            const lastSettlementStr = worker.lastSettlementDate;

            for (let i = 0; i < 7; i++) {
                const date = new Date(currentDate);
                date.setDate(currentDate.getDate() - i);
                if (date.getDay() === sunday) continue;

                const dateStr = formatDate(date);

                // Skip dates on or before settlement date
                if (lastSettlementStr && dateStr <= lastSettlementStr) continue;

                const status = workerAttendance[dateStr];
                if (status === 'P') count += 1;
                if (status === 'H') count += 0.5;
            }
            return count;
        };

        return workers.map(w => {
            const daysPresent = calculateDaysPresent(w);
            const baseSalary = w.perDaySalary * daysPresent;

            // Calculate weekly transactions - only unsettled ones
            const weeklyTransactions = getWeeklyTransactions(w.id, currentDate, true);
            const weeklyAdvances = weeklyTransactions.filter(t => t.type === 'advance').reduce((sum, t) => sum + t.amount, 0);
            const weeklyRepayments = weeklyTransactions.filter(t => t.type === 'repayment').reduce((sum, t) => sum + t.amount, 0);
            const weeklyNetAdjustment = weeklyAdvances - weeklyRepayments;

            return {
                ...w,
                daysPresent,
                baseSalary,
                weeklyTransactions,
                weeklyAdvances,
                weeklyRepayments,
                weeklyNetAdjustment
            };
        });
    }, [workers, attendance, currentDate, getWeeklyTransactions]);

    const handleAdjustmentChange = (workerId, field, value) => {
        const numericValue = value === '' ? '' : parseInt(value, 10);
        if (!isNaN(numericValue) || value === '') {
            setAdjustments(prev => ({ ...prev, [workerId]: { ...prev[workerId], [field]: numericValue } }));
        }
    };

    const handleConfirmPayment = (worker) => {
        const advance = adjustments[worker.id]?.advance || 0;
        const repayment = adjustments[worker.id]?.repayment || 0;
        const bonus = adjustments[worker.id]?.bonus || 0;
        const finalPayout = worker.baseSalary + worker.weeklyNetAdjustment + advance - repayment + bonus;
        if (repayment > worker.loanBalance) {
            alert(`Repayment cannot exceed the outstanding loan of ₹${worker.loanBalance.toLocaleString('en-IN')}`);
            return;
        }
        onConfirmPayment({ workerId: worker.id, workerName: worker.name, payout: finalPayout, advance, repayment, bonus });
        setAdjustments(prev => ({ ...prev, [worker.id]: { advance: '', repayment: '', bonus: '' } }));
        setConfirmedPayments(prev => ({ ...prev, [worker.id]: true }));
    };

    const toggleExpanded = (workerId) => {
        setExpandedWorkers(prev => ({ ...prev, [workerId]: !prev[workerId] }));
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead><tr className="bg-gray-100"><th className="p-3">Worker</th><th className="p-3">Loan (₹)</th><th className="p-3">Weekly Base Salary (₹)</th><th className="p-3">Week Activity</th><th className="p-3">Adjustments (₹)</th><th className="p-3 font-bold">Payout (₹)</th><th className="p-3">Actions</th></tr></thead>
                <tbody>
                    {workerPaymentData.map(w => {
                        const advance = adjustments[w.id]?.advance || 0;
                        const repayment = adjustments[w.id]?.repayment || 0;
                        const bonus = adjustments[w.id]?.bonus || 0;
                        const finalPayout = w.baseSalary + w.weeklyNetAdjustment + advance - repayment + bonus;
                        const isConfirmed = confirmedPayments[w.id];
                        const isExpanded = expandedWorkers[w.id];
                        const hasWeeklyActivity = w.weeklyTransactions.length > 0;

                        return (
                            <React.Fragment key={w.id}>
                                <tr className="border-b">
                                    <td className="p-3 font-medium">
                                        <div className="flex items-center gap-2">
                                            <div>
                                                {w.name}
                                                <span className="block text-xs text-gray-500">{w.role}</span>
                                            </div>
                                            {w.isActive === false && (
                                                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full whitespace-nowrap">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        {w.isActive === false && w.lastActiveDate && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                Last worked: {w.lastActiveDate}
                                            </div>
                                        )}
                                        {w.isActive === false && w.seasonalNotes && (
                                            <div className="text-xs text-blue-600 mt-1 italic">
                                                {w.seasonalNotes}
                                            </div>
                                        )}
                                    </td>
                                    <td className={`p-3 font-semibold ${w.loanBalance > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                        <div className="flex items-center space-x-2">
                                            <span>{w.loanBalance.toLocaleString('en-IN')}</span>
                                            <button onClick={() => onAdjustLoan(w)} className="text-blue-600 hover:text-blue-800" title="Record Mid-Week Advance/Repayment (Available Anytime)"><LoanIcon /></button>
                                        </div>
                                    </td>
                                    <td className="p-3">{w.baseSalary.toLocaleString('en-IN')}<span className="text-xs text-gray-500"> ({w.daysPresent} days)</span></td>
                                    <td className="p-3">
                                        {hasWeeklyActivity ? (
                                            <div>
                                                <button onClick={() => toggleExpanded(w.id)} className="text-blue-600 hover:text-blue-800 text-xs flex items-center">
                                                    <span className="mr-1">{isExpanded ? '▼' : '▶'}</span>
                                                    {w.weeklyTransactions.length} transaction(s)
                                                </button>
                                                <div className={`text-xs mt-1 ${w.weeklyNetAdjustment > 0 ? 'text-orange-600' : w.weeklyNetAdjustment < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                                    Net: {w.weeklyNetAdjustment > 0 ? '+' : ''}{w.weeklyNetAdjustment.toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">No activity</span>
                                        )}
                                    </td>
                                    <td className="p-3"><div className="flex flex-col space-y-1"><div className="flex space-x-1"><input type="number" placeholder="Advance" value={adjustments[w.id]?.advance || ''} onChange={(e) => handleAdjustmentChange(w.id, 'advance', e.target.value)} disabled={isConfirmed || w.isActive === false} className="w-20 p-1 border rounded text-xs disabled:bg-gray-100" /><input type="number" placeholder="Repay" value={adjustments[w.id]?.repayment || ''} onChange={(e) => handleAdjustmentChange(w.id, 'repayment', e.target.value)} disabled={isConfirmed || w.isActive === false} className="w-20 p-1 border rounded text-xs disabled:bg-gray-100" /></div><input type="number" placeholder="Bonus" value={adjustments[w.id]?.bonus || ''} onChange={(e) => handleAdjustmentChange(w.id, 'bonus', e.target.value)} disabled={isConfirmed || w.isActive === false} className="w-full p-1 border rounded text-xs disabled:bg-gray-100 bg-yellow-50 border-yellow-300" /></div></td>
                                    <td className="p-3 font-bold text-lg text-blue-600">{finalPayout.toLocaleString('en-IN')}</td>
                                    <td className="p-3">
                                        <div className="flex flex-col items-start space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => onEdit(w)} className="text-blue-600 hover:text-blue-800" title="Edit Worker"><EditIcon /></button>
                                                {w.isActive !== false ? (
                                                    <>
                                                        <button onClick={() => handleConfirmPayment(w)} disabled={isConfirmed} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">{isConfirmed ? 'Paid' : 'Confirm'}</button>
                                                    </>
                                                ) : (
                                                    <button disabled className="px-3 py-1 text-sm bg-gray-300 text-gray-500 rounded cursor-not-allowed" title="Cannot pay inactive worker">Inactive</button>
                                                )}
                                            </div>
                                            {w.isActive !== false ? (
                                                <button onClick={() => onDeactivate && onDeactivate(w.id, w.name)} className="text-xs text-orange-600 hover:text-orange-800 hover:underline">Mark Inactive</button>
                                            ) : (
                                                <button onClick={() => onActivate && onActivate(w.id)} className="text-xs text-green-600 hover:text-green-800 hover:underline font-semibold">Reactivate Worker</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                {isConfirmed && (
                                    <tr>
                                        <td colSpan="7" className="p-2 bg-green-50 border-l-4 border-green-500">
                                            <p className="text-xs text-green-800">
                                                ✅ <strong>Weekly payment confirmed.</strong> You can still record mid-week advances/repayments using the 💳 button. They will be included in next week's settlement.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                                {isExpanded && hasWeeklyActivity && (
                                    <tr>
                                        <td colSpan="7" className="p-3 bg-gray-50">
                                            <div className="ml-8">
                                                <h5 className="text-xs font-semibold text-gray-700 mb-2">📊 This Week's Transactions:</h5>
                                                <div className="space-y-1">
                                                    {w.weeklyTransactions.map(t => (
                                                        <div key={t.id} className="text-xs flex justify-between items-center py-1 border-b border-gray-200">
                                                            <span className="text-gray-600">{t.date}</span>
                                                            <span className={`font-medium ${t.type === 'advance' ? 'text-orange-600' : 'text-green-600'}`}>
                                                                {t.type === 'advance' ? 'Advance' : 'Repayment'}: {t.type === 'advance' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-2 text-xs text-gray-600 italic">
                                                    ℹ️ These transactions are automatically included in the final payout above.
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
const DailyAttendance = ({ workers, attendance, onMark, currentDate }) => {
    const todayStr = formatDate(currentDate);
    return (<div><h4 className="text-lg font-semibold mb-3">Mark Attendance for {currentDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4><div className="space-y-2">{workers.map(worker => (<div key={worker.id} className="grid grid-cols-5 items-center bg-gray-50 p-2 rounded-md"><span className="font-medium col-span-2">{worker.name}</span><div className="col-span-3 flex justify-around">{['P', 'H', 'A'].map(status => (<label key={status} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name={`attendance-${worker.id}`} value={status} checked={(attendance[worker.id]?.[todayStr] || '') === status} onChange={() => onMark(worker.id, todayStr, status)} className="form-radio h-4 w-4 text-green-600" /><span>{{ 'P': 'Present', 'H': 'Half Day', 'A': 'Absent' }[status]}</span></label>))}</div></div>))}</div></div>);
};
const MonthlyAttendance = ({ workers, attendance, onMark, currentDate }) => {
    const [displayMonth, setDisplayMonth] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    const daysInMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const getStatusStyle = (status) => ({ 'P': 'bg-green-500 text-white', 'H': 'bg-yellow-400 text-white', 'A': 'bg-red-500 text-white' }[status] || 'bg-gray-200');
    return (<div><div className="flex justify-between items-center mb-4"><button onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))} className="px-3 py-1 bg-gray-200 rounded">&lt; Prev</button><h4 className="text-lg font-semibold">{displayMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h4><button onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))} className="px-3 py-1 bg-gray-200 rounded">Next &gt;</button></div><div className="overflow-x-auto"><table className="w-full text-center text-sm border-collapse"><thead><tr className="bg-gray-100"><th className="p-2 border">Worker</th>{daysArray.map(day => <th key={day} className="p-2 border w-10">{day}</th>)}</tr></thead><tbody>{workers.map(worker => (<tr key={worker.id}><td className="p-2 border text-left font-medium">{worker.name}</td>{daysArray.map(day => { const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day); const dateStr = formatDate(date); const status = attendance[worker.id]?.[dateStr]; const isEditable = date <= currentDate; return (<td key={day} className={`p-0 border`}>{isEditable ? (<select value={status || 'U'} onChange={(e) => onMark(worker.id, dateStr, e.target.value)} className={`w-full h-full text-center border-0 focus:ring-0 ${getStatusStyle(status)}`}><option value="U" disabled hidden></option><option value="P">P</option><option value="H">H</option><option value="A">A</option></select>) : (<div className="p-2 bg-gray-100"></div>)}</td>) })}</tr>))}</tbody></table></div></div>);
};


// --- MAIN FEATURE MODULES ---
const Dashboard = () => {
    const { financials, isLoading, yieldChartData, financialChartData } = useData();
    if (isLoading || !financials) return <Spinner />;
    return (<div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><StatCard title="Total Revenue" value={`₹${financials.summary.revenue.toLocaleString('en-IN')}`} icon={<RevenueIcon />} /><StatCard title="Total Expenses" value={`₹${financials.summary.expenses.toLocaleString('en-IN')}`} icon={<ExpenseIcon />} /><StatCard title="Net Profit" value={`₹${financials.summary.profit.toLocaleString('en-IN')}`} icon={<ProfitIcon />} /></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card title="Yield Performance"><ResponsiveContainer width="100%" height={300}><BarChart data={yieldChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Tomatoes" fill="#8884d8" /><Bar dataKey="Potatoes" fill="#82ca9d" /></BarChart></ResponsiveContainer></Card><Card title="Financial Overview"><ResponsiveContainer width="100%" height={300}><LineChart data={financialChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="revenue" stroke="#8884d8" /><Line type="monotone" dataKey="expenses" stroke="#82ca9d" /></LineChart></ResponsiveContainer></Card></div></div>);
};
const CropManagement = () => {
    const { yields, cropOptions, addYield, inventory, sales, addSale, isLoading } = useData();
    const [activeTab, setActiveTab] = useState('harvests');
    const [isYieldModalOpen, setIsYieldModalOpen] = useState(false);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [itemToSell, setItemToSell] = useState(null);
    const [selectedYear, setSelectedYear] = useState('All');
    const [selectedSeason, setSelectedSeason] = useState('All');

    const availableYears = useMemo(() => ['All', ...new Set(yields.map(y => new Date(y.date).getFullYear()))].sort(), [yields]);
    const filteredYields = useMemo(() => { return yields.filter(y => { const date = new Date(y.date); const year = date.getFullYear(); const month = date.getMonth() + 1; const yearMatch = selectedYear === 'All' || year === parseInt(selectedYear); if (!yearMatch) return false; if (selectedSeason === 'All') return true; if (selectedSeason === 'Kharif' && month >= 6 && month <= 10) return true; if (selectedSeason === 'Rabi' && (month >= 11 || month <= 4)) return true; return false; }); }, [yields, selectedYear, selectedSeason]);

    const groupedYields = useMemo(() => {
        return filteredYields.reduce((acc, item) => {
            if (!acc[item.crop]) acc[item.crop] = [];
            acc[item.crop].push(item);
            return acc;
        }, {});
    }, [filteredYields]);

    const groupedInventory = useMemo(() => {
        return inventory.reduce((acc, item) => {
            if (!acc[item.crop]) acc[item.crop] = [];
            acc[item.crop].push(item);
            return acc;
        }, {});
    }, [inventory]);

    const groupedSales = useMemo(() => {
        return sales.reduce((acc, item) => {
            if (!acc[item.crop]) acc[item.crop] = [];
            acc[item.crop].push(item);
            return acc;
        }, {});
    }, [sales]);

    const handleSaveYield = (yieldData) => { addYield(yieldData); setIsYieldModalOpen(false); };
    const handleOpenSaleModal = (item) => { setItemToSell(item); setIsSaleModalOpen(true); };
    const handleSaveSale = (saleData) => { addSale(saleData); setIsSaleModalOpen(false); };

    if (isLoading) return <Spinner />;

    return (
        <>
            <YieldModal isOpen={isYieldModalOpen} onClose={() => setIsYieldModalOpen(false)} onSave={handleSaveYield} cropOptions={cropOptions} />
            <SaleModal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} onSave={handleSaveSale} itemToSell={itemToSell} />

            {/* Tab Navigation */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('harvests')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'harvests' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        🌾 Harvest Records
                    </button>
                    <button onClick={() => setActiveTab('inventory')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'inventory' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        📦 Current Inventory
                    </button>
                    <button onClick={() => setActiveTab('sales')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'sales' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        💰 Sales Log
                    </button>
                </nav>
            </div>

            {/* Harvests Tab */}
            {activeTab === 'harvests' && (
                <Card title="Yield Harvest Records" titleActions={
                    <div className="flex items-center space-x-2">
                        <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className="text-sm rounded-md border-gray-300 shadow-sm">
                            <option value="All">All Seasons</option>
                            <option value="Kharif">Kharif (Jun-Oct)</option>
                            <option value="Rabi">Rabi (Nov-Apr)</option>
                        </select>
                        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="text-sm rounded-md border-gray-300 shadow-sm">
                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button onClick={() => setIsYieldModalOpen(true)} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700">
                            Add Harvest
                        </button>
                    </div>
                }>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Quantity</th>
                                    <th className="p-3">Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(groupedYields).map(([crop, yieldsList]) => (
                                    <React.Fragment key={crop}>
                                        <tr className="bg-green-50">
                                            <td colSpan="3" className="p-3 font-bold text-green-800">{crop}</td>
                                        </tr>
                                        {yieldsList.map((y) => (
                                            <tr key={y.id} className="border-b">
                                                <td className="p-3">{y.date}</td>
                                                <td className="p-3">{y.quantity} {y.unit}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${y.grade === 'A' ? 'bg-green-200 text-green-800' : y.grade === 'B' ? 'bg-blue-200 text-blue-800' : 'bg-yellow-200 text-yellow-800'}`}>{y.grade}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
                <Card title="Current Crop Inventory">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-3">Grade</th>
                                    <th className="p-3">Available Quantity</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(groupedInventory).map(([crop, grades]) => (
                                    <React.Fragment key={crop}>
                                        <tr className="bg-blue-50">
                                            <td colSpan="3" className="p-3 font-bold text-blue-800">{crop}</td>
                                        </tr>
                                        {grades.map((item) => (
                                            <tr key={`${item.crop}-${item.grade}`} className="border-b">
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.grade === 'A' ? 'bg-green-200 text-green-800' : item.grade === 'B' ? 'bg-blue-200 text-blue-800' : 'bg-yellow-200 text-yellow-800'}`}>{item.grade}</span>
                                                </td>
                                                <td className="p-3">{item.quantity} {item.unit}</td>
                                                <td className="p-3">
                                                    <button onClick={() => handleOpenSaleModal(item)} disabled={item.quantity <= 0} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
                                                        Record Sale
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Sales Tab */}
            {activeTab === 'sales' && (
                <Card title="Recent Sales Log">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Grade</th>
                                    <th className="p-3">Quantity</th>
                                    <th className="p-3">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(groupedSales).map(([crop, salesList]) => (
                                    <React.Fragment key={crop}>
                                        <tr className="bg-gray-50">
                                            <td colSpan="4" className="p-3 font-bold text-gray-700">{crop}</td>
                                        </tr>
                                        {salesList.map((s) => (
                                            <tr key={s.id} className="border-b">
                                                <td className="p-3">{s.date}</td>
                                                <td className="p-3">{s.grade}</td>
                                                <td className="p-3">{s.quantity} {s.unit}</td>
                                                <td className="p-3 text-green-600 font-semibold">+₹{s.revenue.toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </>
    );
};

const FinancialTracking = () => {
    const { financials, isLoading } = useData();
    if (isLoading || !financials) return <Spinner />;
    return (<Card title="Financial Transactions"><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-100"><th className="p-3">Description</th><th className="p-3">Type</th><th className="p-3">Amount</th></tr></thead><tbody>{financials.recentTransactions.map(t => (<tr key={t.id} className="border-b"><td className="p-3">{t.description}</td><td className="p-3">{t.type}</td><td className={`p-3 font-semibold ${t.type === 'Revenue' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'Revenue' ? '+' : ''}₹{Math.abs(t.amount).toLocaleString('en-IN')}</td></tr>))}</tbody></table></div></Card>);
};
const ResourceInventory = () => {
    const { resources, updateResource, addResourceCategory, isLoading } = useData();
    const [activeTab, setActiveTab] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        if (!activeTab && resources && Object.keys(resources).length > 0) {
            setActiveTab(Object.keys(resources)[0]);
        }
    }, [resources, activeTab]);

    if (isLoading) return <Spinner />;

    const getCurrentList = () => {
        if (!activeTab || !resources[activeTab]) return [];
        return resources[activeTab];
    };

    const handleOpenModal = (item = null) => { setEditingItem(item); setIsModalOpen(true); };
    const handleSave = (item) => {
        updateResource(activeTab, item);
        setIsModalOpen(false);
    };

    const handleAddCategory = (e) => {
        e.preventDefault();
        if (newCategoryName.trim()) {
            addResourceCategory(newCategoryName.trim());
            setActiveTab(newCategoryName.trim());
            setNewCategoryName('');
            setIsCategoryModalOpen(false);
        }
    };

    return (
        <>
            <ResourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} item={editingItem} />

            {/* Simple Modal for Adding Category */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-80">
                        <h2 className="text-xl font-bold mb-4">Add New Category</h2>
                        <form onSubmit={handleAddCategory}>
                            <input
                                className="w-full border p-2 rounded mb-4"
                                placeholder="Category Name (e.g. Seeds)"
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                                autoFocus
                            />
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-3 py-1 border rounded">Cancel</button>
                                <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded">Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Card title="Farm Resources">
                <div className="flex flex-wrap gap-2 mb-4">
                    {Object.keys(resources).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg capitalize ${activeTab === tab ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                            {tab}
                        </button>
                    ))}
                    <button onClick={() => setIsCategoryModalOpen(true)} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold border border-gray-300">
                        +
                    </button>
                </div>

                {activeTab ? (
                    <>
                        <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded">
                            <h4 className="text-lg font-semibold text-gray-700">{activeTab} Inventory</h4>
                            <button onClick={() => handleOpenModal()} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center">
                                <span className="mr-2">+</span> Add {activeTab} Item
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Stock</th>
                                        <th className="p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getCurrentList().map(item => (
                                        <tr key={item.id} className="border-b">
                                            <td className="p-3">{item.name}</td>
                                            <td className="p-3 font-medium">{item.stock} {item.unit}</td>
                                            <td className="p-3">
                                                <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:text-blue-800"><EditIcon /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {getCurrentList().length === 0 && <p className="text-center p-4 text-gray-500">No items found in {activeTab}.</p>}
                        </div>
                    </>
                ) : (
                    <p className="text-center text-gray-500 py-10">No categories found. Add a category to start.</p>
                )}
            </Card>
        </>
    );
};
const WorkerManagement = () => {
    const { workers, attendance, addWorker, updateWorkerDetails, markAttendance, confirmWorkerPayment, adjustLoanBalance, deactivateWorker, activateWorker, currentDate, isLoading } = useData();
    const [view, setView] = useState('payments');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [showInactive, setShowInactive] = useState(false);

    // Filter workers based on showInactive toggle
    const displayedWorkers = showInactive ? workers : workers.filter(w => w.isActive !== false);

    const handleEditClick = (worker) => { setSelectedWorker(worker); setIsEditModalOpen(true); };
    const handleSaveWorker = (updatedWorker) => { updateWorkerDetails(updatedWorker); setIsEditModalOpen(false); };

    const handleAddWorker = (workerData) => {
        addWorker(workerData);
        setIsAddModalOpen(false);
    };

    const handleAdjustLoanClick = (worker) => { setSelectedWorker(worker); setIsLoanModalOpen(true); };
    const handleSaveLoanAdjustment = (adjustmentData) => { adjustLoanBalance(adjustmentData); setIsLoanModalOpen(false); };

    const handleDeactivate = (workerId, workerName) => {
        const notes = prompt(`Mark ${workerName} as inactive.\n\nOptional: Add notes (e.g., "Harvest season ended - Expected return: March 2026")`);
        if (notes !== null) {  // null means cancelled
            deactivateWorker(workerId, notes || '');
        }
    };

    const handleActivate = (workerId) => {
        activateWorker(workerId);
    };

    if (isLoading) return <Spinner />;
    return (<>
        <EditWorkerModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveWorker} worker={selectedWorker} />
        <AddWorkerModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleAddWorker} />
        <LoanAdjustmentModal isOpen={isLoanModalOpen} onClose={() => setIsLoanModalOpen(false)} onSave={handleSaveLoanAdjustment} worker={selectedWorker} />
        <div className="mb-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-6">
                <button onClick={() => setView('payments')} className={`py-3 px-1 border-b-2 font-medium ${view === 'payments' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Weekly Payments</button>
                <button onClick={() => setView('daily')} className={`py-3 px-1 border-b-2 font-medium ${view === 'daily' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Daily Attendance</button>
                <button onClick={() => setView('monthly')} className={`py-3 px-1 border-b-2 font-medium ${view === 'monthly' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Monthly View</button>
            </nav>
        </div>
        <Card
            title={{ 'payments': 'Weekly Worker Payments', 'daily': "Today's Attendance", 'monthly': 'Monthly Attendance View' }[view]}
            titleActions={
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center text-sm"
                    >
                        <span className="mr-2">+</span> Add Worker
                    </button>
                    <label className="flex items-center space-x-2 text-sm">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        <span className="text-gray-600">Show Inactive Workers</span>
                    </label>
                </div>
            }
        >
            {view === 'payments' && <WorkerPayments workers={displayedWorkers} attendance={attendance} onEdit={handleEditClick} currentDate={currentDate} onConfirmPayment={confirmWorkerPayment} onAdjustLoan={handleAdjustLoanClick} onDeactivate={handleDeactivate} onActivate={handleActivate} />}
            {view === 'daily' && <DailyAttendance workers={displayedWorkers} attendance={attendance} onMark={markAttendance} currentDate={currentDate} />}
            {view === 'monthly' && <MonthlyAttendance workers={displayedWorkers} attendance={attendance} onMark={markAttendance} currentDate={currentDate} />}
        </Card>
    </>);
};


// --- LAYOUT & APP ROUTING ---
const NavLink = ({ to, icon, children, currentPath }) => { const isActive = (currentPath === '/' && to === '/') || (currentPath === to); return (<a href={to} className={`flex items-center px-4 py-3 text-lg rounded-lg ${isActive ? 'bg-green-700 text-white' : 'text-green-100 hover:bg-green-700'}`}>{icon}<span className="ml-4">{children}</span></a>); }
const Sidebar = ({ isSidebarOpen, currentPath }) => (<aside className={`bg-green-800 text-white w-64 space-y-2 py-7 px-2 absolute inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 z-30`}><div className="px-4 mb-8 text-center"><h1 className="text-3xl font-bold">FarmSight 360</h1><p className="text-sm text-green-200">Yield & Workforce Tracker</p></div><nav><NavLink to="/" icon={<DashboardIcon />} currentPath={currentPath}>Dashboard</NavLink><NavLink to="/crops" icon={<YieldIcon />} currentPath={currentPath}>Crop Management</NavLink><NavLink to="/workers" icon={<WorkerIcon />} currentPath={currentPath}>Workers</NavLink><NavLink to="/financials" icon={<FinancialIcon />} currentPath={currentPath}>Financials</NavLink><NavLink to="/resources" icon={<FertiliserIcon />} currentPath={currentPath}>Farm Resources</NavLink></nav></aside>);
const Header = ({ toggleSidebar }) => {
    const { currentUser, currentFarm, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = () => {
        logout();
        window.location.reload(); // Reload to show login page
    };

    const navigateToSettings = () => {
        window.history.pushState({}, '', '/settings');
        window.dispatchEvent(new PopStateEvent('popstate'));
        setShowDropdown(false);
    };

    return (
        <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
            <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none md:hidden">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            <div className="text-2xl font-bold text-gray-700 hidden md:block">
                Welcome, {currentUser ? currentUser.name : 'Guest'}!
            </div>
            {currentUser && (
                <div className="relative">
                    <div
                        className="flex items-center cursor-pointer"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <div className="text-right mr-4">
                            <p className="font-semibold">{currentUser.name}</p>
                            <p className="text-sm text-gray-500">{currentFarm?.name || 'No Farm Selected'}</p>
                        </div>
                        <img
                            className="h-12 w-12 rounded-full object-cover"
                            src={currentUser.profilePicture || `https://i.pravatar.cc/150?u=${currentUser.name}`}
                            alt="User Avatar"
                        />
                    </div>

                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                            <button
                                onClick={navigateToSettings}
                                className="w-full text-left px-4 py-2 text-sm text-700 hover:bg-gray-100 flex items-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Settings
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
};

const routes = { '/': Dashboard, '/crops': CropManagement, '/workers': WorkerManagement, '/financials': FinancialTracking, '/resources': ResourceInventory, '/settings': AccountSettings };

export default function App() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [currentPath, setCurrentPath] = useState(window.location.pathname);
    useEffect(() => { const onLocationChange = () => setCurrentPath(window.location.pathname); window.addEventListener('popstate', onLocationChange); const handleLinkClick = (e) => { if (e.target.tagName === 'A' && e.target.href.startsWith(window.location.origin) && e.target.target !== '_blank') { e.preventDefault(); window.history.pushState({}, '', e.target.href); onLocationChange(); } }; window.addEventListener('click', handleLinkClick); return () => { window.removeEventListener('popstate', onLocationChange); window.removeEventListener('click', handleLinkClick); }; }, []);
    const Page = routes[currentPath] || routes['/'];
    return (
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
    );
}