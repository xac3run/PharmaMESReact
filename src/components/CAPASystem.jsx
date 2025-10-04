import React, { useState } from 'react';
import { AlertTriangle, Plus, ChevronDown, ChevronUp, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';

export default function CAPASystem({ 
  capas,
  setCapas,
  currentUser,
  addAuditEntry,
  showESignature,
  language = 'en'
}) {
  const [expandedCapa, setExpandedCapa] = useState(null);
  const [showNewCapa, setShowNewCapa] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const createCapa = (formData) => {
    const newCapa = {
      id: `CAPA-${Date.now()}`,
      title: formData.get('title'),
      description: formData.get('description'),
      type: formData.get('type'), // 'corrective' or 'preventive'
      category: formData.get('category'),
      severity: formData.get('severity'),
      source: formData.get('source'),
      initiator: currentUser.name,
      initiatedDate: new Date().toISOString(),
      status: 'initiated',
      targetCloseDate: formData.get('targetClose'),
      workflow: [
        { step: 'Initiation', status: 'completed', completedBy: currentUser.name, date: new Date().toISOString(), notes: '' },
        { step: 'Investigation', status: 'pending', completedBy: null, date: null, notes: '' },
        { step: 'Root Cause Analysis', status: 'pending', completedBy: null, date: null, notes: '' },
        { step: 'Action Plan', status: 'pending', completedBy: null, date: null, notes: '' },
        { step: 'Implementation', status: 'pending', completedBy: null, date: null, notes: '' },
        { step: 'Effectiveness Check', status: 'pending', completedBy: null, date: null, notes: '' },
        { step: 'Closure', status: 'pending', completedBy: null, date: null, notes: '' }
      ],
      rootCause: null,
      actionPlan: [],
      effectivenessCheck: null,
      relatedDeviations: [],
      relatedBatches: []
    };

    setCapas(prev => [...prev, newCapa]);
    addAuditEntry("CAPA Created", `${newCapa.id}: ${newCapa.title}`);
    setShowNewCapa(false);
  };

  const updateCapaStep = (capaId, step) => {
    const capa = capas.find(c => c.id === capaId);
    const stepIndex = capa.workflow.findIndex(w => w.step === step);
    
    const notes = prompt(`Enter notes for ${step}:`);
    if (!notes) return;

    showESignature(
      'CAPA Step Completion',
      `${capaId} - ${step}`,
      (signature) => {
        setCapas(prev => prev.map(c => {
          if (c.id === capaId) {
            const updatedWorkflow = [...c.workflow];
            updatedWorkflow[stepIndex] = {
              ...updatedWorkflow[stepIndex],
              status: 'completed',
              completedBy: signature.signedBy,
              date: signature.timestamp,
              notes: notes,
              signature: signature
            };

            // Activate next step
            if (stepIndex < updatedWorkflow.length - 1) {
              updatedWorkflow[stepIndex + 1].status = 'active';
            }

            let newStatus = c.status;
            if (step === 'Investigation') newStatus = 'investigating';
            if (step === 'Root Cause Analysis') newStatus = 'rca_complete';
            if (step === 'Action Plan') newStatus = 'action_planned';
            if (step === 'Implementation') newStatus = 'implemented';
            if (step === 'Effectiveness Check') newStatus = 'effectiveness_verified';
            if (step === 'Closure') newStatus = 'closed';

            return {
              ...c,
              workflow: updatedWorkflow,
              status: newStatus
            };
          }
          return c;
        }));

        addAuditEntry("CAPA Updated", `${capaId} - ${step} completed by ${signature.signedBy}`);
      }
    );
  };

  const addAction = (capaId) => {
    const action = prompt("Enter corrective/preventive action:");
    const responsible = prompt("Responsible person:");
    const dueDate = prompt("Due date (YYYY-MM-DD):");
    
    if (action && responsible && dueDate) {
      setCapas(prev => prev.map(c => {
        if (c.id === capaId) {
          return {
            ...c,
            actionPlan: [...c.actionPlan, {
              id: Date.now(),
              action: action,
              responsible: responsible,
              dueDate: dueDate,
              status: 'pending',
              completedDate: null
            }]
          };
        }
        return c;
      }));
      addAuditEntry("CAPA Action Added", `${capaId} - Action: ${action}`);
    }
  };

  const toggleActionStatus = (capaId, actionId) => {
    setCapas(prev => prev.map(c => {
      if (c.id === capaId) {
        return {
          ...c,
          actionPlan: c.actionPlan.map(a => {
            if (a.id === actionId) {
              return {
                ...a,
                status: a.status === 'pending' ? 'completed' : 'pending',
                completedDate: a.status === 'pending' ? new Date().toISOString() : null
              };
            }
            return a;
          })
        };
      }
      return c;
    }));
  };

  const filteredCapas = capas.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterType !== 'all' && c.type !== filterType) return false;
    return true;
  });

  // Statistics
  const stats = {
    total: capas.length,
    open: capas.filter(c => c.status !== 'closed').length,
    overdue: capas.filter(c => c.targetCloseDate && new Date(c.targetCloseDate) < new Date() && c.status !== 'closed').length,
    corrective: capas.filter(c => c.type === 'corrective').length,
    preventive: capas.filter(c => c.type === 'preventive').length
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <TrendingUp className="w-6 h-6 mr-2" />
          CAPA Management System
        </h2>
        <button 
          onClick={() => setShowNewCapa(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New CAPA</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-5 gap-4">
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-teal-700">{stats.total}</div>
          <div className="text-sm text-gray-600">Total CAPAs</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.open}</div>
          <div className="text-sm text-gray-600">Open</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.corrective}</div>
          <div className="text-sm text-gray-600">Corrective</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-green-600">{stats.preventive}</div>
          <div className="text-sm text-gray-600">Preventive</div>
        </div>
      </div>

      {showNewCapa && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Initiate New CAPA</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            createCapa(new FormData(e.target));
          }}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input
                  name="title"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Brief description of the issue"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea
                  name="description"
                  required
                  rows="3"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Detailed description of the problem or opportunity for improvement"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Type</label>
                <select name="type" className="border rounded px-3 py-2 w-full" required>
                  <option value="corrective">Corrective Action</option>
                  <option value="preventive">Preventive Action</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Category</label>
                <select name="category" className="border rounded px-3 py-2 w-full" required>
                  <option value="quality">Quality Issue</option>
                  <option value="process">Process Deviation</option>
                  <option value="equipment">Equipment Problem</option>
                  <option value="documentation">Documentation</option>
                  <option value="personnel">Personnel/Training</option>
                  <option value="supplier">Supplier Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Severity</label>
                <select name="severity" className="border rounded px-3 py-2 w-full" required>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Source</label>
                <select name="source" className="border rounded px-3 py-2 w-full" required>
                  <option value="deviation">Deviation</option>
                  <option value="audit">Audit Finding</option>
                  <option value="complaint">Customer Complaint</option>
                  <option value="inspection">Inspection</option>
                  <option value="improvement">Continuous Improvement</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Target Close Date</label>
                <input
                  name="targetClose"
                  type="date"
                  className="border rounded px-3 py-2 w-full"
                  required
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">Create CAPA</button>
              <button 
                type="button" 
                onClick={() => setShowNewCapa(false)}
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
            <label className="text-sm font-semibold">Status:</label>
            <select 
              className="border rounded px-3 py-1 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="initiated">Initiated</option>
              <option value="investigating">Investigating</option>
              <option value="rca_complete">RCA Complete</option>
              <option value="action_planned">Action Planned</option>
              <option value="implemented">Implemented</option>
              <option value="effectiveness_verified">Effectiveness Verified</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-semibold">Type:</label>
            <select 
              className="border rounded px-3 py-1 text-sm"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="corrective">Corrective</option>
              <option value="preventive">Preventive</option>
            </select>
          </div>
        </div>

        {/* CAPA List */}
        <table className="w-full text-sm">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs">CAPA ID</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Title</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Type</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Severity</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Status</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Target Close</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredCapas.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  No CAPAs found. Create your first CAPA above.
                </td>
              </tr>
            ) : (
              filteredCapas.map((capa, idx) => {
                const isOverdue = capa.targetCloseDate && new Date(capa.targetCloseDate) < new Date() && capa.status !== 'closed';
                return (
                  <React.Fragment key={capa.id}>
                    <tr className={`border-b hover:bg-white/40 ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                      <td className="py-2 px-2 font-mono text-xs">{capa.id}</td>
                      <td className="py-2 px-2 text-xs">{capa.title}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          capa.type === 'corrective' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {capa.type}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          capa.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          capa.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          capa.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {capa.severity}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          capa.status === 'closed' ? 'bg-green-100 text-green-800' :
                          capa.status === 'implemented' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {capa.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-xs">
                        <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
                          {new Date(capa.targetCloseDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <button
                          onClick={() => setExpandedCapa(expandedCapa === capa.id ? null : capa.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {expandedCapa === capa.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>
                    </tr>

                    {expandedCapa === capa.id && (
                      <tr>
                        <td colSpan="7" className="py-4 px-4 bg-white/60">
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold mb-1">Description:</p>
                              <p className="text-sm text-gray-700">{capa.description}</p>
                            </div>

                            <div>
                              <p className="text-sm font-semibold mb-2">Workflow Progress:</p>
                              <div className="space-y-2">
                                {capa.workflow.map((step, idx) => (
                                  <div key={idx} className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      step.status === 'completed' ? 'bg-green-500' :
                                      step.status === 'active' ? 'bg-blue-500' :
                                      'bg-gray-300'
                                    }`}>
                                      {step.status === 'completed' ? (
                                        <CheckCircle className="w-4 h-4 text-white" />
                                      ) : step.status === 'active' ? (
                                        <Clock className="w-4 h-4 text-white" />
                                      ) : (
                                        <span className="text-white text-xs">{idx + 1}</span>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold">{step.step}</p>
                                      {step.completedBy && (
                                        <p className="text-xs text-gray-600">
                                          By: {step.completedBy} on {new Date(step.date).toLocaleString()}
                                        </p>
                                      )}
                                      {step.notes && (
                                        <p className="text-xs text-gray-700 mt-1">{step.notes}</p>
                                      )}
                                    </div>
                                    {step.status === 'active' && (
                                      <button
                                        onClick={() => updateCapaStep(capa.id, step.step)}
                                        className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                      >
                                        Complete
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-semibold">Action Plan:</p>
                                {capa.status !== 'closed' && (
                                  <button
                                    onClick={() => addAction(capa.id)}
                                    className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                                  >
                                    + Add Action
                                  </button>
                                )}
                              </div>
                              {capa.actionPlan.length > 0 ? (
                                <div className="space-y-2">
                                  {capa.actionPlan.map((action) => (
                                    <div key={action.id} className="flex items-start space-x-2 bg-gray-50 p-2 rounded">
                                      <input
                                        type="checkbox"
                                        checked={action.status === 'completed'}
                                        onChange={() => toggleActionStatus(capa.id, action.id)}
                                        className="mt-1"
                                      />
                                      <div className="flex-1 text-xs">
                                        <p className={action.status === 'completed' ? 'line-through text-gray-500' : ''}>
                                          {action.action}
                                        </p>
                                        <p className="text-gray-600 mt-1">
                                          Responsible: {action.responsible} | Due: {new Date(action.dueDate).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500">No actions defined yet</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
