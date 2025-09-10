import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Common/Layout';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import { 
  yieldService, 
  workerService, 
  financialService, 
  weatherService 
} from '@/services';

// Dashboard widgets
const StatsCard = ({ title, value, subtitle, icon, trend }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="text-primary-600">{icon}</div>
    </div>
    {trend && (
      <div className="mt-4">
        <span className={`inline-flex items-center text-sm ${
          trend.isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
        </span>
        <span className="text-gray-500 text-sm ml-2">vs last month</span>
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalYield: 0,
    activeWorkers: 0,
    weatherTemp: 0,
    recentYields: [] as any[],
    weatherCondition: '',
    monthlyRevenue: [] as any[],
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all dashboard data in parallel
        const [
          yieldAnalytics,
          workerAnalytics,
          financialAnalytics,
          weatherData,
          recentYields
        ] = await Promise.all([
          yieldService.getYieldAnalytics(),
          workerService.getWorkerAnalytics(),
          financialService.getFinancialAnalytics(),
          weatherService.getCurrentWeather(),
          yieldService.getYieldRecords()
        ]);

        setDashboardData({
          totalRevenue: financialAnalytics.totalRevenue,
          totalYield: yieldAnalytics.totalYield,
          activeWorkers: workerAnalytics.activeWorkers,
          weatherTemp: weatherData.temperature.current,
          weatherCondition: weatherData.conditions,
          recentYields: recentYields.slice(0, 5),
          monthlyRevenue: financialAnalytics.monthlyTrends.slice(-6),
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="large" message="Loading dashboard..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening on your farm today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Revenue"
            value={`$${dashboardData.totalRevenue.toLocaleString()}`}
            icon={<div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">$</div>}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatsCard
            title="Total Yield"
            value={`${dashboardData.totalYield.toLocaleString()} kg`}
            icon={<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">🌾</div>}
            trend={{ value: 8.2, isPositive: true }}
          />
          <StatsCard
            title="Active Workers"
            value={dashboardData.activeWorkers}
            icon={<div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">👥</div>}
          />
          <StatsCard
            title="Weather"
            value={`${dashboardData.weatherTemp}°C`}
            subtitle={dashboardData.weatherCondition}
            icon={<div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">☀️</div>}
          />
        </div>

        {/* Recent Activity & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Yields */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Yields</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.recentYields.map((yield_, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{yield_.produce}</p>
                      <p className="text-sm text-gray-500">{yield_.fieldName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{yield_.quantity.toLocaleString()} kg</p>
                      <p className="text-sm text-green-600">${yield_.totalRevenue?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Revenue Chart Placeholder */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">Chart will be implemented with Recharts</p>
                  <div className="text-sm text-gray-400">
                    Last 6 months revenue: ${dashboardData.monthlyRevenue.reduce((sum, month) => sum + month.revenue, 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <p className="font-medium">Record Yield</p>
                <p className="text-sm text-gray-500">Add new harvest data</p>
              </div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <div className="text-2xl mb-2">👤</div>
                <p className="font-medium">Add Worker</p>
                <p className="text-sm text-gray-500">Register new employee</p>
              </div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <div className="text-2xl mb-2">💰</div>
                <p className="font-medium">Add Transaction</p>
                <p className="text-sm text-gray-500">Record income or expense</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
