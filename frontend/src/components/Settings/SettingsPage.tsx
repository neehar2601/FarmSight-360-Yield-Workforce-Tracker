import Layout from '@/components/Common/Layout';

const SettingsPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Settings functionality will be implemented here.</p>
          <p className="text-sm text-gray-500 mt-2">Features include: User preferences, system configuration, notifications, security settings</p>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
