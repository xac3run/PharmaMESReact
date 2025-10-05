import React from 'react';
import { Download } from 'lucide-react';

export default function AuditTrail({ auditTrail, batches }) {
  const exportAudit = () => {
    const content = auditTrail.map(a => 
      `${new Date(a.timestamp).toLocaleString()} | ${a.user} (${a.role}) | ${a.action} | ${a.details}`
    ).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audit_trail.txt';
    link.click();
  };

  return (
    <div className="glass-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Audit Trail</h2>
        <div className="flex space-x-2">
          <select className="border rounded px-3 py-2 text-sm">
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.id}</option>
            ))}
          </select>
          <button 
            className="btn-secondary flex items-center space-x-2"
            onClick={exportAudit}
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {auditTrail.slice().reverse().map(entry => (
          <div key={entry.id} className="p-3 border-l-4 border-blue-500 bg-white/60 rounded">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-semibold text-sm">{entry.action}</p>
                <p className="text-sm text-gray-600">{entry.details}</p>
                {entry.batchId && (
                  <p className="text-xs text-blue-600 mt-1">Batch: {entry.batchId}</p>
                )}
              </div>
              <div className="text-xs text-gray-500 text-right ml-4">
                <div className="font-semibold">{entry.user}</div>
                <div className="text-gray-400">{entry.role}</div>
                <div>{new Date(entry.timestamp).toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
