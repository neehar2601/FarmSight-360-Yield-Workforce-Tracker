import {
  Fertiliser,
  FertiliserInventory,
  FertiliserApplication,
  FertiliserPlan,
  FertiliserAnalytics,
  Supplier,
  FertiliserType,
  ApplicationMethod,
} from '@/models';

// Mock data
const mockFertilisers: Fertiliser[] = [
  {
    id: 'fert-1',
    name: 'NPK 10-10-10',
    brand: 'FarmGrow',
    type: 'granular',
    composition: {
      nitrogen: 10,
      phosphorus: 10,
      potassium: 10,
    },
    unit: 'kg',
    costPerUnit: 25,
    supplier: 'AgriSupply Inc.',
    applicationInstructions: 'Apply 200-300 kg per hectare during planting season',
    storageRequirements: 'Store in cool, dry place away from moisture',
    isActive: true,
  },
  {
    id: 'fert-2',
    name: 'Organic Compost',
    brand: 'NatureFert',
    type: 'organic',
    composition: {
      nitrogen: 3,
      phosphorus: 2,
      potassium: 1,
      other: { carbon: 35, organicMatter: 45 },
    },
    unit: 'tons',
    costPerUnit: 150,
    supplier: 'Organic Solutions Ltd.',
    applicationInstructions: 'Apply 2-4 tons per hectare as base fertilizer',
    storageRequirements: 'Keep under cover, allow proper ventilation',
    isActive: true,
  },
  {
    id: 'fert-3',
    name: 'Liquid NPK 20-20-20',
    brand: 'QuickGrow',
    type: 'liquid',
    composition: {
      nitrogen: 20,
      phosphorus: 20,
      potassium: 20,
    },
    unit: 'liters',
    costPerUnit: 12,
    supplier: 'AgriSupply Inc.',
    applicationInstructions: 'Dilute 1:100 with water for foliar application',
    storageRequirements: 'Store at room temperature, protect from freezing',
    isActive: true,
  },
  {
    id: 'fert-4',
    name: 'Urea 46-0-0',
    brand: 'CropBoost',
    type: 'granular',
    composition: {
      nitrogen: 46,
      phosphorus: 0,
      potassium: 0,
    },
    unit: 'kg',
    costPerUnit: 22,
    supplier: 'FertilizerCorp',
    applicationInstructions: 'Apply 100-150 kg per hectare for nitrogen boost',
    storageRequirements: 'Keep dry, avoid contact with moisture',
    isActive: true,
  },
];

const mockInventory: FertiliserInventory[] = [
  {
    id: 'inv-1',
    fertiliserId: 'fert-1',
    fertiliserName: 'NPK 10-10-10',
    currentStock: 2500,
    unit: 'kg',
    minimumStock: 500,
    maximumStock: 5000,
    lastRestocked: new Date('2024-08-15'),
    expiryDate: new Date('2025-08-15'),
    batchNumber: 'NPK-2024-08-001',
    storageLocation: 'Warehouse A - Section 1',
    cost: 62500,
    supplier: 'AgriSupply Inc.',
    status: 'in-stock',
  },
  {
    id: 'inv-2',
    fertiliserId: 'fert-2',
    fertiliserName: 'Organic Compost',
    currentStock: 8,
    unit: 'tons',
    minimumStock: 5,
    maximumStock: 20,
    lastRestocked: new Date('2024-07-20'),
    storageLocation: 'Open Storage Area B',
    cost: 1200,
    supplier: 'Organic Solutions Ltd.',
    status: 'in-stock',
  },
  {
    id: 'inv-3',
    fertiliserId: 'fert-3',
    fertiliserName: 'Liquid NPK 20-20-20',
    currentStock: 150,
    unit: 'liters',
    minimumStock: 100,
    maximumStock: 500,
    lastRestocked: new Date('2024-09-01'),
    expiryDate: new Date('2026-09-01'),
    batchNumber: 'LIQ-2024-09-003',
    storageLocation: 'Chemical Storage Room',
    cost: 1800,
    supplier: 'AgriSupply Inc.',
    status: 'in-stock',
  },
  {
    id: 'inv-4',
    fertiliserId: 'fert-4',
    fertiliserName: 'Urea 46-0-0',
    currentStock: 300,
    unit: 'kg',
    minimumStock: 200,
    maximumStock: 1000,
    lastRestocked: new Date('2024-08-10'),
    expiryDate: new Date('2025-08-10'),
    batchNumber: 'UREA-2024-08-005',
    storageLocation: 'Warehouse A - Section 2',
    cost: 6600,
    supplier: 'FertilizerCorp',
    status: 'low-stock',
  },
];

