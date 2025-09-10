import {
  Worker,
  AttendanceRecord,
  SalaryRecord,
  WorkerLoan,
  Task,
  WorkerAnalytics,
  AttendanceStatus,
} from '@/models';

// Mock data
const mockWorkers: Worker[] = [
  {
    id: 'worker-1',
    farmId: 'farm-1',
    employeeId: 'EMP001',
    name: 'Miguel Rodriguez',
    email: 'miguel.rodriguez@example.com',
    phone: '+1-555-0201',
    address: '123 Farm Road, Rural Town, ST 12345',
    position: 'Field Supervisor',
    department: 'Field Operations',
    hireDate: new Date('2023-03-15'),
    salary: 3500,
    salaryType: 'monthly',
    bankAccount: '****-1234',
    emergencyContact: {
      name: 'Maria Rodriguez',
      phone: '+1-555-0202',
      relationship: 'Spouse',
    },
    skills: ['Tractor Operation', 'Irrigation Systems', 'Team Leadership'],
    certifications: ['Safe Pesticide Application', 'First Aid'],
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    notes: 'Excellent supervisor with 8 years experience',
  },
  {
    id: 'worker-2',
    farmId: 'farm-1',
    employeeId: 'EMP002',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1-555-0203',
    address: '456 Country Lane, Rural Town, ST 12345',
    position: 'Agricultural Technician',
    department: 'Quality Control',
    hireDate: new Date('2023-06-01'),
    salary: 2800,
    salaryType: 'monthly',
    bankAccount: '****-5678',
    emergencyContact: {
      name: 'Robert Johnson',
      phone: '+1-555-0204',
      relationship: 'Father',
    },
    skills: ['Soil Testing', 'Crop Analysis', 'Data Collection'],
    certifications: ['Agricultural Science Degree', 'Organic Certification'],
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    notes: 'Recent graduate with excellent technical skills',
  },
  {
    id: 'worker-3',
    farmId: 'farm-1',
    employeeId: 'EMP003',
    name: 'Carlos Silva',
    email: 'carlos.silva@example.com',
    phone: '+1-555-0205',
    address: '789 Valley View, Rural Town, ST 12345',
    position: 'Equipment Operator',
    department: 'Field Operations',
    hireDate: new Date('2022-09-10'),
    salary: 25,
    salaryType: 'hourly',
    skills: ['Heavy Machinery', 'Maintenance', 'Welding'],
    certifications: ['Commercial Driver License', 'Equipment Safety'],
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    notes: 'Reliable operator with mechanical expertise',
  },
  {
    id: 'worker-4',
    farmId: 'farm-1',
    employeeId: 'EMP004',
    name: 'Lisa Chen',
    email: 'lisa.chen@example.com',
    phone: '+1-555-0206',
    position: 'Farm Hand',
    department: 'Field Operations',
    hireDate: new Date('2024-01-15'),
    salary: 120,
    salaryType: 'daily',
    skills: ['Planting', 'Harvesting', 'General Farm Work'],
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    notes: 'New hire, eager to learn',
  },
];

const generateAttendanceRecords = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'sick'];
  
  // Generate last 30 days of attendance for each worker
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    mockWorkers.forEach(worker => {
      const status = Math.random() > 0.15 ? 'present' : statuses[Math.floor(Math.random() * statuses.length)];
      let checkIn: Date | undefined;
      let checkOut: Date | undefined;
      let hoursWorked: number | undefined;
      
      if (status === 'present' || status === 'late') {
        const baseCheckIn = new Date(date);
        baseCheckIn.setHours(8, 0, 0, 0);
        
        if (status === 'late') {
          baseCheckIn.setMinutes(Math.random() * 60 + 15); // 15-75 minutes late
        }
        
        checkIn = baseCheckIn;
        checkOut = new Date(baseCheckIn);
        checkOut.setHours(17, Math.random() * 30, 0, 0); // 5:00-5:30 PM
        
        hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      }
      
      records.push({
        id: `attendance-${worker.id}-${date.toISOString().split('T')[0]}`,
        workerId: worker.id,
        workerName: worker.name,
        date,
        checkIn,
        checkOut,
        hoursWorked,
        overtimeHours: hoursWorked && hoursWorked > 8 ? hoursWorked - 8 : 0,
        status,
        location: status === 'present' || status === 'late' ? {
          latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
          longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
        } : undefined,
        taskAssigned: status === 'present' ? ['Field Work', 'Equipment Maintenance', 'Quality Control'][Math.floor(Math.random() * 3)] : undefined,
      });
    });
  }
  
  return records;
};

const mockAttendanceRecords = generateAttendanceRecords();

