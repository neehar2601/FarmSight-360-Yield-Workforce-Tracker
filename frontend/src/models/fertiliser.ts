export interface Fertiliser {
  id: string;
  name: string;
  brand: string;
  type: FertiliserType;
  composition: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    other?: { [key: string]: number };
  };
  unit: string;
  costPerUnit: number;
  supplier: string;
  safetyDataSheet?: string;
  storageRequirements?: string;
  applicationInstructions?: string;
  isActive: boolean;
}

export type FertiliserType = 'organic' | 'inorganic' | 'liquid' | 'granular' | 'slow-release';

export interface FertiliserInventory {
  id: string;
  fertiliserId: string;
  fertiliserName: string;
  currentStock: number;
  unit: string;
  minimumStock: number;
  maximumStock: number;
  lastRestocked: Date;
  expiryDate?: Date;
  batchNumber?: string;
  storageLocation: string;
  cost: number;
  supplier: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'expired';
}

export interface FertiliserApplication {
  id: string;
  farmId: string;
  fieldId: string;
  fieldName: string;
  fertiliserId: string;
  fertiliserName: string;
  applicationDate: Date;
  quantity: number;
  unit: string;
  applicationMethod: ApplicationMethod;
  weatherConditions: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
  };
  soilConditions?: {
    moisture: string;
    temperature: number;
    ph?: number;
  };
  cropStage: string;
  targetArea: number;
  ratePerHectare: number;
  totalCost: number;
  appliedBy: string;
  equipment?: string;
  notes?: string;
  photos?: string[];
  nextApplicationDate?: Date;
}

export type ApplicationMethod = 'broadcast' | 'band' | 'foliar' | 'injection' | 'fertigation' | 'side-dress';

export interface FertiliserPlan {
  id: string;
  farmId: string;
  fieldId: string;
  fieldName: string;
  crop: string;
  season: string;
  year: number;
  plannedApplications: PlannedApplication[];
  totalBudget: number;
  actualSpent: number;
  status: 'draft' | 'approved' | 'in-progress' | 'completed';
  createdBy: string;
  approvedBy?: string;
  notes?: string;
}

export interface PlannedApplication {
  id: string;
  fertiliserId: string;
  fertiliserName: string;
  plannedDate: Date;
  quantity: number;
  unit: string;
  cropStage: string;
  estimatedCost: number;
  actualApplicationId?: string;
  status: 'planned' | 'applied' | 'skipped';
  notes?: string;
}

export interface FertiliserAnalytics {
  totalSpent: number;
  totalApplications: number;
  averageCostPerHectare: number;
  mostUsedFertiliser: {
    name: string;
    quantity: number;
    cost: number;
  };
  monthlyUsage: Array<{
    month: string;
    quantity: number;
    cost: number;
    applications: number;
  }>;
  fertiliserBreakdown: Array<{
    fertiliserName: string;
    quantity: number;
    cost: number;
    percentage: number;
  }>;
  fieldUsage: Array<{
    fieldName: string;
    totalQuantity: number;
    totalCost: number;
    applications: number;
    costPerHectare: number;
  }>;
  inventoryStatus: Array<{
    fertiliserName: string;
    currentStock: number;
    status: string;
    daysUntilEmpty: number;
  }>;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  products: string[];
  paymentTerms: string;
  rating: number;
  isActive: boolean;
  notes?: string;
}
