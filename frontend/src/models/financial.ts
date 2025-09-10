export interface Transaction {
  id: string;
  farmId: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  date: Date;
  description: string;
  referenceId?: string; // Link to yield, worker, equipment etc.
  referenceType?: 'yield' | 'salary' | 'equipment' | 'fertiliser' | 'other';
  paymentMethod?: string;
  vendor?: string;
  invoice?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: Date;
  tags?: string[];
  photos?: string[];
}

export interface ExpenseCategory {
  id: string;
  name: string;
  type: 'fixed' | 'variable';
  parentCategory?: string;
  budgetAllocation?: number;
  description?: string;
}

export interface Budget {
  id: string;
  farmId: string;
  year: number;
  quarter?: number;
  month?: number;
  categories: BudgetCategory[];
  totalBudget: number;
  totalSpent: number;
  status: 'draft' | 'approved' | 'active' | 'completed';
  createdBy: string;
  approvedBy?: string;
  notes?: string;
}

export interface BudgetCategory {
  categoryId: string;
  categoryName: string;
  budgetedAmount: number;
  spentAmount: number;
  variance: number;
  variancePercentage: number;
}

export interface FinancialReport {
  id: string;
  farmId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueByProduce: Array<{
    produce: string;
    revenue: number;
    percentage: number;
  }>;
  expensesByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  roi: number;
  generatedAt: Date;
  generatedBy: string;
}

export interface TaxRecord {
  id: string;
  farmId: string;
  taxYear: number;
  quarter?: number;
  taxableIncome: number;
  taxableExpenses: number;
  taxOwed: number;
  taxPaid: number;
  taxType: string;
  dueDate: Date;
  filedDate?: Date;
  status: 'pending' | 'filed' | 'paid' | 'overdue';
  documents?: string[];
}

export interface CashFlow {
  id: string;
  farmId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  openingBalance: number;
  closingBalance: number;
  cashInflows: Array<{
    source: string;
    amount: number;
    date: Date;
  }>;
  cashOutflows: Array<{
    category: string;
    amount: number;
    date: Date;
  }>;
  netCashFlow: number;
  projectedBalance: number;
}

export interface FinancialAnalytics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  revenueGrowth: number;
  expenseGrowth: number;
  cashFlow: number;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
    profitMargin: number;
  }>;
  topExpenseCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
    trend: number;
  }>;
  revenueBreakdown: Array<{
    source: string;
    amount: number;
    percentage: number;
  }>;
}