const mockSalaryRecords: SalaryRecord[] = [
  {
    id: 'salary-1',
    workerId: 'worker-1',
    workerName: 'Miguel Rodriguez',
    payPeriod: {
      startDate: new Date('2024-08-01'),
      endDate: new Date('2024-08-31'),
    },
    baseSalary: 3500,
    overtimePay: 280,
    bonuses: 200,
    deductions: 150,
    totalPay: 3830,
    daysWorked: 22,
    overtimeHours: 12,
    status: 'paid',
    paidDate: new Date('2024-09-05'),
    paymentMethod: 'Bank Transfer',
  },
  {
    id: 'salary-2',
    workerId: 'worker-2',
    workerName: 'Sarah Johnson',
    payPeriod: {
      startDate: new Date('2024-08-01'),
      endDate: new Date('2024-08-31'),
    },
    baseSalary: 2800,
    overtimePay: 120,
    bonuses: 0,
    deductions: 100,
    totalPay: 2820,
    daysWorked: 21,
    overtimeHours: 6,
    status: 'paid',
    paidDate: new Date('2024-09-05'),
    paymentMethod: 'Bank Transfer',
  },
];

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Harvest North Field Tomatoes',
    description: 'Complete harvest of ripe tomatoes from North Field section A-C',
    assignedTo: ['worker-1', 'worker-4'],
    assignedBy: 'user-1',
    priority: 'high',
    status: 'in-progress',
    dueDate: new Date('2024-09-15'),
    estimatedHours: 16,
    actualHours: 12,
    location: 'North Field',
    equipment: ['Harvest Bins', 'Ladder', 'Pruning Shears'],
    createdAt: new Date('2024-09-10'),
    notes: 'Focus on sections with highest ripeness first',
  },
  {
    id: 'task-2',
    title: 'Irrigation System Maintenance',
    description: 'Check and repair irrigation lines in South Field',
    assignedTo: ['worker-3'],
    assignedBy: 'user-1',
    priority: 'medium',
    status: 'pending',
    dueDate: new Date('2024-09-18'),
    estimatedHours: 8,
    location: 'South Field',
    equipment: ['Pipe Wrench', 'Replacement Parts'],
    createdAt: new Date('2024-09-08'),
  },
];

class WorkerService {
  async getWorkers(filters?: { 
    department?: string; 
    position?: string; 
    isActive?: boolean; 
  }): Promise<Worker[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    let workers = [...mockWorkers];
    
    if (filters) {
      if (filters.department) {
        workers = workers.filter(w => w.department === filters.department);
      }
      if (filters.position) {
        workers = workers.filter(w => w.position === filters.position);
      }
      if (filters.isActive !== undefined) {
        workers = workers.filter(w => w.isActive === filters.isActive);
      }
    }
    
    return workers;
  }

