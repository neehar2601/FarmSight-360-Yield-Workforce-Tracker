import { 
  YieldRecord, 
  Field, 
  ProduceType, 
  CropRotation, 
  YieldAnalytics,
  QualityGrade 
} from '@/models';

// Mock data
const mockProduceTypes: ProduceType[] = [
  { id: 'prod-1', name: 'Tomatoes', category: 'Vegetables', unit: 'kg', averageYieldPerHectare: 45000, seasonalPattern: ['Spring', 'Summer'] },
  { id: 'prod-2', name: 'Wheat', category: 'Grains', unit: 'tons', averageYieldPerHectare: 3.2, seasonalPattern: ['Winter', 'Spring'] },
  { id: 'prod-3', name: 'Corn', category: 'Grains', unit: 'tons', averageYieldPerHectare: 8.5, seasonalPattern: ['Spring', 'Summer'] },
  { id: 'prod-4', name: 'Apples', category: 'Fruits', unit: 'kg', averageYieldPerHectare: 35000, seasonalPattern: ['Fall'] },
  { id: 'prod-5', name: 'Carrots', category: 'Vegetables', unit: 'kg', averageYieldPerHectare: 25000, seasonalPattern: ['Summer', 'Fall'] },
];

const mockFields: Field[] = [
  {
    id: 'field-1',
    name: 'North Field',
    area: 5.2,
    areaUnit: 'hectares',
    location: { latitude: 40.7128, longitude: -74.0060 },
    soilType: 'Loamy',
    currentCrop: 'Tomatoes',
    plantingDate: new Date('2024-04-15'),
    expectedHarvestDate: new Date('2024-08-15'),
    isActive: true,
  },
  {
    id: 'field-2',
    name: 'South Field',
    area: 8.7,
    areaUnit: 'hectares',
    location: { latitude: 40.7120, longitude: -74.0050 },
    soilType: 'Clay',
    currentCrop: 'Wheat',
    plantingDate: new Date('2024-03-01'),
    expectedHarvestDate: new Date('2024-07-20'),
    isActive: true,
  },
  {
    id: 'field-3',
    name: 'East Field',
    area: 3.5,
    areaUnit: 'hectares',
    location: { latitude: 40.7135, longitude: -74.0040 },
    soilType: 'Sandy',
    currentCrop: 'Carrots',
    plantingDate: new Date('2024-05-01'),
    expectedHarvestDate: new Date('2024-09-01'),
    isActive: true,
  },
];

const mockYieldRecords: YieldRecord[] = [
  {
    id: 'yield-1',
    farmId: 'farm-1',
    fieldId: 'field-1',
    fieldName: 'North Field',
    produce: 'Tomatoes',
    harvestDate: new Date('2024-08-15'),
    quantity: 15600,
    unit: 'kg',
    qualityGrade: 'A+',
    sellingPrice: 3.50,
    pricePerUnit: 3.50,
    totalRevenue: 54600,
    photos: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300'],
    notes: 'Excellent harvest despite early season drought',
    weather: 'Sunny, 28°C',
    createdBy: 'user-1',
    createdAt: new Date('2024-08-15T14:30:00'),
  },
  {
    id: 'yield-2',
    farmId: 'farm-1',
    fieldId: 'field-2',
    fieldName: 'South Field',
    produce: 'Wheat',
    harvestDate: new Date('2024-07-20'),
    quantity: 25.8,
    unit: 'tons',
    qualityGrade: 'A',
    sellingPrice: 280,
    pricePerUnit: 280,
    totalRevenue: 7224,
    photos: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300'],
    notes: 'Good quality grain, slightly affected by late rain',
    weather: 'Partly cloudy, 25°C',
    createdBy: 'user-1',
    createdAt: new Date('2024-07-20T16:45:00'),
  },
  {
    id: 'yield-3',
    farmId: 'farm-1',
    fieldId: 'field-1',
    fieldName: 'North Field',
    produce: 'Tomatoes',
    harvestDate: new Date('2024-09-01'),
    quantity: 12400,
    unit: 'kg',
    qualityGrade: 'A',
    sellingPrice: 3.20,
    pricePerUnit: 3.20,
    totalRevenue: 39680,
    photos: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300'],
    notes: 'Second harvest, slightly smaller yield',
    weather: 'Sunny, 26°C',
    createdBy: 'user-1',
    createdAt: new Date('2024-09-01T10:15:00'),
  },
];

const mockCropRotations: CropRotation[] = [
  {
    id: 'rotation-1',
    fieldId: 'field-1',
    year: 2024,
    season: 'Spring-Summer',
    crop: 'Tomatoes',
    plantingDate: new Date('2024-04-15'),
    harvestDate: new Date('2024-08-15'),
    yield: 15600,
    notes: 'First rotation in this field',
  },
  {
    id: 'rotation-2',
    fieldId: 'field-2',
    year: 2024,
    season: 'Winter-Spring',
    crop: 'Wheat',
    plantingDate: new Date('2024-03-01'),
    harvestDate: new Date('2024-07-20'),
    yield: 25.8,
    notes: 'Good wheat season',
  },
];

