import React, { useState } from 'react';
import { AlertTriangle, Plus, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, Link as LinkIcon } from 'lucide-react';

export default function DeviationManagement({ 
  deviations,
  setDeviations,
  batches,
  materials,
  currentUser,
  addAuditEntry,
  showESignature,
  capas,
  setCapas,
  language = 'en'
}) {
  const [expandedDeviation, setExpandedDeviation] = useState(null);
  const [showNewDeviation, setShowNewDeviation] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const createDeviation = (formData) => {
    const newDeviation = {
      id: `DEV-${Date.now()}`,
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      severity: formData.get('severity'), // Critical, Major, Minor
      detectedBy: currentUser.name,
      detectedDate: new Date().toISOString(),
      status: 'open',
      relatedBatch: formData.get('batchId') || null,
      relatedMaterial: formData.get('materialId') || null,
      immediateAction: '',
      investigation: {
        startDate: null,
        investigator: null,
        findings: '',
        rootCause: '',
        completedDate: null,
        signature: null
      },
      qaReview: {
        reviewer: null,
        reviewDate: null,
        decision: null, // 'approved', 'rejected', 'rework'
        comments: '',
        signature: null
      },
      linkedCapa: null,
      attachments: [],
      workflow: [
        { step: 'Detection', status: 'completed', completedBy: currentUser.name, date: new Date().toISOString() },
        { step: 'Immediate Action', status: 'pending', completedBy: null, date: null },
        { step: 'Investigation', status: 'pending', completedBy: null, date: null },
        { step: 'QA Review', status: 'pending', completedBy: null, date: null },
        { step: 'Closure', status: 'pending', completedBy: null, date: null }
      ]
    };

    setDeviations(prev => [...prev, newDeviation]);
    addAuditEntry("Deviation Created", `${newDeviation.id}: ${newDeviation.title}`);
    setShowNewDeviation(false);
  };

  const addImmediateAction = (deviationId) => {
    const action = prompt("Enter immediate action taken:");
    if (!action) return;

    showESignature(
      'Immediate Action',
      `Deviation ${deviationId}`,
      (signature) => {
        setDeviations(prev => prev.map(d => {
          if (d.id === deviationId) {
            const workflow = [...d.workflow];
            workflow[1] = {
              ...workflow[1],
              status: 'completed',
              completedBy: signature.signedBy,
              date: signature.timestamp
            };
            workflow[2].status = 'active';

            return {
              ...d,
              immediateAction: action,
              workflow
            };
          }
          return d;
        }));
        addAuditEntry("Immediate Action Taken", `${deviationId}: ${action}`);
      }
    );
  };

  const completeInvestigation = (deviationId) => {
    const findings = prompt("Investigation findings:");
    if (!findings) return;
    const rootCause = prompt("Root cause identified:");
    if (!rootCause) return;

    showESignature(
      'Investigation Completion',
      `Deviation ${deviationId}`,
      (signature) => {
        setDeviations(prev => prev.map(d => {
          if (d.id === deviationId) {
            const workflow = [...d.workflow];
            workflow[2] = {
              ...workflow[2],
              status: 'completed',
              completedBy: signature.signedBy,
              date: signature.timestamp
            };
            workflow[3].status = 'active';

            return {
              ...d,
              investigation: {
                startDate: d.investigation.startDate || new Date().toISOString(),
                investigator: signature.signedBy,
                findings: findings,
                rootCause: rootCause,
                completedDate: signature.timestamp,
                signature: signature
              },
              workflow
            };
          }
          return d;
        }));
        addAuditEntry("Investigation Completed", `${deviationId}: Root cause - ${rootCause}`);
      }
    );
  };

  const qaReviewDeviation = (deviationId) => {
    const decision = prompt("QA Decision (approved/rejected/rework):");
    if (!decision || !['approved', 'rejected', 'rework'].includes(decision.toLowerCase())) {
      alert("Invalid decision. Use: approved, rejected, or rework");
      return;
    }
    const comments = prompt("QA Comments:");

    showESignature(
      'QA Review',
      `Deviation ${deviationId} - Decision: ${decision}`,
      (signature) => {
        setDeviations(prev => prev.map(d => {
          if (d.id === deviationId) {
            const workflow = [...d.workflow];
            workflow[3] = {
              ...workflow[3],
              status: 'completed',
              completedBy: signature.signedBy,
              date: signature.timestamp
            };

            if (decision.toLowerCase() === 'approved') {
              workflow[4].status = 'active';
            }

            return {
              ...d,
              qaReview: {
                reviewer: signature.signedBy,
                reviewDate: signature.timestamp,
                decision: decision.toLowerCase(),
                comments: comments || '',
                signature: signature
              },
              workflow,
              status: decision.toLowerCase() === 'approved' ? 'qa_approved' : 'under_review'
            };
          }
          return d;
        }));
        addAuditEntry("QA Review Completed", `${deviationId}: ${decision}`);
      }
    );
  };

  const closeDeviation = (deviationId) => {
    showESignature(
      'Close Deviation',
      `Deviation ${deviationId}`,
      (signature) => {
        setDeviations(prev => prev.map(d => {
          if (d.id === deviationId) {
            const workflow = [...d.workflow];
            workflow[4] = {
              ...workflow[4],
              status: 'completed',
              completedBy: signature.signedBy,
              date: signature.timestamp
            };

            return {
              ...d,
              status: 'closed',
              closedBy: signature.signedBy,
              closedDate: signature.timestamp,
              workflow
            };
          }
          return d;
        }));
        addAuditEntry("Deviation Closed", `${deviationId} closed by ${signature.signedBy}`);
      }
    );
  };

  const linkToCAPA = (deviationId) => {
    const capaId = prompt("Enter CAPA ID to link (or leave empty to create new):");
    
    if (!capaId) {
      // Create new CAPA
      const deviation = deviations.find(d => d.id === deviationId);
      const newCapa = {
        id: `CAPA-${Date.now()}`,
        title: `CAPA for Deviation ${deviationId}`,
        description: `Root cause: ${deviation.investigation.rootCause}`,
        type: 'corrective',
        category: 'deviation',
        severity: deviation.severity,
        source: 'deviation',
        initiator: currentUser.name,
        initiatedDate: new Date().toISOString(),
        status: 'initiated',
        targetCloseDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        workflow: [
          { step: 'Initiation', status: 'completed', completedBy: currentUser.name, date: new Date().toISOString(), notes: `Linked to ${deviationId}` },
          { step: 'Investigation', status: 'pending', completedBy: null, date: null, notes: '' },
          { step: 'Root Cause Analysis', status: 'pending', completedBy: null, date: null, notes: '' },
          { step: 'Action Plan', status: 'pending', completedBy: null, date: null, notes: '' },
          { step: 'Implementation', status: 'pending', completedBy: null, date: null, notes: '' },
          { step: 'Effectiveness Check', status: 'pending', completedBy: null, date: null, notes: '' },
          { step: 'Closure', status: 'pending', completedBy: null, date: null, notes: '' }
        ],
        rootCause: deviation.investigation.rootCause,
        actionPlan: [],
        effectivenessCheck: null,
        relatedDeviations: [deviationId],
        relatedBatches: deviation.relatedBatch ? [deviation.relatedBatch] : []
      };

      setCapas(prev => [...prev, newCapa]);
      setDeviations(prev => prev.map(d => 
        d.id === deviationId ? { ...d, linkedCapa: newCapa.id } : d
      ));
      addAuditEntry("CAPA Created from Deviation", `${newCapa.id} created for ${deviationId}`);
      alert(`New CAPA created: ${newCapa.id}`);
    } else {
      setDeviations(prev => prev.map(d => 
        d.id === deviationId ? { ...d, linkedCapa: capaId } : d
      ));
      addAuditEntry("Deviation Linked to CAPA", `${deviationId} linked to ${capaId}`);
    }
  };

  const filteredDeviations = deviations.filter(d => {
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && d.severity !== filterSeverity) return false;
    return true;
  });

  // Statistics
  const stats = {
    total: deviations.length,
    open: deviations.filter(d => d.status === 'open').length,
    critical: deviations.filter(d => d.severity === 'critical').length,
    underInvestigation: deviations.filter(d => d.investigation.investigator && !d.investigation.completedDate).length,
    closed: deviations.filter(d => d.status === 'closed').length
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <AlertTriangle className="w-6 h-6 mr-2 text-red-600" />
          Deviation Management
        </h2>
        <button 
          onClick={() => setShowNewDeviation(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Report Deviation</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-5 gap-4">
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-gray-700">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Deviations</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats.open}</div>
          <div className="text-sm text-gray-600">Open</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
          <div className="text-sm text-gray-600">Critical</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.underInvestigation}</div>
          <div className="text-sm text-gray-600">Under Investigation</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-green-600">{stats.closed}</div>
          <div className="text-sm text-gray-600">Closed</div>
        </div>
      </div>

      {showNewDeviation && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Report New Deviation</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            createDeviation(new FormData(e.target));
          }}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input
                  name="title"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Brief description of deviation"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea
                  name="description"
                  required
                  rows="3"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Detailed description of what deviated from procedure/specification"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Category</label>
                <select name="category" className="border rounded px-3 py-2 w-full" required>
                  <option value="process">Process Deviation</option>
                  <option value="documentation">Documentation Error</option>
                  <option value="equipment">Equipment Malfunction</option>
                  <option value="material">Material Issue</option>
                  <option value="quality">Quality Defect</option>
                  <option value="environmental">Environmental</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Severity</label>
                <select name="severity" className="border rounded px-3 py-2 w-full" required>
                  <option value="minor">Minor</option>
                  <option value="major">Major</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Related Batch (optional)</label>
                <select name="batchId" className="border rounded px-3 py-2 w-full">
                  <option value="">None</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Related Material (optional)</label>
                <select name="materialId" className="border rounded px-3 py-2 w-full">
                  <option value="">None</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.lotNumber}>{m.lotNumber} - {m.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">Report Deviation</button>
              <button 
                type="button" 
                onClick={() => setShowNewDeviation(false)}
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
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="qa_approved">QA Approved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-semibold">Severity:</label>
            <select 
              className="border rounded px-3 py-1 text-sm"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="all">All Severity</option>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Deviations Table */}
        <table className="w-full text-sm">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs">Deviation ID</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Title</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Severity</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Category</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Status</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Detected By</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeviations.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  No deviations found
                </td>
              </tr>
            ) : (
              filteredDeviations.map((dev, idx) => (
                <React.Fragment key={dev.id}>
                  <tr className={`border-b hover:bg-white/40 ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                    <td className="py-2 px-2 font-mono text-xs">{dev.id}</td>
                    <td className="py-2 px-2 text-xs">{dev.title}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        dev.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        dev.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {dev.severity}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-xs">{dev.category}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        dev.status === 'closed' ? 'bg-green-100 text-green-800' :
                        dev.status === 'qa_approved' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {dev.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-xs">{dev.detectedBy}</td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => setExpandedDeviation(expandedDeviation === dev.id ? null : dev.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {expandedDeviation === dev.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </td>
                  </tr>

                  {expandedDeviation === dev.id && (
                    <tr>
                      <td colSpan="7" className="py-4 px-4 bg-white/60">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-semibold mb-1">Description:</p>
                            <p className="text-sm text-gray-700">{dev.description}</p>
                          </div>

                          {dev.relatedBatch && (
                            <div className="flex items-center space-x-2 text-sm">
                              <LinkIcon className="w-4 h-4 text-blue-600" />
                              <span className="font-semibold">Related Batch:</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{dev.relatedBatch}</span>
                            </div>
                          )}

                          {dev.relatedMaterial && (
                            <div className="flex items-center space-x-2 text-sm">
                              <LinkIcon className="w-4 h-4 text-purple-600" />
                              <span className="font-semibold">Related Material:</span>
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">{dev.relatedMaterial}</span>
                            </div>
                          )}

                          {dev.linkedCapa && (
                            <div className="flex items-center space-x-2 text-sm">
                              <LinkIcon className="w-4 h-4 text-green-600" />
                              <span className="font-semibold">Linked CAPA:</span>
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{dev.linkedCapa}</span>
                            </div>
                          )}

                          {/* Workflow */}
                          <div>
                            <p className="text-sm font-semibold mb-2">Workflow Progress:</p>
                            <div className="space-y-2">
                              {dev.workflow.map((step, idx) => (
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
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Immediate Action */}
                          {dev.immediateAction && (
                            <div className="bg-blue-50 p-3 rounded">
                              <p className="text-sm font-semibold mb-1">Immediate Action:</p>
                              <p className="text-sm">{dev.immediateAction}</p>
                            </div>
                          )}

                          {/* Investigation */}
                          {dev.investigation.completedDate && (
                            <div className="bg-purple-50 p-3 rounded">
                              <p className="text-sm font-semibold mb-2">Investigation Results:</p>
                              <div className="text-sm space-y-1">
                                <p><span className="font-semibold">Findings:</span> {dev.investigation.findings}</p>
                                <p><span className="font-semibold">Root Cause:</span> {dev.investigation.rootCause}</p>
                                <p className="text-xs text-gray-600">
                                  Investigated by {dev.investigation.investigator} on {new Date(dev.investigation.completedDate).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* QA Review */}
                          {dev.qaReview.decision && (
                            <div className={`p-3 rounded ${
                              dev.qaReview.decision === 'approved' ? 'bg-green-50' :
                              dev.qaReview.decision === 'rejected' ? 'bg-red-50' :
                              'bg-yellow-50'
                            }`}>
                              <p className="text-sm font-semibold mb-2">QA Review:</p>
                              <div className="text-sm space-y-1">
                                <p><span className="font-semibold">Decision:</span> {dev.qaReview.decision.toUpperCase()}</p>
                                <p><span className="font-semibold">Comments:</span> {dev.qaReview.comments}</p>
                                <p className="text-xs text-gray-600">
                                  Reviewed by {dev.qaReview.reviewer} on {new Date(dev.qaReview.reviewDate).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 pt-3 border-t">
                            {dev.workflow[1].status === 'active' && (
                              <button
                                onClick={() => addImmediateAction(dev.id)}
                                className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                              >
                                Add Immediate Action
                              </button>
                            )}
                            {dev.workflow[2].status === 'active' && (
                              <button
                                onClick={() => completeInvestigation(dev.id)}
                                className="text-sm bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                              >
                                Complete Investigation
                              </button>
                            )}
                            {dev.workflow[3].status === 'active' && currentUser.role === 'QA' && (
                              <button
                                onClick={() => qaReviewDeviation(dev.id)}
                                className="text-sm bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600"
                              >
                                QA Review
                              </button>
                            )}
                            {dev.workflow[4].status === 'active' && (
                              <button
                                onClick={() => closeDeviation(dev.id)}
                                className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                              >
                                Close Deviation
                              </button>
                            )}
                            {dev.status !== 'closed' && !dev.linkedCapa && (
                              <button
                                onClick={() => linkToCAPA(dev.id)}
                                className="text-sm bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600"
                              >
                                Link to CAPA
                              </button>
                            )}
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
