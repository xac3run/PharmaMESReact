import React from 'react';

export default function Dashboard({ batches, formulas, workflows, auditTrail }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card">
          <div className="text-3xl font-bold text-blue-600">{batches.length}</div>
          <div className="text-gray-600 text-sm">Total Batches</div>
        </div>
        <div className="glass-card">
          <div className="text-3xl font-bold text-green-600">
            {batches.filter(b => b.status === "in_progress").length}
          </div>
          <div className="text-gray-600 text-sm">Active Batches</div>
        </div>
        <div className="glass-card">
          <div className="text-3xl font-bold text-purple-600">{formulas.length}</div>
          <div className="text-gray-600 text-sm">Formulas</div>
        </div>
        <div className="glass-card">
          <div className="text-3xl font-bold text-orange-600">{workflows.length}</div>
          <div className="text-gray-600 text-sm">Workflows</div>
        </div>
      </div>
      
      <div className="glass-card">
        <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {auditTrail.slice(-5).reverse().map(entry => (
            <div key={entry.id} className="flex justify-between text-sm p-2 bg-white/40 rounded">
              <span>{entry.action}: {entry.details}</span>
              <span className="text-gray-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}