class YieldService {
  async getYieldRecords(filters?: {
    fieldId?: string;
    produce?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<YieldRecord[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    let records = [...mockYieldRecords];

    if (filters) {
      if (filters.fieldId) {
        records = records.filter(r => r.fieldId === filters.fieldId);
      }
      if (filters.produce) {
        records = records.filter(r => r.produce === filters.produce);
      }
      if (filters.startDate) {
        records = records.filter(r => r.harvestDate >= filters.startDate!);
      }
      if (filters.endDate) {
        records = records.filter(r => r.harvestDate <= filters.endDate!);
      }
    }

    return records.sort((a, b) => b.harvestDate.getTime() - a.harvestDate.getTime());
  }

  async getYieldRecord(id: string): Promise<YieldRecord | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockYieldRecords.find(r => r.id === id) || null;
  }

  async createYieldRecord(data: Omit<YieldRecord, 'id' | 'createdAt' | 'createdBy'>): Promise<YieldRecord> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newRecord: YieldRecord = {
      ...data,
      id: `yield-${Date.now()}`,
      createdBy: 'user-1', // In real app, get from auth context
      createdAt: new Date(),
      totalRevenue: data.quantity * (data.pricePerUnit || 0),
    };

    mockYieldRecords.unshift(newRecord);
    return newRecord;
  }

  async updateYieldRecord(id: string, data: Partial<YieldRecord>): Promise<YieldRecord> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const index = mockYieldRecords.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error('Yield record not found');
    }

    const updatedRecord = {
      ...mockYieldRecords[index],
      ...data,
      totalRevenue: (data.quantity || mockYieldRecords[index].quantity) * 
                   (data.pricePerUnit || mockYieldRecords[index].pricePerUnit || 0),
    };

    mockYieldRecords[index] = updatedRecord;
    return updatedRecord;
  }

  async deleteYieldRecord(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const index = mockYieldRecords.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error('Yield record not found');
    }

    mockYieldRecords.splice(index, 1);
  }

  async getFields(): Promise<Field[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...mockFields];
  }

  async getProduceTypes(): Promise<ProduceType[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mockProduceTypes];
  }

  async getCropRotations(fieldId?: string): Promise<CropRotation[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (fieldId) {
      return mockCropRotations.filter(r => r.fieldId === fieldId);
    }
    return [...mockCropRotations];
  }

  async getYieldAnalytics(period?: { startDate: Date; endDate: Date }): Promise<YieldAnalytics> {
    await new Promise(resolve => setTimeout(resolve, 1200));

    let records = [...mockYieldRecords];
    
    if (period) {
      records = records.filter(r => 
        r.harvestDate >= period.startDate && r.harvestDate <= period.endDate
      );
    }

    const totalYield = records.reduce((sum, r) => sum + r.quantity, 0);
    const totalRevenue = records.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
    const totalArea = mockFields.reduce((sum, f) => sum + f.area, 0);

    // Group by field for top performing fields
    const fieldPerformance = mockFields.map(field => {
      const fieldRecords = records.filter(r => r.fieldId === field.id);
      const fieldYield = fieldRecords.reduce((sum, r) => sum + r.quantity, 0);
      const fieldRevenue = fieldRecords.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
      
      return {
        fieldName: field.name,
        yield: fieldYield,
        revenue: fieldRevenue,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Monthly trends (last 12 months)
    const monthlyTrends = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthRecords = records.filter(r => 
        r.harvestDate.getMonth() === date.getMonth() &&
        r.harvestDate.getFullYear() === date.getFullYear()
      );
      
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        yield: monthRecords.reduce((sum, r) => sum + r.quantity, 0),
        revenue: monthRecords.reduce((sum, r) => sum + (r.totalRevenue || 0), 0),
      };
    }).reverse();

    // Produce breakdown
    const produceMap = new Map<string, { quantity: number; revenue: number }>();
    records.forEach(r => {
      const existing = produceMap.get(r.produce) || { quantity: 0, revenue: 0 };
      produceMap.set(r.produce, {
        quantity: existing.quantity + r.quantity,
        revenue: existing.revenue + (r.totalRevenue || 0),
      });
    });

    const produceBreakdown = Array.from(produceMap.entries()).map(([produce, data]) => ({
      produce,
      quantity: data.quantity,
      revenue: data.revenue,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    })).sort((a, b) => b.revenue - a.revenue);

    return {
      totalYield,
      totalRevenue,
      averagePrice: totalYield > 0 ? totalRevenue / totalYield : 0,
      yieldPerHectare: totalArea > 0 ? totalYield / totalArea : 0,
      topPerformingFields: fieldPerformance.slice(0, 5),
      monthlyTrends,
      produceBreakdown,
    };
  }

  async uploadYieldPhoto(file: File): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    // In real app, upload to cloud storage
    return `https://images.unsplash.com/photo-${Date.now()}?w=300`;
  }

  async getQualityGrades(): Promise<QualityGrade[]> {
    return ['A+', 'A', 'B+', 'B', 'C', 'Rejected'];
  }
}

export const yieldService = new YieldService();