const mockApplications: FertiliserApplication[] = [
  {
    id: 'app-1',
    farmId: 'farm-1',
    fieldId: 'field-1',
    fieldName: 'North Field',
    fertiliserId: 'fert-1',
    fertiliserName: 'NPK 10-10-10',
    applicationDate: new Date('2024-04-20'),
    quantity: 1200,
    unit: 'kg',
    applicationMethod: 'broadcast',
    weatherConditions: {
      temperature: 22,
      humidity: 65,
      windSpeed: 8,
      precipitation: 0,
    },
    soilConditions: {
      moisture: 'adequate',
      temperature: 18,
      ph: 6.5,
    },
    cropStage: 'Pre-planting',
    targetArea: 5.2,
    ratePerHectare: 230,
    totalCost: 30000,
    appliedBy: 'worker-1',
    equipment: 'Broadcast Spreader',
    notes: 'Applied before planting tomatoes',
    nextApplicationDate: new Date('2024-06-15'),
  },
  {
    id: 'app-2',
    farmId: 'farm-1',
    fieldId: 'field-2',
    fieldName: 'South Field',
    fertiliserId: 'fert-2',
    fertiliserName: 'Organic Compost',
    applicationDate: new Date('2024-02-15'),
    quantity: 15,
    unit: 'tons',
    applicationMethod: 'broadcast',
    weatherConditions: {
      temperature: 18,
      humidity: 70,
      windSpeed: 5,
      precipitation: 0,
    },
    soilConditions: {
      moisture: 'dry',
      temperature: 12,
    },
    cropStage: 'Field preparation',
    targetArea: 8.7,
    ratePerHectare: 1.7,
    totalCost: 2250,
    appliedBy: 'worker-3',
    equipment: 'Manure Spreader',
    notes: 'Base fertilizer for wheat field',
  },
];

const mockSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'AgriSupply Inc.',
    contactPerson: 'John Mitchell',
    email: 'john@agrisupply.com',
    phone: '+1-555-0301',
    address: '123 Industrial Drive, Supply City, ST 54321',
    products: ['NPK Fertilizers', 'Liquid Fertilizers', 'Pesticides'],
    paymentTerms: 'Net 30',
    rating: 4.5,
    isActive: true,
    notes: 'Reliable supplier with good pricing',
  },
  {
    id: 'sup-2',
    name: 'Organic Solutions Ltd.',
    contactPerson: 'Sarah Green',
    email: 'sarah@organicsolutions.com',
    phone: '+1-555-0302',
    address: '456 Eco Way, Green Valley, ST 54322',
    products: ['Organic Fertilizers', 'Compost', 'Bio-stimulants'],
    paymentTerms: 'Net 15',
    rating: 4.8,
    isActive: true,
    notes: 'Premium organic products, excellent quality',
  },
  {
    id: 'sup-3',
    name: 'FertilizerCorp',
    contactPerson: 'Mike Anderson',
    email: 'mike@fertilizercorp.com',
    phone: '+1-555-0303',
    address: '789 Chemical Road, Industrial Park, ST 54323',
    products: ['Urea', 'Phosphate', 'Potash'],
    paymentTerms: 'Net 45',
    rating: 4.2,
    isActive: true,
    notes: 'Large scale supplier, competitive bulk pricing',
  },
];

class FertiliserService {
  async getFertilisers(filters?: { type?: FertiliserType; isActive?: boolean }): Promise<Fertiliser[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let fertilisers = [...mockFertilisers];
    
    if (filters) {
      if (filters.type) {
        fertilisers = fertilisers.filter(f => f.type === filters.type);
      }
      if (filters.isActive !== undefined) {
        fertilisers = fertilisers.filter(f => f.isActive === filters.isActive);
      }
    }
    
    return fertilisers;
  }

