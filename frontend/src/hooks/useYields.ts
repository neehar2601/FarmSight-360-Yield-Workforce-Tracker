import { useState, useEffect, useCallback } from 'react';
import { YieldRecord, Field, ProduceType, YieldAnalytics, QualityGrade } from '@/models';
import { yieldService } from '@/services';

export const useYields = (filters?: {
  fieldId?: string;
  produce?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  const [yields, setYields] = useState<YieldRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchYields = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await yieldService.getYieldRecords(filters);
      setYields(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch yields');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchYields();
  }, [fetchYields]);

  const createYield = useCallback(async (data: Omit<YieldRecord, 'id' | 'createdAt' | 'createdBy'>) => {
    try {
      const newYield = await yieldService.createYieldRecord(data);
      setYields(prev => [newYield, ...prev]);
      return newYield;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateYield = useCallback(async (id: string, data: Partial<YieldRecord>) => {
    try {
      const updatedYield = await yieldService.updateYieldRecord(id, data);
      setYields(prev => prev.map(y => y.id === id ? updatedYield : y));
      return updatedYield;
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteYield = useCallback(async (id: string) => {
    try {
      await yieldService.deleteYieldRecord(id);
      setYields(prev => prev.filter(y => y.id !== id));
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    yields,
    loading,
    error,
    refetch: fetchYields,
    createYield,
    updateYield,
    deleteYield,
  };
};

export const useYieldAnalytics = (period?: { startDate: Date; endDate: Date }) => {
  const [analytics, setAnalytics] = useState<YieldAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await yieldService.getYieldAnalytics(period);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
};

export const useFields = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await yieldService.getFields();
        setFields(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch fields');
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, []);

  return { fields, loading, error };
};

export const useProduceTypes = () => {
  const [produceTypes, setProduceTypes] = useState<ProduceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduceTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await yieldService.getProduceTypes();
        setProduceTypes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch produce types');
      } finally {
        setLoading(false);
      }
    };

    fetchProduceTypes();
  }, []);

  return { produceTypes, loading, error };
};

export const useQualityGrades = () => {
  const [qualityGrades, setQualityGrades] = useState<QualityGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQualityGrades = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await yieldService.getQualityGrades();
        setQualityGrades(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch quality grades');
      } finally {
        setLoading(false);
      }
    };

    fetchQualityGrades();
  }, []);

  return { qualityGrades, loading, error };
};
