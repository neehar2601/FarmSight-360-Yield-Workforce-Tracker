export interface Worker {
  id: string;
  farmId: string;
  employeeId: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  position: string;
  department?: string;
  hireDate: Date;
  salary: number;
  salaryType: 'daily' | 'weekly' | 'monthly' | 'hourly';
  bankAccount?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  skills: string[];
  certifications?: string[];
  isActive: boolean;
  avatar?: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  workerName: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  hoursWorked?: number;
  overtimeHours?: number;
  status: AttendanceStatus;
  location?: {
    latitude: number;
    longitude: number;
  };
  taskAssigned?: string;
  notes?: string;
  approvedBy?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half-day' | 'sick' | 'leave';

export interface SalaryRecord {
  id: string;
  workerId: string;
  workerName: string;
  payPeriod: {
    startDate: Date;
    endDate: Date;
  };
  baseSalary: number;
  overtimePay: number;
  bonuses: number;
  deductions: number;
  totalPay: number;
  daysWorked: number;
  overtimeHours: number;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: Date;
  paymentMethod?: string;
  notes?: string;
}

export interface WorkerLoan {
  id: string;
  workerId: string;
  workerName: string;
  amount: number;
  interestRate: number;
  issueDate: Date;
  dueDate: Date;
  remainingAmount: number;
  status: 'active' | 'paid' | 'overdue';
  monthlyDeduction: number;
  purpose?: string;
  approvedBy: string;
  payments: LoanPayment[];
}

export interface LoanPayment {
  id: string;
  loanId: string;
  amount: number;
  paymentDate: Date;
  principalAmount: number;
  interestAmount: number;
  remainingBalance: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string[];
  assignedBy: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate: Date;
  estimatedHours?: number;
  actualHours?: number;
  location?: string;
  equipment?: string[];
  createdAt: Date;
  completedAt?: Date;
  notes?: string;
}

export interface WorkerAnalytics {
  totalWorkers: number;
  activeWorkers: number;
  averageAttendance: number;
  totalSalaryExpense: number;
  departmentBreakdown: Array<{
    department: string;
    count: number;
    avgSalary: number;
  }>;
  attendanceTrends: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
  }>;
  topPerformers: Array<{
    workerId: string;
    name: string;
    attendanceRate: number;
    tasksCompleted: number;
  }>;
}