  async getFertiliser(id: string): Promise<Fertiliser | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockFertilisers.find(f => f.id === id) || null;
  }

  async createFertiliser(data: Omit<Fertiliser, 'id'>): Promise<Fertiliser> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newFertiliser: Fertiliser = {
      ...data,
      id: `fert-${Date.now()}`,
    };
    
    mockFertilisers.push(newFertiliser);
    return newFertiliser;
  }

  async updateFertiliser(id: string, data: Partial<Fertiliser>): Promise<Fertiliser> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const index = mockFertilisers.findIndex(f => f.id === id);
    if (index === -1) {
      throw new Error('Fertiliser not found');
    }
    
    mockFertilisers[index] = { ...mockFertilisers[index], ...data };
    return mockFertilisers[index];
  }

  async getInventory(filters?: { status?: string; lowStock?: boolean }): Promise<FertiliserInventory[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    let inventory = [...mockInventory];
    
    if (filters) {
      if (filters.status) {
        inventory = inventory.filter(i => i.status === filters.status);
      }
      if (filters.lowStock) {
        inventory = inventory.filter(i => i.currentStock <= i.minimumStock);
      }
    }
    
    return inventory;
  }

  async updateInventory(id: string, data: Partial<FertiliserInventory>): Promise<FertiliserInventory> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = mockInventory.findIndex(i => i.id === id);
    if (index === -1) {
      throw new Error('Inventory item not found');
    }
    
    const updatedItem = { ...mockInventory[index], ...data };
    
    // Auto-update status based on stock levels
    if (updatedItem.currentStock <= 0) {
      updatedItem.status = 'out-of-stock';
    } else if (updatedItem.currentStock <= updatedItem.minimumStock) {
      updatedItem.status = 'low-stock';
    } else {
      updatedItem.status = 'in-stock';
    }
    
    mockInventory[index] = updatedItem;
    return updatedItem;
  }

  async getApplications(filters?: {
    fieldId?: string;
    fertiliserId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<FertiliserApplication[]> {
    await new Promise(resolve => setTimeout(resolve, 700));
    
    let applications = [...mockApplications];
    
    if (filters) {
      if (filters.fieldId) {
        applications = applications.filter(a => a.fieldId === filters.fieldId);
      }
      if (filters.fertiliserId) {
        applications = applications.filter(a => a.fertiliserId === filters.fertiliserId);
      }
      if (filters.startDate) {
        applications = applications.filter(a => a.applicationDate >= filters.startDate!);
      }
      if (filters.endDate) {
        applications = applications.filter(a => a.applicationDate <= filters.endDate!);
      }
    }
    
    return applications.sort((a, b) => b.applicationDate.getTime() - a.applicationDate.getTime());
  }

  async recordApplication(data: Omit<FertiliserApplication, 'id'>): Promise<FertiliserApplication> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newApplication: FertiliserApplication = {
      ...data,
      id: `app-${Date.now()}`,
    };
    
    // Update inventory
    const inventoryItem = mockInventory.find(i => i.fertiliserId === data.fertiliserId);
    if (inventoryItem) {
      inventoryItem.currentStock -= data.quantity;
      
      // Update status
      if (inventoryItem.currentStock <= 0) {
        inventoryItem.status = 'out-of-stock';
      } else if (inventoryItem.currentStock <= inventoryItem.minimumStock) {
        inventoryItem.status = 'low-stock';
      }
    }
    
    mockApplications.unshift(newApplication);
    return newApplication;
  }

  async getFertiliserPlans(fieldId?: string): Promise<FertiliserPlan[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock fertiliser plans
    const plans: FertiliserPlan[] = [
      {
        id: 'plan-1',
        farmId: 'farm-1',
        fieldId: 'field-1',
        fieldName: 'North Field',
        crop: 'Tomatoes',
        season: 'Spring-Summer 2024',
        year: 2024,
        totalBudget: 8000,
        actualSpent: 5500,
        status: 'in-progress',
        createdBy: 'user-1',
        plannedApplications: [
          {
            id: 'planned-1',
            fertiliserId: 'fert-1',
            fertiliserName: 'NPK 10-10-10',
            plannedDate: new Date('2024-04-20'),
            quantity: 1200,
            unit: 'kg',
            cropStage: 'Pre-planting',
            estimatedCost: 30000,
            actualApplicationId: 'app-1',
            status: 'applied',
          },
          {
            id: 'planned-2',
            fertiliserId: 'fert-3',
            fertiliserName: 'Liquid NPK 20-20-20',
            plannedDate: new Date('2024-06-15'),
            quantity: 50,
            unit: 'liters',
            cropStage: 'Flowering',
            estimatedCost: 600,
            status: 'planned',
            notes: 'Foliar application during flowering stage',
          },
        ],
      },
    ];
    
    if (fieldId) {
      return plans.filter(p => p.fieldId === fieldId);
    }
    
    return plans;
  }

  async createFertiliserPlan(data: Omit<FertiliserPlan, 'id'>): Promise<FertiliserPlan> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newPlan: FertiliserPlan = {
      ...data,
      id: `plan-${Date.now()}`,
    };
    
    return newPlan;
  }

  async getSuppliers(): Promise<Supplier[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return [...mockSuppliers];
  }

  async getFertiliserAnalytics(period?: { startDate: Date; endDate: Date }): Promise<FertiliserAnalytics> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    let applications = [...mockApplications];
    
    if (period) {
      applications = applications.filter(a => 
        a.applicationDate >= period.startDate && a.applicationDate <= period.endDate
      );
    }
    
    const totalSpent = applications.reduce((sum, a) => sum + a.totalCost, 0);
    const totalApplications = applications.length;
    
    // Calculate total area covered
    const totalArea = applications.reduce((sum, a) => sum + a.targetArea, 0);
    const averageCostPerHectare = totalArea > 0 ? totalSpent / totalArea : 0;
    
    // Most used fertiliser
    const fertiliserUsage = new Map<string, { quantity: number; cost: number }>();
    applications.forEach(a => {
      const existing = fertiliserUsage.get(a.fertiliserName) || { quantity: 0, cost: 0 };
      fertiliserUsage.set(a.fertiliserName, {
        quantity: existing.quantity + a.quantity,
        cost: existing.cost + a.totalCost,
      });
    });
    
    const [mostUsedName, mostUsedData] = Array.from(fertiliserUsage.entries())
      .sort((a, b) => b[1].quantity - a[1].quantity)[0] || ['None', { quantity: 0, cost: 0 }];
    
    const mostUsedFertiliser = {
      name: mostUsedName,
      quantity: mostUsedData.quantity,
      cost: mostUsedData.cost,
    };
    
    // Monthly usage (last 12 months)
    const monthlyUsage = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const monthApplications = applications.filter(a => 
        a.applicationDate.getMonth() === date.getMonth() &&
        a.applicationDate.getFullYear() === date.getFullYear()
      );
      
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        quantity: monthApplications.reduce((sum, a) => sum + a.quantity, 0),
        cost: monthApplications.reduce((sum, a) => sum + a.totalCost, 0),
        applications: monthApplications.length,
      };
    }).reverse();
    
    // Fertiliser breakdown
    const fertiliserBreakdown = Array.from(fertiliserUsage.entries()).map(([name, data]) => ({
      fertiliserName: name,
      quantity: data.quantity,
      cost: data.cost,
      percentage: totalSpent > 0 ? (data.cost / totalSpent) * 100 : 0,
    })).sort((a, b) => b.cost - a.cost);
    
    // Field usage analysis
    const fieldUsage = new Map<string, { quantity: number; cost: number; applications: number; area: number }>();
    applications.forEach(a => {
      const existing = fieldUsage.get(a.fieldName) || { quantity: 0, cost: 0, applications: 0, area: a.targetArea };
      fieldUsage.set(a.fieldName, {
        quantity: existing.quantity + a.quantity,
        cost: existing.cost + a.totalCost,
        applications: existing.applications + 1,
        area: a.targetArea, // Assuming consistent area per field
      });
    });
    
    const fieldUsageAnalysis = Array.from(fieldUsage.entries()).map(([fieldName, data]) => ({
      fieldName,
      totalQuantity: data.quantity,
      totalCost: data.cost,
      applications: data.applications,
      costPerHectare: data.area > 0 ? data.cost / data.area : 0,
    }));
    
    // Inventory status
    const inventoryStatus = mockInventory.map(item => ({
      fertiliserName: item.fertiliserName,
      currentStock: item.currentStock,
      status: item.status,
      daysUntilEmpty: item.currentStock > 0 ? Math.ceil(item.currentStock / 10) : 0, // Mock calculation
    }));
    
    return {
      totalSpent,
      totalApplications,
      averageCostPerHectare,
      mostUsedFertiliser,
      monthlyUsage,
      fertiliserBreakdown,
      fieldUsage: fieldUsageAnalysis,
      inventoryStatus,
    };
  }

  async getFertiliserTypes(): Promise<FertiliserType[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return ['organic', 'inorganic', 'liquid', 'granular', 'slow-release'];
  }

  async getApplicationMethods(): Promise<ApplicationMethod[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return ['broadcast', 'band', 'foliar', 'injection', 'fertigation', 'side-dress'];
  }

  async getCropStages(): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return [
      'Pre-planting',
      'Planting',
      'Germination',
      'Seedling',
      'Vegetative Growth',
      'Flowering',
      'Fruit Development',
      'Ripening',
      'Post-harvest',
    ];
  }
}

export const fertiliserService = new FertiliserService();
