import Layout from '@/components/Common/Layout';

const FinancialsPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
          <button className="btn-primary">Add Transaction</button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Financial management functionality will be implemented here.</p>
          <p className="text-sm text-gray-500 mt-2">Features include: Revenue tracking, expense management, profit analysis, financial reports</p>
        </div>
      </div>
    </Layout>
  );
};

export default FinancialsPage;
