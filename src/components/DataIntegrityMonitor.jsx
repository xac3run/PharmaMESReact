import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function DataIntegrityMonitor({ auditTrail }) {
  const [filter, setFilter] = useState('all');

  // Analyze audit trail for data integrity issues
  const analyzeDataIntegrity = () => {
    const issues = [];
    
    auditTrail.forEach((entry, idx) => {
      // Check for backdating
      if (idx > 0 && new Date(entry.timestamp) < new Date(auditTrail[idx - 1].timestamp)) {
        issues.push({
          type: 'backdating',
          severity: 'high',
          entry: entry,
          message: 'Timestamp earlier than previous entry'
        });
      }

      // Check for missing user
      if (!entry.user || entry.user === 'System') {
        issues.push({
          type: 'attribution',
          severity: 'medium',
          entry: entry,
          message: 'Action not attributed to specific user'
        });
      }

      // Check for incomplete details
      if (!entry.details || entry.details.length < 10) {
        issues.push({
          type: 'completeness',
          severity: 'low',
          entry: entry,
          message: 'Insufficient details provided'
        });
      }
    });

    return issues;
  };

  const issues = analyzeDataIntegrity();
  const filteredIssues = filter === 'all' ? issues : issues.filter(i => i.severity === filter);

  const alcoapPrinciples = [
    { name: 'Attributable', description: 'All data traced to person who created it', status: issues.filter(i => i.type === 'attribution').length === 0 },
    { name: 'Legible', description: 'Data is readable and permanent', status: true },
    { name: 'Contemporaneous', description: 'Data recorded at time of activity', status: issues.filter(i => i.type === 'backdating').length === 0 },
    { name: 'Original', description: 'First recording or certified copy', status: true },
    { name: 'Accurate', description: 'Data is correct and verified', status: true },
    { name: 'Complete', description: 'All data is present', status: issues.filter(i => i.type === 'completeness').length === 0 },
    { name: 'Consistent', description: 'Data sequence is logical', status: true },
    { name: 'Enduring', description: 'Data preserved throughout retention period', status: true },
    { name: 'Available', description: 'Data accessible for review', status: true }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <Shield className="w-6 h-6 mr-2" />
          Data Integrity Monitor (ALCOA+)
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card">
          <div className="text-3xl font-bold text-green-600">{alcoapPrinciples.filter(p => p.status).length}</div>
          <div className="text-sm text-gray-600">Principles Met</div>
        </div>
        <div className="glass-card">
          <div className="text-3xl font-bold text-red-600">{issues.length}</div>
          <div className="text-sm text-gray-600">Issues Detected</div>
        </div>
        <div className="glass-card">
          <div className="text-3xl font-bold text-blue-600">{auditTrail.length}</div>
          <div className="text-sm text-gray-600">Total Entries</div>
        </div>
      </div>

      <div className="glass-card">
        <h3 className="text-lg font-semibold mb-4">ALCOA+ Compliance Status</h3>
        <div className="grid grid-cols-3 gap-3">
          {alcoapPrinciples.map(principle => (
            <div key={principle.name} className={`p-3 rounded-lg border ${
              principle.status ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center space-x-2 mb-1">
                {principle.status ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <p className="font-semibold text-sm">{principle.name}</p>
              </div>
              <p className="text-xs text-gray-600">{principle.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Detected Issues</h3>
          <select
            className="border rounded px-3 py-1 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Issues</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>
        </div>

        {filteredIssues.length > 0 ? (
          <div className="space-y-2">
            {filteredIssues.map((issue, idx) => (
              <div key={idx} className={`p-3 rounded-lg border ${
                issue.severity === 'high' ? 'bg-red-50 border-red-300' :
                issue.severity === 'medium' ? 'bg-yellow-50 border-yellow-300' :
                'bg-blue-50 border-blue-300'
              }`}>
                <div className="flex items-start space-x-2">
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    issue.severity === 'high' ? 'text-red-600' :
                    issue.severity === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{issue.message}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Action: {issue.entry.action} | User: {issue.entry.user} | 
                      Time: {new Date(issue.entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    issue.severity === 'high' ? 'bg-red-200 text-red-800' :
                    issue.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {issue.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>No data integrity issues detected</p>
          </div>
        )}
      </div>
    </div>
  );
}
