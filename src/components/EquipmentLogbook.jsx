import React, { useState } from 'react';
import { Book, Plus, ChevronDown, ChevronUp, Wrench, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';

export default function EquipmentLogbook({ 
  equipment,
  equipmentLogs,
  setEquipmentLogs,
  currentUser,
  addAuditEntry,
  showESignature,
  language = 'en'
}) {
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);
  const [showNewLog, setShowNewLog] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const createLog = (formData) => {
    showESignature(
      'Equipment Log Entry',
      `${formData.get('type')} for ${equipment.find(e => e.id === parseInt(formData.get('equipmentId')))?.name}`,
      (signature) => {
        const newLog = {
          id: `LOG-${Date.now()}`,
          equipmentId: parseInt(formData.get('equipmentId')),
          equipmentName: equipment.find(e => e.id === parseInt(formData.get('equipmentId')))?.name,
          type: formData.get('type'),
          title: formData.get('title'),
          description: formData.get('description'),
          performedBy: signature.signedBy,
          timestamp: signature.timestamp,
          signature: signature,
          nextDueDate: formData.get('nextDue') || null,
          attachments: [],
          parameters: formData.get('parameters') ? JSON.parse(formData.get('parameters')) : {},
          status: formData.get('type') === 'maintenance' ? 'completed' : 'logged'
        };

        setEquipmentLogs(prev => [...prev, newLog]);
        addAuditEntry("Equipment Log Created", `${newLog.type}: ${newLog.title} for ${newLog.equipmentName}`);
        setShowNewLog(false);

        // Update equipment calibration/maintenance dates if applicable
        if (formData.get('type') === 'calibration' && formData.get('nextDue')) {
          // This would update equipment calibrationDue in real implementation
        }
        if (formData.get('type') === 'maintenance' && formData.get('nextDue')) {
          // This would update equipment lastMaintenance in real implementation
        }
      }
    );
  };

  const selectedEq = selectedEquipment ? equipment.find(e => e.id === selectedEquipment) : null;
  const filteredLogs = equipmentLogs.filter(log => {
    if (selectedEquipment && log.equipmentId !== selectedEquipment) return false;
    if (filterType !== 'all' && log.type !== filterType) return false;
    return true;
  });

  // Calculate equipment health status
  const getEquipmentHealth = (eq) => {
    const logs = equipmentLogs.filter(l => l.equipmentId === eq.id);
    const recentIssues = logs.filter(l => 
      l.type === 'issue' && 
      new Date(l.timestamp) > new Date(Date.now() - 30*24*60*60*1000)
    ).length;

    const calDue = new Date(eq.calibrationDue);
    const today = new Date();
    const daysUntilCal = Math.floor((calDue - today) / (1000*60*60*24));

    if (eq.status !== 'operational' || recentIssues > 2 || daysUntilCal < 0) return 'critical';
    if (recentIssues > 0 || daysUntilCal < 30) return 'warning';
    return 'good';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <Book className="w-6 h-6 mr-2" />
          Equipment Logbook
        </h2>
        <button 
          onClick={() => setShowNewLog(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Log Entry</span>
        </button>
      </div>

      {/* Equipment Health Overview */}
      <div className="grid grid-cols-4 gap-4">
        {equipment.map(eq => {
          const health = getEquipmentHealth(eq);
          return (
            <div 
              key={eq.id}
              onClick={() => setSelectedEquipment(selectedEquipment === eq.id ? null : eq.id)}
              className={`glass-card cursor-pointer transition-all ${
                selectedEquipment === eq.id ? 'ring-2 ring-teal-600 shadow-glow-teal' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{eq.name}</p>
                  <p className="text-xs text-gray-600">{eq.class}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  health === 'good' ? 'bg-green-500' :
                  health === 'warning' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-semibold ${
                    eq.status === 'operational' ? 'text-green-700' : 'text-yellow-700'
                  }`}>{eq.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cal Due:</span>
                  <span className="font-mono text-xs">{new Date(eq.calibrationDue).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showNewLog && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">New Log Entry</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            createLog(new FormData(e.target));
          }}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Equipment</label>
                <select name="equipmentId" className="border rounded px-3 py-2 w-full" required>
                  <option value="">Select Equipment</option>
                  {equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name} - {eq.class}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Type</label>
                <select name="type" className="border rounded px-3 py-2 w-full" required>
                  <option value="maintenance">Maintenance</option>
                  <option value="calibration">Calibration</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="issue">Issue/Problem</option>
                  <option value="usage">Usage Log</option>
                  <option value="inspection">Inspection</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input
                  name="title"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Brief description"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea
                  name="description"
                  required
                  rows="3"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Detailed description of the activity..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Next Due Date (optional)</label>
                <input
                  name="nextDue"
                  type="date"
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">Create Log Entry</button>
              <button 
                type="button" 
                onClick={() => setShowNewLog(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-semibold">Filter by Type:</label>
            <select 
              className="border rounded px-3 py-1 text-sm"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="maintenance">Maintenance</option>
              <option value="calibration">Calibration</option>
              <option value="cleaning">Cleaning</option>
              <option value="issue">Issues</option>
              <option value="usage">Usage</option>
              <option value="inspection">Inspection</option>
            </select>
          </div>
          {selectedEq && (
            <div className="flex items-center space-x-2">
              <span className="text-sm">Selected:</span>
              <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-semibold">
                {selectedEq.name}
              </span>
              <button 
                onClick={() => setSelectedEquipment(null)}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Log Entries Table */}
        <table className="w-full text-sm">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs">Date/Time</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Equipment</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Type</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Title</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Performed By</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No log entries found. Create your first entry above.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => (
                <React.Fragment key={log.id}>
                  <tr className={`border-b hover:bg-white/40 ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                    <td className="py-2 px-2 text-xs font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-xs font-semibold">{log.equipmentName}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        log.type === 'maintenance' ? 'bg-blue-100 text-blue-800' :
                        log.type === 'calibration' ? 'bg-purple-100 text-purple-800' :
                        log.type === 'cleaning' ? 'bg-green-100 text-green-800' :
                        log.type === 'issue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-xs">{log.title}</td>
                    <td className="py-2 px-2 text-xs">{log.performedBy}</td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {expandedLog === log.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </td>
                  </tr>

                  {expandedLog === log.id && (
                    <tr>
                      <td colSpan="6" className="py-4 px-4 bg-white/60">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-semibold mb-1">Description:</p>
                            <p className="text-sm text-gray-700">{log.description}</p>
                          </div>
                          {log.nextDueDate && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Calendar className="w-4 h-4 text-gray-600" />
                              <span className="font-semibold">Next Due:</span>
                              <span>{new Date(log.nextDueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <p><span className="font-semibold">Signed by:</span> {log.signature.signedBy} ({log.signature.role})</p>
                            <p><span className="font-semibold">Timestamp:</span> {new Date(log.signature.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
