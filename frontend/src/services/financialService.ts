import {
  Transaction,
  ExpenseCategory,
  Budget,
  FinancialReport,
  FinancialAnalytics,
  TaxRecord,
  CashFlow,
} from '@/models';

// Mock data
const mockExpenseCategories: ExpenseCategory[] = [
  { id: 'cat-1', name: 'Labor & Wages', type: 'fixed', description: 'Employee salaries and wages' },
  { id: 'cat-2', name: 'Seeds & Plants', type: 'variable', description: 'Cost of seeds and seedlings' },
  { id: 'cat-3', name: 'Fertilizers', type: 'variable', description: 'Fertilizers and soil amendments' },
  { id: 'cat-4', name: 'Equipment', type: 'fixed', description: 'Farm machinery and tools' },
  { id: 'cat-5', name: 'Fuel & Energy', type: 'variable', description: 'Diesel, gasoline, electricity' },
  { id: 'cat-6', name: 'Maintenance', type: 'variable', description: 'Equipment and facility maintenance' },
  { id: 'cat-7', name: 'Insurance', type: 'fixed', description: 'Farm and equipment insurance' },
  { id: 'cat-8', name: 'Utilities', type: 'fixed', description: 'Water, electricity, phone' },
];

const mockTransactions: Transaction[] = [
  {
    id: 'trans-1',
    farmId: 'farm-1',
    type: 'income',
    category: 'Crop Sales',
    amount: 54600,
    currency: 'USD',
    date: new Date('2024-08-15'),
    description: 'Tomato harvest sale - North Field',
    referenceId: 'yield-1',
    referenceType: 'yield',
    paymentMethod: 'Bank Transfer',
    vendor: 'Fresh Market Co.',
    status: 'completed',
    createdBy: 'user-1',
    createdAt: new Date('2024-08-15'),
    tags: ['tomatoes', 'harvest', 'fresh-market'],
  },
  {
    id: 'trans-2',
    farmId: 'farm-1',
    type: 'expense',
    category: 'Labor & Wages',
    amount: 3830,
    currency: 'USD',
    date: new Date('2024-09-05'),
    description: 'Monthly salary - Miguel Rodriguez',
    referenceId: 'salary-1',
    referenceType: 'salary',
    paymentMethod: 'Bank Transfer',
    status: 'completed',
    createdBy: 'user-1',
    createdAt: new Date('2024-09-05'),
    tags: ['salary', 'miguel'],
  },
  {
    id: 'trans-3',
    farmId: 'farm-1',
    type: 'expense',
    category: 'Fertilizers',
    amount: 1250,
    currency: 'USD',
    date: new Date('2024-07-20'),
    description: 'NPK fertilizer purchase - 50 bags',
    paymentMethod: 'Credit Card',
    vendor: 'AgriSupply Inc.',
    status: 'completed',
    createdBy: 'user-1',
    createdAt: new Date('2024-07-20'),
    tags: ['fertilizer', 'npk'],
  },
  {
    id: 'trans-4',
    farmId: 'farm-1',
    type: 'income',
    category: 'Crop Sales',
    amount: 7224,
    currency: 'USD',
    date: new Date('2024-07-22'),
    description: 'Wheat sale - South Field',
    referenceId: 'yield-2',
    referenceType: 'yield',
    paymentMethod: 'Check',
    vendor: 'Grain Traders LLC',
    status: 'completed',
    createdBy: 'user-1',
    createdAt: new Date('2024-07-22'),
    tags: ['wheat', 'grain'],
  },
  {
    id: 'trans-5',
    farmId: 'farm-1',
    type: 'expense',
    category: 'Fuel & Energy',
    amount: 450,
    currency: 'USD',
    date: new Date('2024-08-01'),
    description: 'Diesel fuel for tractors',
    paymentMethod: 'Cash',
    vendor: 'Country Fuel Station',
    status: 'completed',
    createdBy: 'user-1',
    createdAt: new Date('2024-08-01'),
    tags: ['fuel', 'diesel', 'tractor'],
  },
];

const mockBudgets: Budget[] = [
  {
    id: 'budget-1',
    farmId: 'farm-1',
    year: 2024,
    quarter: 3,
    totalBudget: 50000,
    totalSpent: 35670,
    status: 'active',
    createdBy: 'user-1',
    categories: [
      {
        categoryId: 'cat-1',
        categoryName: 'Labor & Wages',
        budgetedAmount: 20000,
        spentAmount: 15320,
        variance: -4680,
        variancePercentage: -23.4,
      },
      {
        categoryId: 'cat-3',
        categoryName: 'Fertilizers',
        budgetedAmount: 8000,
        spentAmount: 6250,
        variance: -1750,
        variancePercentage: -21.9,
      },
      {
        categoryId: 'cat-5',
        categoryName: 'Fuel & Energy',
        budgetedAmount: 3000,
        spentAmount: 2800,
        variance: -200,
        variancePercentage: -6.7,
      },
    ],
  },
];

