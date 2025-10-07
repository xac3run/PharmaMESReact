import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Filter } from 'lucide-react';
import { auditApi } from '../services/auditApi';

export default function AuditTrail({ auditTrail = [], batches = [] }) {
  const [apiAuditTrail, setApiAuditTrail] = useState([]);
  const [loading, setLoading] = useState(false);
  const [useApiData, setUseApiData] = useState(true);

  useEffect(() => {
    loadApiAuditTrail();
  }, []);

  const loadApiAuditTrail = async () => {
    setLoading(true);
    try {
      const result = await auditApi.getAuditTrail({ limit: 100 });
      setApiAuditTrail(result.data || []);
      setUseApiData(true);
    } catch (error) {
      console.error('Failed to load API audit trail, using fallback data:', error);
      setUseApiData(false);
    }
    setLoading(false);
  };

  const exportAudit = () => {
    const data = useApiData ? apiAuditTrail : auditTrail;
    const content = data.map(entry => {
      const timestamp = new Date(entry.timestamp).toLocaleString();
      const user = entry.user ? 
        (typeof entry.user === 'string' ? entry.user : entry.user.username || entry.user) : 
        'System';
      const role = entry.user && typeof entry.user === 'object' ? entry.user.role : entry.role || '';
      const action = entry.actionType || entry.action;
      const details = entry.reason || entry.details || '';
      return `${timestamp} | ${user} (${role}) | ${action} | ${details}`;
    }).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_trail_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  const displayData = useApiData ? apiAuditTrail : auditTrail;

  return (
    <div className="glass-card">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Trail</h2>
          <p className="text-gray-600">
            {displayData.length} entries • 21 CFR Part 11 Compliant
            {useApiData && <span className="ml-2 text-green-600">• Live API Data</span>}
            {!useApiData && <span className="ml-2 text-yellow-600">• Local Data (API unavailable)</span>}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={loadApiAuditTrail}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={exportAudit}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading audit trail...</p>
          </div>
        ) : displayData.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No audit entries found</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Signatures
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayData.map((entry, index) => {
                  const timestamp = new Date(entry.timestamp).toLocaleString();
                  const user = entry.user ? 
                    (typeof entry.user === 'string' ? entry.user : entry.user.username || entry.user) : 
                    'System';
                  const role = entry.user && typeof entry.user === 'object' ? entry.user.role : entry.role || '';
                  const action = entry.actionType || entry.action;
                  const details = entry.reason || entry.details || '';
                  const hasSig = entry.signatures && entry.signatures.length > 0;
                  
                  return (
                    <tr key={entry.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {timestamp}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{user}</div>
                          {role && <div className="text-xs text-gray-500">{role}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          action?.includes('CREATE') ? 'bg-green-100 text-green-800' :
                          action?.includes('UPDATE') ? 'bg-blue-100 text-blue-800' :
                          action?.includes('DELETE') ? 'bg-red-100 text-red-800' :
                          action?.includes('APPROVE') ? 'bg-purple-100 text-purple-800' :
                          action?.includes('LOGIN') ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {details}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {hasSig ? (
                          <span className="text-green-600 text-xs font-medium">Signed</span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
