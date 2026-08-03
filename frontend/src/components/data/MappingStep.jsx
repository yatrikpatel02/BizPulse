import React, { useState } from 'react';

const EXPECTED_FIELDS = {
  sales: [
    { key: 'product_name', label: 'Product Name / SKU', required: true },
    { key: 'quantity', label: 'Quantity Sold', required: true },
    { key: 'revenue', label: 'Total Revenue', required: true },
    { key: 'date', label: 'Transaction Date', required: true },
    { key: 'category', label: 'Category (Optional)', required: false },
    { key: 'cost', label: 'Cost / Unit Cost (Optional)', required: false },
  ],
  inventory: [
    { key: 'product_name', label: 'Product Name / SKU', required: true },
    { key: 'quantity_on_hand', label: 'Quantity on Hand / Stock Level', required: true },
    { key: 'date', label: 'Snapshot Date', required: true },
    { key: 'category', label: 'Category (Optional)', required: false },
    { key: 'reorder_point', label: 'Reorder Point / Min Stock (Optional)', required: false },
    { key: 'unit_cost', label: 'Unit Cost / Purchase Price (Optional)', required: false },
    { key: 'location', label: 'Warehouse / Location (Optional)', required: false },
    { key: 'supplier', label: 'Supplier Name (Optional)', required: false },
  ],
  reviews: [
    { key: 'date', label: 'Review Date', required: true },
    { key: 'rating', label: 'Rating / Score / Stars (1–5)', required: true },
    { key: 'text', label: 'Review Text / Comment / Feedback', required: true },
    { key: 'product_name', label: 'Product Name (Optional)', required: false },
    { key: 'author_name', label: 'Author / Reviewer Name (Optional)', required: false },
    { key: 'source', label: 'Source Platform (Optional)', required: false },
    { key: 'external_id', label: 'External ID (Optional)', required: false },
  ]
};

export default function MappingStep({ headers, suggestedMappings, sourceType, onMappingComplete, onBack }) {
  // Initialize state with suggested mappings
  const [mapping, setMapping] = useState(() => {
    const initial = {};
    headers.forEach(header => {
      const suggestion = suggestedMappings.find(m => m.original_column === header);
      if (suggestion && suggestion.mapped_column) {
        initial[header] = suggestion.mapped_column;
      } else {
        initial[header] = '';
      }
    });
    return initial;
  });

  const [error, setError] = useState(null);

  const handleSelectChange = (header, value) => {
    setMapping(prev => ({
      ...prev,
      [header]: value
    }));
  };

  const handleContinue = () => {
    // Validate required fields
    const requiredFields = EXPECTED_FIELDS[sourceType].filter(f => f.required).map(f => f.key);
    const mappedValues = Object.values(mapping).filter(v => v !== '');

    const missingFields = requiredFields.filter(f => !mappedValues.includes(f));
    
    if (missingFields.length > 0) {
      const fieldLabels = missingFields.map(m => EXPECTED_FIELDS[sourceType].find(f => f.key === m).label);
      setError(`Please map the following required fields: ${fieldLabels.join(', ')}`);
      return;
    }

    setError(null);
    onMappingComplete(mapping);
  };

  const currentExpectedFields = EXPECTED_FIELDS[sourceType] || [];

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Map Your Columns</h2>
      <p className="text-gray-600 dark:text-slate-400 mb-6">
         Match the columns from your uploaded file to the required system fields. We&apos;ve auto-matched some based on their names.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800/50">
          {error}
        </div>
      )}

      <div className="overflow-hidden border border-gray-200 dark:border-slate-700 rounded-lg mb-8">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Your File Column
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                System Field
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
            {headers.map((header, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-200">
                  {header}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                  <select
                    value={mapping[header] || ''}
                    onChange={(e) => handleSelectChange(header, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-slate-200 outline-none transition-colors"
                  >
                    <option value="">-- Do not import --</option>
                    {currentExpectedFields.map(field => (
                      <option key={field.key} value={field.key}>
                        {field.label} {field.required ? '*' : ''}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium rounded-lg shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Preview & Validate
        </button>
      </div>
    </div>
  );
}
