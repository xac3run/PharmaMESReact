import React, { useState } from 'react';
import { Plus, FileText, ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function ChangeControl({ 
  changes,
  setChanges,
  formulas,
  workflows,
  currentUser,
  addAuditEntry,
  showESignature,
  language = 'en'
}) {
  const [expandedChange, setExpandedChange] = useState(null);
  const [showNewChange, setShowNewChange] = useState(false);

  const createChange = (formData) => {
    const newChange = {
      id: `CHG-${Date.now()}`,
      title: formData.get('title'),
      description: formData.get('description'),
      type: formData.get('type'),
      priority: formData.get('priority'),
      affectedItems: formData.get('affectedItems')?.split(',').map(s => s.trim()) || [],
      initiator: currentUser.name,
      initiatedDate: new Date().toISOString(),
      status: 'initiated',
      workflow: [
        { step: 'Initiation', status: 'completed', completedBy: currentUser.name, date: new Date().toISOString() },
        { step: 'Impact Assessment', status: 'pending', completedBy: null, date: null },
        { step: 'Approval', status: 'pending', completedBy: null, date: null },
        { step: 'Implementation', status: 'pending', completedBy: null, date: null },
        { step: 'Verification', status: 'pending', completedBy: null, date: null },
        { step: 'Closure', status: 'pending', completedBy: null, date: null }
      ],
      impactAssessment: null,
      approvals: [],
      implementationNotes: null,
      verificationNotes: null
    };

    setChanges(prev => [...prev, newChange]);
    addAuditEntry("Change Control Created", `${newChange.id}: ${newChange.title}`);
    setShowNewChange(false);
  };

  const updateChangeStatus = (changeId, step, notes) => {
    showESignature(
      'Change Control Step Completion',
      `Complete step: ${step}`,
      (signature) => {
        setChanges(prev => prev.map(c => {
          if (c.id === changeId) {
            const workflowIndex = c.workflow.findIndex(w => w.step === step);
            const updatedWorkflow = [...c.workflow];
            updatedWorkflow[workflowIndex] = {
              ...updatedWorkflow[workflowIndex],
              status: 'completed',
              completedBy: signature.signedBy,
              date: signature.timestamp,
              signature: signature
            };

            // Activate next step
            if (workflowIndex < updatedWorkflow.length - 1) {
              updatedWorkflow[workflowIndex + 1].status = 'active';
            }

            let newStatus = c.status;
            if (step === 'Impact Assessment') newStatus = 'assessed';
            if (step === 'Approval') newStatus = 'approved';
            if (step === 'Implementation') newStatus = 'implemented';
            if (step === 'Verification') newStatus = 'verified';
            if (step === 'Closure') newStatus = 'closed';

            return {
              ...c,
              workflow: updatedWorkflow,
              status: newStatus,
              [step === 'Impact Assessment' ? 'impactAssessment' : 
               step === 'Implementation' ? 'implementationNotes' :
               step === 'Verification' ? 'verificationNotes' : null]: notes
            };
          }
          return c;
        }));

        addAuditEntry("Change Control Updated", `${changeId} - ${step} completed by ${signature.signedBy}`);
      }
    );
  };

  const addApproval = (changeId) => {
    showESignature(
      'Approve Change',
      `Approval for change ${changeId}`,
      (signature) => {
        setChanges(prev => prev.map(c => {
          if (c.id === changeId) {
            return {
              ...c,
              approvals: [...c.approvals, signature]
            };
          }
          return c;
        }));
        addAuditEntry("Change Approved", `${changeId} approved by ${signature.signedBy}`);
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Change Control Management</h2>
        <button 
          onClick={() => setShowNewChange(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Change</span>
        </button>
      </div>

      {showNewChange && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Initiate Change Control</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            createChange(new FormData(e.target));
          }}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input
                  name="title"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Brief description of change"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea
                  name="description"
                  required
                  rows="3"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Detailed description of the change"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Type</label>
                <select name="type" className="border rounded px-3 py-2 w-full" required>
                  <option value="MBR">MBR Change</option>
                  <option value="Equipment">Equipment Change</option>
                  <option value="Process">Process Change</option>
                  <option value="Material">Material Change</option>
                  <option value="System">System Change</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Priority</label>
                <select name="priority" className="border rounded px-3 py-2 w-full" required>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Affected Items (comma separated)</label>
                <input
                  name="affectedItems"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="e.g., MBR-001, Equipment-Mixer-01"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">Create Change</button>
              <button 
                type="button" 
                onClick={() => setShowNewChange(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card">
        <table className="w-full text-sm">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs">Change ID</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Title</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Type</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Priority</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Status</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Initiator</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Details</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((change, idx) => (
              <React.Fragment key={change.id}>
                <tr className={`border-b hover:bg-white/40 ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                  <td className="py-2 px-2 font-mono text-xs">{change.id}</td>
                  <td className="py-2 px-2 text-xs">{change.title}</td>
                  <td className="py-2 px-2 text-xs">{change.type}</td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      change.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                      change.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                      change.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {change.priority}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      change.status === 'closed' ? 'bg-green-100 text-green-800' :
                      change.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {change.status}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-xs">{change.initiator}</td>
                  <td className="py-2 px-2">
                    <button
                      onClick={() => setExpandedChange(expandedChange === change.id ? null : change.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {expandedChange === change.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </td>
                </tr>

                {expandedChange === change.id && (
                  <tr>
                    <td colSpan="7" className="py-4 px-4 bg-white/60">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold mb-1">Description:</p>
                          <p className="text-sm text-gray-700">{change.description}</p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold mb-2">Workflow Progress:</p>
                          <div className="space-y-2">
                            {change.workflow.map((step, idx) => (
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
                                </div>
                                {step.status === 'active' && (
                                  <button
                                    onClick={() => {
                                      const notes = prompt(`Enter notes for ${step.step}:`);
                                      if (notes) updateChangeStatus(change.id, step.step, notes);
                                    }}
                                    className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                  >
                                    Complete
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {change.affectedItems.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-1">Affected Items:</p>
                            <div className="flex flex-wrap gap-1">
                              {change.affectedItems.map((item, idx) => (
                                <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {change.approvals.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-2">Approvals:</p>
                            {change.approvals.map((sig, idx) => (
                              <div key={idx} className="text-xs bg-green-50 p-2 rounded mb-1">
                                <span className="font-semibold">{sig.signedBy}</span> ({sig.role}) - {new Date(sig.timestamp).toLocaleString()}
                              </div>
                            ))}
                          </div>
                        )}

                        {change.status === 'assessed' && change.approvals.length === 0 && (
                          <button
                            onClick={() => addApproval(change.id)}
                            className="btn-primary text-sm"
                          >
                            Add Approval
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
