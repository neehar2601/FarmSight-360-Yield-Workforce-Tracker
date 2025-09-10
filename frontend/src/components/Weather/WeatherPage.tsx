import Layout from '@/components/Common/Layout';

const WeatherPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Weather Information</h1>
          <button className="btn-primary">Refresh Data</button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Weather information functionality will be implemented here.</p>
          <p className="text-sm text-gray-500 mt-2">Features include: Current weather, forecasts, historical data, farming alerts</p>
        </div>
      </div>
    </Layout>
  );
};

export default WeatherPage;
