import React, { useState } from 'react';
import { Search, Plus, ChevronDown, ChevronUp, CheckCircle, Clock, FileText, Users, AlertTriangle } from 'lucide-react';

export default function InvestigationWorkflow({
  investigations = [],
  setInvestigations,
  deviations,
  setDeviations,
  capas,
  setCapas,
  batches,
  materials,
  currentUser,
  addAuditEntry,
  showESignature,
  language = 'en'
}) {
  const [expandedInvestigation, setExpandedInvestigation] = useState(null);
  const [showNewInvestigation, setShowNewInvestigation] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const createInvestigation = (formData) => {
    const newInvestigation = {
      id: `INV-${Date.now()}`,
      title: formData.get('title'),
      description: formData.get('description'),
      type: formData.get('type'),
      priority: formData.get('priority'),
      initiator: currentUser.name,
      initiatedDate: new Date().toISOString(),
      status: 'initiated',
      targetCloseDate: formData.get('targetClose'),
      relatedDeviations: formData.get('deviationIds')?.split(',').map(s => s.trim()).filter(Boolean) || [],
      relatedBatches: formData.get('batchIds')?.split(',').map(s => s.trim()).filter(Boolean) || [],
      workflow: [
        { step: 'Initiation', status: 'completed', completedBy: currentUser.name, date: new Date().toISOString(), notes: '' },
        { step: 'Evidence Collection', status: 'active', completedBy: null, date: null, notes: '' },
        { step: 'Root Cause Analysis', status: 'pending', completedBy: null, date: null, notes: '' },
        { step: 'Impact Assessment', status: 'pending', completedBy: null, date: null, notes: '' },
        { step: 'Recommendations', status: 'pending', completedBy: null, date: null, notes: '' },
        { step: 'Review & Approval', status: 'pending', completedBy: null, date: null, notes: '' },
        { step: 'CAPA Generation', status: 'pending', completedBy: null, date: null, notes: '' },
        { step: 'Closure', status: 'pending', completedBy: null, date: null, notes: '' }
      ],
      evidenceCollected: [],
      timeline: [],
      rootCause: null,
      impactAssessment: null,
      recommendations: [],
      linkedCapa: null,
      investigationTeam: [currentUser.name]
    };

    setInvestigations(prev => [...prev, newInvestigation]);
    addAuditEntry("Investigation Created", `${newInvestigation.id}: ${newInvestigation.title}`);
    setShowNewInvestigation(false);
  };

  const updateInvestigationStep = (investigationId, step, notes) => {
    showESignature(
      'Investigation Step Completion',
      `Complete: ${step} for ${investigationId}`,
      (signature) => {
        setInvestigations(prev => prev.map(inv => {
          if (inv.id === investigationId) {
            const stepIndex = inv.workflow.findIndex(w => w.step === step);
            const updatedWorkflow = [...inv.workflow];
            
            updatedWorkflow[stepIndex] = {
              ...updatedWorkflow[stepIndex],
              status: 'completed',
              completedBy: signature.user,
              date: signature.timestamp,
              notes: notes,
              signature: signature
            };

            // Activate next step
            if (stepIndex < updatedWorkflow.length - 1) {
              updatedWorkflow[stepIndex + 1].status = 'active';
            }

            let newStatus = inv.status;
            if (step === 'Evidence Collection') newStatus = 'evidence_collected';
            if (step === 'Root Cause Analysis') newStatus = 'rca_complete';
            if (step === 'Impact Assessment') newStatus = 'impact_assessed';
            if (step === 'Recommendations') newStatus = 'recommendations_ready';
            if (step === 'Review & Approval') newStatus = 'approved';
            if (step === 'CAPA Generation') newStatus = 'capa_generated';
            if (step === 'Closure') newStatus = 'closed';

            return {
              ...inv,
              workflow: updatedWorkflow,
              status: newStatus
            };
          }
          return inv;
        }));

        addAuditEntry("Investigation Updated", `${investigationId} - ${step} completed by ${signature.user}`);
      }
    );
  };

  const addEvidence = (investigationId) => {
    const evidence = prompt("Enter evidence description:");
    const source = prompt("Evidence source:");
    
    if (evidence && source) {
      setInvestigations(prev => prev.map(inv => {
        if (inv.id === investigationId) {
          return {
            ...inv,
            evidenceCollected: [...inv.evidenceCollected, {
              id: Date.now(),
              description: evidence,
              source: source,
              collectedBy: currentUser.name,
              collectedDate: new Date().toISOString(),
              type: 'document' // document, photo, sample, testimony
            }]
          };
        }
        return inv;
      }));
      addAuditEntry("Evidence Added", `${investigationId} - Evidence: ${evidence}`);
    }
  };

  const generateCAPAFromInvestigation = (investigationId) => {
    const investigation = investigations.find(inv => inv.id === investigationId);
    
    if (!investigation.rootCause) {
      alert("Root cause analysis must be completed before generating CAPA");
      return;
    }

    const newCapa = {
      id: `CAPA-${Date.now()}`,
      title: `CAPA for Investigation ${investigationId}`,
      description: `Root cause: ${investigation.rootCause}`,
      type: 'corrective',
      category: 'investigation',
      severity: investigation.priority,
      source: 'investigation',
      initiator: currentUser.name,
      initiatedDate: new Date().toISOString(),
      status: 'initiated',
      targetCloseDate: new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0], // 60 days
      workflow: [
        { step: 'Initiation', status: 'completed', completedBy: currentUser.name, date: new Date().toISOString(), notes: `Linked to ${investigationId}` },
        { step: 'Investigation', status: 'completed', completedBy: currentUser.name, date: new Date().toISOString(), notes: 'Investigation already completed' },
        { step: 'Root Cause Analysis', status: 'completed', completedBy: currentUser.name, date: new Date().toISOString(), notes: investigation.rootCause },
        { step: 'Action Plan', status: 'active', completedBy: null, date: null, notes: '' },
        { step: 'Implementation', status: 'pending', completedBy: null, date: null, notes: '' },
        { step: 'Effectiveness Check', status: 'pending', completedBy: null, date: null, notes: '' },
        { step: 'Closure', status: 'pending', completedBy: null, date: null, notes: '' }
      ],
      rootCause: investigation.rootCause,
      actionPlan: investigation.recommendations.map(rec => ({
        id: Date.now() + Math.random(),
        action: rec.action,
        responsible: rec.responsible,
        dueDate: rec.dueDate,
        status: 'pending',
        completedDate: null
      })),
      effectivenessCheck: null,
      relatedInvestigations: [investigationId],
      relatedDeviations: investigation.relatedDeviations,
      relatedBatches: investigation.relatedBatches
    };

    setCapas(prev => [...prev, newCapa]);
    
    // Link CAPA to investigation
    setInvestigations(prev => prev.map(inv => 
      inv.id === investigationId ? { ...inv, linkedCapa: newCapa.id } : inv
    ));

    addAuditEntry("CAPA Generated from Investigation", `${newCapa.id} created for ${investigationId}`);
    alert(`CAPA ${newCapa.id} generated successfully`);
  };

  const filteredInvestigations = investigations.filter(inv => {
    if (filterStatus === 'all') return true;
    return inv.status === filterStatus;
  });

  const stats = {
    total: investigations.length,
    active: investigations.filter(i => i.status !== 'closed').length,
    overdue: investigations.filter(i => i.targetCloseDate && new Date(i.targetCloseDate) < new Date() && i.status !== 'closed').length,
    withCAPA: investigations.filter(i => i.linkedCapa).length
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <Search className="w-6 h-6 mr-2" />
          Investigation Workflow
        </h2>
        <button 
          onClick={() => setShowNewInvestigation(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Investigation</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-blue-700">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Investigations</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-green-600">{stats.withCAPA}</div>
          <div className="text-sm text-gray-600">With CAPA</div>
        </div>
      </div>

      {showNewInvestigation && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Initiate New Investigation</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            createInvestigation(new FormData(e.target));
          }}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input
                  name="title"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Investigation title"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea
                  name="description"
                  required
                  rows="3"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="What needs to be investigated?"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Type</label>
                <select name="type" className="border rounded px-3 py-2 w-full" required>
                  <option value="deviation">Deviation Investigation</option>
                  <option value="complaint">Customer Complaint</option>
                  <option value="audit_finding">Audit Finding</option>
                  <option value="equipment_failure">Equipment Failure</option>
                  <option value="process_upset">Process Upset</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Priority</label>
                <select name="priority" className="border rounded px-3 py-2 w-full" required>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Related Deviations (comma separated)</label>
                <input
                  name="deviationIds"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="DEV-001, DEV-002"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Related Batches (comma separated)</label>
                <input
                  name="batchIds"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="BATCH-001, BATCH-002"
                />
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
              <button type="submit" className="btn-primary">Create Investigation</button>
              <button 
                type="button" 
                onClick={() => setShowNewInvestigation(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Investigations List */}
      <div className="glass-card">
        <div className="flex items-center space-x-4 mb-4">
          <label className="text-sm font-semibold">Status:</label>
          <select 
            className="border rounded px-3 py-1 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="initiated">Initiated</option>
            <option value="evidence_collected">Evidence Collected</option>
            <option value="rca_complete">RCA Complete</option>
            <option value="approved">Approved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs">Investigation ID</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Title</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Type</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Priority</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Status</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Target Close</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvestigations.map((inv, idx) => (
              <React.Fragment key={inv.id}>
                <tr className={`border-b hover:bg-white/40 ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                  <td className="py-2 px-2 font-mono text-xs">{inv.id}</td>
                  <td className="py-2 px-2 text-xs">{inv.title}</td>
                  <td className="py-2 px-2 text-xs">{inv.type.replace('_', ' ')}</td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      inv.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      inv.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      inv.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {inv.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      inv.status === 'closed' ? 'bg-green-100 text-green-800' :
                      inv.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {inv.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-xs">
                    {new Date(inv.targetCloseDate).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-2">
                    <button
                      onClick={() => setExpandedInvestigation(expandedInvestigation === inv.id ? null : inv.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {expandedInvestigation === inv.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </td>
                </tr>

                {expandedInvestigation === inv.id && (
                  <tr>
                    <td colSpan="7" className="py-4 px-4 bg-white/60">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold mb-1">Description:</p>
                          <p className="text-sm text-gray-700">{inv.description}</p>
                        </div>

                        {/* Workflow Progress */}
                        <div>
                          <p className="text-sm font-semibold mb-2">Investigation Progress:</p>
                          <div className="space-y-2">
                            {inv.workflow.map((step, idx) => (
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
                                    onClick={() => {
                                      const notes = prompt(`Enter notes for ${step.step}:`);
                                      if (notes) updateInvestigationStep(inv.id, step.step, notes);
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

                        {/* Evidence */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-semibold">Evidence Collected:</p>
                            {inv.workflow.find(w => w.step === 'Evidence Collection')?.status === 'active' && (
                              <button
                                onClick={() => addEvidence(inv.id)}
                                className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                              >
                                + Add Evidence
                              </button>
                            )}
                          </div>
                          {inv.evidenceCollected.length > 0 ? (
                            <div className="space-y-1">
                              {inv.evidenceCollected.map((evidence) => (
                                <div key={evidence.id} className="bg-gray-50 px-2 py-1 rounded text-xs">
                                  <p><span className="font-semibold">Source:</span> {evidence.source}</p>
                                  <p>{evidence.description}</p>
                                  <p className="text-gray-600">Collected by {evidence.collectedBy} on {new Date(evidence.collectedDate).toLocaleDateString()}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">No evidence collected yet</p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 pt-3 border-t">
                          {inv.status === 'approved' && !inv.linkedCapa && (
                            <button
                              onClick={() => generateCAPAFromInvestigation(inv.id)}
                              className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                            >
                              Generate CAPA
                            </button>
                          )}
                          {inv.linkedCapa && (
                            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                              CAPA: {inv.linkedCapa}
                            </span>
                          )}
                        </div>
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