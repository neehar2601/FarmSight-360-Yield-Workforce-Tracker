import Layout from '@/components/Common/Layout';

const FertilisersPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Fertiliser Management</h1>
          <button className="btn-primary">Add Fertiliser</button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Fertiliser management functionality will be implemented here.</p>
          <p className="text-sm text-gray-500 mt-2">Features include: Fertiliser inventory, application tracking, cost analysis, recommendations</p>
        </div>
      </div>
    </Layout>
  );
};

export default FertilisersPage;
