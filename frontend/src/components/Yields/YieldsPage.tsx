import { useState, useEffect } from 'react';
import Layout from '@/components/Common/Layout';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import { useYields, useFields, useProduceTypes } from '@/hooks/useYields';
import { YieldRecord } from '@/models';

const YieldsPage = () => {
  const [filters, setFilters] = useState({
    fieldId: '',
    produce: '',
    startDate: '',
    endDate: '',
  });

  const { yields, loading, error } = useYields();
  const { fields } = useFields();
  const { produceTypes } = useProduceTypes();

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="large" message="Loading yields..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Yield Tracking</h1>
          <button className="btn-primary">
            Add New Yield
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field
              </label>
              <select
                className="input-field"
                value={filters.fieldId}
                onChange={(e) => handleFilterChange('fieldId', e.target.value)}
              >
                <option value="">All Fields</option>
                {fields.map(field => (
                  <option key={field.id} value={field.id}>
                    {field.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Produce
              </label>
              <select
                className="input-field"
                value={filters.produce}
                onChange={(e) => handleFilterChange('produce', e.target.value)}
              >
                <option value="">All Produce</option>
                {produceTypes.map(produce => (
                  <option key={produce.id} value={produce.name}>
                    {produce.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="input-field"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                className="input-field"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Yields Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Yields</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Field</th>
                  <th className="table-header">Produce</th>
                  <th className="table-header">Quantity</th>
                  <th className="table-header">Quality</th>
                  <th className="table-header">Revenue</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {yields.map((yield_: YieldRecord) => (
                  <tr key={yield_.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      {new Date(yield_.harvestDate).toLocaleDateString()}
                    </td>
                    <td className="table-cell">{yield_.fieldName}</td>
                    <td className="table-cell">{yield_.produce}</td>
                    <td className="table-cell">
                      {yield_.quantity.toLocaleString()} {yield_.unit}
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        yield_.qualityGrade === 'A+' ? 'bg-green-100 text-green-800' :
                        yield_.qualityGrade === 'A' ? 'bg-blue-100 text-blue-800' :
                        yield_.qualityGrade === 'B+' ? 'bg-yellow-100 text-yellow-800' :
                        yield_.qualityGrade === 'B' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {yield_.qualityGrade}
                      </span>
                    </td>
                    <td className="table-cell">
                      ${yield_.totalRevenue?.toLocaleString() || 0}
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button className="text-primary-600 hover:text-primary-900 text-sm">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900 text-sm">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {yields.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No yield records found.</p>
              <button className="mt-4 btn-primary">
                Add Your First Yield
              </button>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Yield</h3>
            <p className="text-3xl font-bold text-primary-600">
              {yields.reduce((sum, y) => sum + y.quantity, 0).toLocaleString()} kg
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-green-600">
              ${yields.reduce((sum, y) => sum + (y.totalRevenue || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Price</h3>
            <p className="text-3xl font-bold text-blue-600">
              ${yields.length > 0 ? 
                (yields.reduce((sum, y) => sum + (y.pricePerUnit || 0), 0) / yields.length).toFixed(2) :
                '0.00'
              }
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default YieldsPage;
