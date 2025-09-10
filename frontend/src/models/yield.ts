export interface YieldRecord {
  id: string;
  farmId: string;
  fieldId: string;
  fieldName: string;
  produce: string;
  harvestDate: Date;
  quantity: number;
  unit: string;
  qualityGrade: QualityGrade;
  sellingPrice?: number;
  pricePerUnit?: number;
  totalRevenue?: number;
  photos?: string[];
  notes?: string;
  weather?: string;
  createdBy: string;
  createdAt: Date;
}

export type QualityGrade = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'Rejected';

export interface ProduceType {
  id: string;
  name: string;
  category: string;
  unit: string;
  averageYieldPerHectare?: number;
  seasonalPattern?: string[];
}

export interface Field {
  id: string;
  name: string;
  area: number;
  areaUnit: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  soilType?: string;
  currentCrop?: string;
  plantingDate?: Date;
  expectedHarvestDate?: Date;
  isActive: boolean;
}

export interface CropRotation {
  id: string;
  fieldId: string;
  year: number;
  season: string;
  crop: string;
  plantingDate: Date;
  harvestDate?: Date;
  yield?: number;
  notes?: string;
}

export interface YieldAnalytics {
  totalYield: number;
  totalRevenue: number;
  averagePrice: number;
  yieldPerHectare: number;
  topPerformingFields: Array<{
    fieldName: string;
    yield: number;
    revenue: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    yield: number;
    revenue: number;
  }>;
  produceBreakdown: Array<{
    produce: string;
    quantity: number;
    revenue: number;
    percentage: number;
  }>;
}