  async getWorker(id: string): Promise<Worker | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockWorkers.find(w => w.id === id) || null;
  }

  async createWorker(data: Omit<Worker, 'id' | 'farmId'>): Promise<Worker> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newWorker: Worker = {
      ...data,
      id: `worker-${Date.now()}`,
      farmId: 'farm-1',
    };
    
    mockWorkers.push(newWorker);
    return newWorker;
  }

  async updateWorker(id: string, data: Partial<Worker>): Promise<Worker> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const index = mockWorkers.findIndex(w => w.id === id);
    if (index === -1) {
      throw new Error('Worker not found');
    }
    
    mockWorkers[index] = { ...mockWorkers[index], ...data };
    return mockWorkers[index];
  }

  async deleteWorker(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = mockWorkers.findIndex(w => w.id === id);
    if (index === -1) {
      throw new Error('Worker not found');
    }
    
    mockWorkers.splice(index, 1);
  }

  async getAttendanceRecords(filters?: {
    workerId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: AttendanceStatus;
  }): Promise<AttendanceRecord[]> {
    await new Promise(resolve => setTimeout(resolve, 700));
    
    let records = [...mockAttendanceRecords];
    
    if (filters) {
      if (filters.workerId) {
        records = records.filter(r => r.workerId === filters.workerId);
      }
      if (filters.startDate) {
        records = records.filter(r => r.date >= filters.startDate!);
      }
      if (filters.endDate) {
        records = records.filter(r => r.date <= filters.endDate!);
      }
      if (filters.status) {
        records = records.filter(r => r.status === filters.status);
      }
    }
    
    return records.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async recordAttendance(data: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newRecord: AttendanceRecord = {
      ...data,
      id: `attendance-${Date.now()}`,
    };
    
    mockAttendanceRecords.unshift(newRecord);
    return newRecord;
  }

  async getSalaryRecords(workerId?: string): Promise<SalaryRecord[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    if (workerId) {
      return mockSalaryRecords.filter(r => r.workerId === workerId);
    }
    
    return [...mockSalaryRecords];
  }

  async generateSalaryRecord(workerId: string, payPeriod: { startDate: Date; endDate: Date }): Promise<SalaryRecord> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const worker = mockWorkers.find(w => w.id === workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }
    
    // Calculate based on attendance records in the period
    const attendanceRecords = mockAttendanceRecords.filter(r => 
      r.workerId === workerId &&
      r.date >= payPeriod.startDate &&
      r.date <= payPeriod.endDate
    );
    
    const daysWorked = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const totalHours = attendanceRecords.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
    const overtimeHours = attendanceRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);
    
    let baseSalary: number;
    if (worker.salaryType === 'monthly') {
      baseSalary = worker.salary;
    } else if (worker.salaryType === 'daily') {
      baseSalary = worker.salary * daysWorked;
    } else {
      baseSalary = worker.salary * totalHours;
    }
    
    const overtimePay = overtimeHours * (worker.salaryType === 'hourly' ? worker.salary * 1.5 : 25);
    const bonuses = daysWorked >= 20 ? 100 : 0;
    const deductions = baseSalary * 0.03; // 3% deductions
    
    const newSalaryRecord: SalaryRecord = {
      id: `salary-${Date.now()}`,
      workerId,
      workerName: worker.name,
      payPeriod,
      baseSalary,
      overtimePay,
      bonuses,
      deductions,
      totalPay: baseSalary + overtimePay + bonuses - deductions,
      daysWorked,
      overtimeHours,
      status: 'pending',
    };
    
    mockSalaryRecords.push(newSalaryRecord);
    return newSalaryRecord;
  }

  async getTasks(filters?: { assignedTo?: string; status?: string }): Promise<Task[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    let tasks = [...mockTasks];
    
    if (filters) {
      if (filters.assignedTo) {
        tasks = tasks.filter(t => t.assignedTo.includes(filters.assignedTo!));
      }
      if (filters.status) {
        tasks = tasks.filter(t => t.status === filters.status);
      }
    }
    
    return tasks;
  }

  async createTask(data: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const newTask: Task = {
      ...data,
      id: `task-${Date.now()}`,
      createdAt: new Date(),
    };
    
    mockTasks.push(newTask);
    return newTask;
  }

  async getWorkerAnalytics(): Promise<WorkerAnalytics> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const totalWorkers = mockWorkers.length;
    const activeWorkers = mockWorkers.filter(w => w.isActive).length;
    
    // Calculate attendance rate from last 30 days
    const recentAttendance = mockAttendanceRecords.filter(r => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return r.date >= thirtyDaysAgo;
    });
    
    const totalWorkDays = recentAttendance.length;
    const presentDays = recentAttendance.filter(r => r.status === 'present').length;
    const averageAttendance = totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0;
    
    const totalSalaryExpense = mockSalaryRecords.reduce((sum, r) => sum + r.totalPay, 0);
    
    // Department breakdown
    const departmentMap = new Map<string, { count: number; totalSalary: number }>();
    mockWorkers.forEach(worker => {
      const dept = worker.department || 'Unassigned';
      const existing = departmentMap.get(dept) || { count: 0, totalSalary: 0 };
      departmentMap.set(dept, {
        count: existing.count + 1,
        totalSalary: existing.totalSalary + worker.salary,
      });
    });
    
    const departmentBreakdown = Array.from(departmentMap.entries()).map(([department, data]) => ({
      department,
      count: data.count,
      avgSalary: data.count > 0 ? data.totalSalary / data.count : 0,
    }));
    
    // Attendance trends (last 14 days)
    const attendanceTrends = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayRecords = mockAttendanceRecords.filter(r => 
        r.date.toDateString() === date.toDateString()
      );
      
      return {
        date: date.toISOString().split('T')[0],
        present: dayRecords.filter(r => r.status === 'present').length,
        absent: dayRecords.filter(r => r.status === 'absent').length,
        late: dayRecords.filter(r => r.status === 'late').length,
      };
    }).reverse();
    
    // Top performers (by attendance rate)
    const topPerformers = mockWorkers.map(worker => {
      const workerAttendance = recentAttendance.filter(r => r.workerId === worker.id);
      const workerPresentDays = workerAttendance.filter(r => r.status === 'present').length;
      const attendanceRate = workerAttendance.length > 0 ? (workerPresentDays / workerAttendance.length) * 100 : 0;
      
      return {
        workerId: worker.id,
        name: worker.name,
        attendanceRate,
        tasksCompleted: mockTasks.filter(t => 
          t.assignedTo.includes(worker.id) && t.status === 'completed'
        ).length,
      };
    })
    .sort((a, b) => b.attendanceRate - a.attendanceRate)
    .slice(0, 5);
    
    return {
      totalWorkers,
      activeWorkers,
      averageAttendance,
      totalSalaryExpense,
      departmentBreakdown,
      attendanceTrends,
      topPerformers,
    };
  }

  async getDepartments(): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const departments = [...new Set(mockWorkers.map(w => w.department).filter(Boolean))] as string[];
    return departments;
  }

  async getPositions(): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const positions = [...new Set(mockWorkers.map(w => w.position))];
    return positions;
  }
}

export const workerService = new WorkerService();