class FinancialService {
  async getTransactions(filters?: {
    type?: 'income' | 'expense';
    category?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Transaction[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    let transactions = [...mockTransactions];
    
    if (filters) {
      if (filters.type) {
        transactions = transactions.filter(t => t.type === filters.type);
      }
      if (filters.category) {
        transactions = transactions.filter(t => t.category === filters.category);
      }
      if (filters.startDate) {
        transactions = transactions.filter(t => t.date >= filters.startDate!);
      }
      if (filters.endDate) {
        transactions = transactions.filter(t => t.date <= filters.endDate!);
      }
    }
    
    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockTransactions.find(t => t.id === id) || null;
  }

  async createTransaction(data: Omit<Transaction, 'id' | 'farmId' | 'createdBy' | 'createdAt'>): Promise<Transaction> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newTransaction: Transaction = {
      ...data,
      id: `trans-${Date.now()}`,
      farmId: 'farm-1',
      createdBy: 'user-1',
      createdAt: new Date(),
    };
    
    mockTransactions.unshift(newTransaction);
    return newTransaction;
  }

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const index = mockTransactions.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Transaction not found');
    }
    
    mockTransactions[index] = { ...mockTransactions[index], ...data };
    return mockTransactions[index];
  }

  async deleteTransaction(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = mockTransactions.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Transaction not found');
    }
    
    mockTransactions.splice(index, 1);
  }

  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mockExpenseCategories];
  }

  async getBudgets(year?: number): Promise<Budget[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (year) {
      return mockBudgets.filter(b => b.year === year);
    }
    
    return [...mockBudgets];
  }

  async createBudget(data: Omit<Budget, 'id' | 'farmId' | 'createdBy'>): Promise<Budget> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newBudget: Budget = {
      ...data,
      id: `budget-${Date.now()}`,
      farmId: 'farm-1',
      createdBy: 'user-1',
    };
    
    mockBudgets.push(newBudget);
    return newBudget;
  }

  async getFinancialReport(period: { startDate: Date; endDate: Date }): Promise<FinancialReport> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const transactions = mockTransactions.filter(t => 
      t.date >= period.startDate && t.date <= period.endDate
    );
    
    const revenue = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netProfit = revenue - expenses;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    
    // Revenue by produce
    const revenueByProduce = new Map<string, number>();
    transactions
      .filter(t => t.type === 'income' && t.referenceType === 'yield')
      .forEach(t => {
        const produce = t.description.split(' ')[0]; // Extract produce name
        revenueByProduce.set(produce, (revenueByProduce.get(produce) || 0) + t.amount);
      });
    
    const revenueBreakdown = Array.from(revenueByProduce.entries()).map(([produce, amount]) => ({
      produce,
      revenue: amount,
      percentage: revenue > 0 ? (amount / revenue) * 100 : 0,
    }));
    
    // Expenses by category
    const expensesByCategory = new Map<string, number>();
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expensesByCategory.set(t.category, (expensesByCategory.get(t.category) || 0) + t.amount);
      });
    
    const expensesBreakdown = Array.from(expensesByCategory.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: expenses > 0 ? (amount / expenses) * 100 : 0,
    }));
    
    // Monthly trends
    const monthlyTrends = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(period.startDate);
      date.setMonth(date.getMonth() + i);
      
      const monthTransactions = transactions.filter(t => 
        t.date.getMonth() === date.getMonth() && t.date.getFullYear() === date.getFullYear()
      );
      
      const monthRevenue = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const monthExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses,
      };
    });
    
    const report: FinancialReport = {
      id: `report-${Date.now()}`,
      farmId: 'farm-1',
      period,
      totalRevenue: revenue,
      totalExpenses: expenses,
      netProfit,
      profitMargin,
      revenueByProduce: revenueBreakdown,
      expensesByCategory: expensesBreakdown,
      monthlyTrends,
      roi: revenue > 0 ? (netProfit / expenses) * 100 : 0,
      generatedAt: new Date(),
      generatedBy: 'user-1',
    };
    
    return report;
  }

  async getFinancialAnalytics(period?: { startDate: Date; endDate: Date }): Promise<FinancialAnalytics> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    let transactions = [...mockTransactions];
    
    if (period) {
      transactions = transactions.filter(t => 
        t.date >= period.startDate && t.date <= period.endDate
      );
    }
    
    const totalRevenue = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const roi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;
    
    // Calculate growth rates (comparing to previous period)
    const previousPeriodStart = new Date(period?.startDate || new Date());
    previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 1);
    const previousPeriodEnd = new Date(period?.endDate || new Date());
    previousPeriodEnd.setFullYear(previousPeriodEnd.getFullYear() - 1);
    
    const previousTransactions = mockTransactions.filter(t => 
      t.date >= previousPeriodStart && t.date <= previousPeriodEnd
    );
    
    const previousRevenue = previousTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const previousExpenses = previousTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const expenseGrowth = previousExpenses > 0 ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 : 0;
    
    // Monthly trends (last 12 months)
    const monthlyTrends = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const monthTransactions = transactions.filter(t => 
        t.date.getMonth() === date.getMonth() && t.date.getFullYear() === date.getFullYear()
      );
      
      const monthRevenue = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const monthExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthProfit = monthRevenue - monthExpenses;
      const monthProfitMargin = monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0;
      
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthProfit,
        profitMargin: monthProfitMargin,
      };
    }).reverse();
    
    // Top expense categories
    const expensesByCategory = new Map<string, number>();
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expensesByCategory.set(t.category, (expensesByCategory.get(t.category) || 0) + t.amount);
      });
    
    const topExpenseCategories = Array.from(expensesByCategory.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        trend: Math.random() * 20 - 10, // Mock trend
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    // Revenue breakdown
    const revenueBySource = new Map<string, number>();
    transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const source = t.referenceType === 'yield' ? 'Crop Sales' : 'Other Income';
        revenueBySource.set(source, (revenueBySource.get(source) || 0) + t.amount);
      });
    
    const revenueBreakdown = Array.from(revenueBySource.entries()).map(([source, amount]) => ({
      source,
      amount,
      percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0,
    }));
    
    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      roi,
      revenueGrowth,
      expenseGrowth,
      cashFlow: netProfit,
      monthlyTrends,
      topExpenseCategories,
      revenueBreakdown,
    };
  }

  async getCashFlow(period: { startDate: Date; endDate: Date }): Promise<CashFlow> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const transactions = mockTransactions.filter(t => 
      t.date >= period.startDate && t.date <= period.endDate
    );
    
    const inflows = transactions
      .filter(t => t.type === 'income')
      .map(t => ({
        source: t.category,
        amount: t.amount,
        date: t.date,
      }));
    
    const outflows = transactions
      .filter(t => t.type === 'expense')
      .map(t => ({
        category: t.category,
        amount: t.amount,
        date: t.date,
      }));
    
    const totalInflows = inflows.reduce((sum, i) => sum + i.amount, 0);
    const totalOutflows = outflows.reduce((sum, o) => sum + o.amount, 0);
    
    return {
      id: `cashflow-${Date.now()}`,
      farmId: 'farm-1',
      period,
      openingBalance: 50000, // Mock opening balance
      closingBalance: 50000 + totalInflows - totalOutflows,
      cashInflows: inflows,
      cashOutflows: outflows,
      netCashFlow: totalInflows - totalOutflows,
      projectedBalance: 50000 + totalInflows - totalOutflows + 10000, // Mock projection
    };
  }

  async getTaxRecords(year?: number): Promise<TaxRecord[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Mock tax records
    const taxRecords: TaxRecord[] = [
      {
        id: 'tax-1',
        farmId: 'farm-1',
        taxYear: 2024,
        quarter: 1,
        taxableIncome: 15000,
        taxableExpenses: 8000,
        taxOwed: 1050,
        taxPaid: 1050,
        taxType: 'Income Tax',
        dueDate: new Date('2024-04-15'),
        filedDate: new Date('2024-04-10'),
        status: 'paid',
      },
    ];
    
    if (year) {
      return taxRecords.filter(r => r.taxYear === year);
    }
    
    return taxRecords;
  }

  async getIncomeCategories(): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return ['Crop Sales', 'Livestock Sales', 'Government Subsidies', 'Other Income'];
  }

  async getPaymentMethods(): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return ['Cash', 'Bank Transfer', 'Check', 'Credit Card', 'Mobile Payment'];
  }
}

export const financialService = new FinancialService();
