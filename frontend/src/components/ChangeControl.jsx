import React, { useState } from 'react';
import { Plus, FileText, ChevronDown, ChevronUp, CheckCircle, Clock, AlertTriangle, Shield } from 'lucide-react';

export default function ChangeControl({ 
  changes,
  setChanges,
  formulas,
  workflows,
  currentUser,
  addAuditEntry,
  showESignature,
  createValidationProtocol,
  language = 'en'
}) {
  const [expandedChange, setExpandedChange] = useState(null);
  const [showNewChange, setShowNewChange] = useState(false);
  const [showImpactAssessment, setShowImpactAssessment] = useState(null);
  const [showEffectivenessReview, setShowEffectivenessReview] = useState(null);

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
        { step: 'Impact Assessment', status: 'active', completedBy: null, date: null },
        { step: 'Risk Assessment', status: 'pending', completedBy: null, date: null },
        { step: 'Approval', status: 'pending', completedBy: null, date: null },
        { step: 'Implementation', status: 'pending', completedBy: null, date: null },
        { step: 'Verification', status: 'pending', completedBy: null, date: null },
        { step: 'Effectiveness Review', status: 'pending', completedBy: null, date: null },
        { step: 'Closure', status: 'pending', completedBy: null, date: null }
      ],
      impactAssessment: null,
      riskAssessment: null,
      approvals: [],
      implementationNotes: null,
      verificationNotes: null,
      effectivenessReview: null,
      revalidationRequired: false,
      linkedValidation: null
    };

    setChanges(prev => [...prev, newChange]);
    addAuditEntry("Change Control Created", `${newChange.id}: ${newChange.title}`);
    setShowNewChange(false);
  };

  const performImpactAssessment = (changeId, assessment) => {
    showESignature(
      'Impact Assessment Completion',
      `Complete impact assessment for ${changeId}`,
      (signature) => {
        setChanges(prev => prev.map(c => {
          if (c.id === changeId) {
            const workflowIndex = c.workflow.findIndex(w => w.step === 'Impact Assessment');
            const updatedWorkflow = [...c.workflow];
            updatedWorkflow[workflowIndex] = {
              ...updatedWorkflow[workflowIndex],
              status: 'completed',
              completedBy: signature.signedBy,
              date: signature.timestamp,
              signature: signature
            };
            
            // Activate Risk Assessment
            updatedWorkflow[workflowIndex + 1].status = 'active';

            return {
              ...c,
              workflow: updatedWorkflow,
              status: 'impact_assessed',
              impactAssessment: {
                ...assessment,
                assessedBy: signature.signedBy,
                assessedDate: signature.timestamp,
                signature: signature
              },
              revalidationRequired: assessment.requiresRevalidation
            };
          }
          return c;
        }));

        addAuditEntry("Impact Assessment Completed", `${changeId} - Revalidation ${assessment.requiresRevalidation ? 'Required' : 'Not Required'}`);
        setShowImpactAssessment(null);
      }
    );
  };

  const performRiskAssessment = (changeId, riskData) => {
    showESignature(
      'Risk Assessment Completion',
      `Complete risk assessment for ${changeId}`,
      (signature) => {
        setChanges(prev => prev.map(c => {
          if (c.id === changeId) {
            const workflowIndex = c.workflow.findIndex(w => w.step === 'Risk Assessment');
            const updatedWorkflow = [...c.workflow];
            updatedWorkflow[workflowIndex] = {
              ...updatedWorkflow[workflowIndex],
              status: 'completed',
              completedBy: signature.signedBy,
              date: signature.timestamp,
              signature: signature
            };
            
            // Activate Approval
            updatedWorkflow[workflowIndex + 1].status = 'active';

            return {
              ...c,
              workflow: updatedWorkflow,
              status: 'risk_assessed',
              riskAssessment: {
                ...riskData,
                assessedBy: signature.signedBy,
                assessedDate: signature.timestamp,
                signature: signature
              }
            };
          }
          return c;
        }));

        addAuditEntry("Risk Assessment Completed", `${changeId} - Risk Level: ${riskData.riskLevel}`);
      }
    );
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
            if (step === 'Approval') newStatus = 'approved';
            if (step === 'Implementation') {
              newStatus = 'implemented';
              // Schedule effectiveness review (3 months from now)
              const reviewDate = new Date();
              reviewDate.setMonth(reviewDate.getMonth() + 3);
              c.effectivenessReviewDueDate = reviewDate.toISOString();
            }
            if (step === 'Verification') newStatus = 'verified';
            if (step === 'Effectiveness Review') newStatus = 'effectiveness_reviewed';
            if (step === 'Closure') newStatus = 'closed';

            return {
              ...c,
              workflow: updatedWorkflow,
              status: newStatus,
              [step === 'Implementation' ? 'implementationNotes' :
               step === 'Verification' ? 'verificationNotes' : null]: notes
            };
          }
          return c;
        }));

        addAuditEntry("Change Control Updated", `${changeId} - ${step} completed by ${signature.signedBy}`);
        
        // Auto-create validation protocol if needed
        if (step === 'Approval' && createValidationProtocol) {
          const change = changes.find(ch => ch.id === changeId);
          if (change.revalidationRequired) {
            const validationId = `VAL-${Date.now()}`;
            createValidationProtocol({
              id: validationId,
              linkedChange: changeId,
              type: change.type === 'Equipment' ? 'Equipment Qualification' : 'Process Validation',
              status: 'protocol_development'
            });
            
            setChanges(prev => prev.map(c => 
              c.id === changeId ? { ...c, linkedValidation: validationId } : c
            ));
            
            addAuditEntry("Validation Protocol Created", `${validationId} created for change ${changeId}`);
          }
        }
      }
    );
  };

  const performEffectivenessReview = (changeId, reviewData) => {
    showESignature(
      'Change Effectiveness Review',
      `Complete effectiveness review for ${changeId}`,
      (signature) => {
        setChanges(prev => prev.map(c => {
          if (c.id === changeId) {
            const workflowIndex = c.workflow.findIndex(w => w.step === 'Effectiveness Review');
            const updatedWorkflow = [...c.workflow];
            updatedWorkflow[workflowIndex] = {
              ...updatedWorkflow[workflowIndex],
              status: 'completed',
              completedBy: signature.signedBy,
              date: signature.timestamp,
              signature: signature
            };
            
            // Activate Closure
            updatedWorkflow[workflowIndex + 1].status = 'active';

            return {
              ...c,
              workflow: updatedWorkflow,
              status: 'effectiveness_reviewed',
              effectivenessReview: {
                ...reviewData,
                reviewedBy: signature.signedBy,
                reviewedDate: signature.timestamp,
                signature: signature
              }
            };
          }
          return c;
        }));

        addAuditEntry("Effectiveness Review Completed", `${changeId} - Effective: ${reviewData.isEffective ? 'YES' : 'NO'}`);
        setShowEffectivenessReview(null);
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
                  <option value="Facility">Facility Change</option>
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
              <th className="text-left py-2 px-2 font-semibold text-xs">Risk</th>
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
                      {change.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    {change.riskAssessment ? (
                      <span className={`px-2 py-1 rounded text-xs flex items-center ${
                        change.riskAssessment.riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                        change.riskAssessment.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        <Shield className="w-3 h-3 mr-1" />
                        {change.riskAssessment.riskLevel}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>
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

                        {/* Workflow Progress */}
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
                                {step.status === 'active' && step.step === 'Impact Assessment' && (
                                  <button
                                    onClick={() => setShowImpactAssessment(change.id)}
                                    className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                  >
                                    Complete
                                  </button>
                                )}
                                {step.status === 'active' && step.step === 'Risk Assessment' && (
                                  <button
                                    onClick={() => {
                                      const severity = prompt("Severity (1-5):", "3");
                                      const probability = prompt("Probability (1-5):", "2");
                                      const detectability = prompt("Detectability (1-5):", "2");
                                      if (severity && probability && detectability) {
                                        const rpn = parseInt(severity) * parseInt(probability) * parseInt(detectability);
                                        const riskLevel = rpn > 50 ? 'High' : rpn > 20 ? 'Medium' : 'Low';
                                        performRiskAssessment(change.id, {
                                          severity: parseInt(severity),
                                          probability: parseInt(probability),
                                          detectability: parseInt(detectability),
                                          rpn,
                                          riskLevel,
                                          mitigationPlan: prompt("Mitigation plan:", "")
                                        });
                                      }
                                    }}
                                    className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                  >
                                    Complete
                                  </button>
                                )}
                                {step.status === 'active' && !['Impact Assessment', 'Risk Assessment', 'Effectiveness Review'].includes(step.step) && (
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
                                {step.status === 'active' && step.step === 'Effectiveness Review' && (
                                  <button
                                    onClick={() => setShowEffectivenessReview(change.id)}
                                    className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                  >
                                    Review
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Impact Assessment Display */}
                        {change.impactAssessment && (
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm font-semibold mb-2">Impact Assessment:</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="font-semibold">Affects Validation:</span> {change.impactAssessment.affectsValidation ? 'Yes' : 'No'}
                              </div>
                              <div>
                                <span className="font-semibold">Regulatory Notification:</span> {change.impactAssessment.requiresRegulatoryNotification ? 'Yes' : 'No'}
                              </div>
                              <div>
                                <span className="font-semibold">Affects Other Products:</span> {change.impactAssessment.affectsOtherProducts ? 'Yes' : 'No'}
                              </div>
                              <div>
                                <span className="font-semibold">Revalidation Required:</span> {change.impactAssessment.requiresRevalidation ? 'Yes' : 'No'}
                              </div>
                              {change.impactAssessment.justification && (
                                <div className="col-span-2">
                                  <span className="font-semibold">Justification:</span> {change.impactAssessment.justification}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Risk Assessment Display */}
                        {change.riskAssessment && (
                          <div className="bg-yellow-50 p-3 rounded">
                            <p className="text-sm font-semibold mb-2 flex items-center">
                              <Shield className="w-4 h-4 mr-1" />
                              Risk Assessment:
                            </p>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="font-semibold">Severity:</span> {change.riskAssessment.severity}/5
                              </div>
                              <div>
                                <span className="font-semibold">Probability:</span> {change.riskAssessment.probability}/5
                              </div>
                              <div>
                                <span className="font-semibold">Detectability:</span> {change.riskAssessment.detectability}/5
                              </div>
                              <div>
                                <span className="font-semibold">RPN:</span> {change.riskAssessment.rpn}
                              </div>
                              <div className="col-span-2">
                                <span className="font-semibold">Risk Level:</span> 
                                <span className={`ml-2 px-2 py-1 rounded ${
                                  change.riskAssessment.riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                                  change.riskAssessment.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {change.riskAssessment.riskLevel}
                                </span>
                              </div>
                              {change.riskAssessment.mitigationPlan && (
                                <div className="col-span-3">
                                  <span className="font-semibold">Mitigation:</span> {change.riskAssessment.mitigationPlan}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Effectiveness Review Display */}
                        {change.effectivenessReview && (
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-sm font-semibold mb-2">Effectiveness Review:</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="font-semibold">Effective:</span> {change.effectivenessReview.isEffective ? 'Yes' : 'No'}
                              </div>
                              <div>
                                <span className="font-semibold">Reviewed:</span> {new Date(change.effectivenessReview.reviewedDate).toLocaleDateString()}
                              </div>
                              <div className="col-span-2">
                                <span className="font-semibold">Comments:</span> {change.effectivenessReview.comments}
                              </div>
                            </div>
                          </div>
                        )}

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

                        {change.revalidationRequired && (
                          <div className="bg-orange-50 border border-orange-300 p-3 rounded">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="w-5 h-5 text-orange-700" />
                              <div>
                                <p className="font-semibold text-orange-900">Revalidation Required</p>
                                {change.linkedValidation && (
                                  <p className="text-xs text-orange-800">Validation Protocol: {change.linkedValidation}</p>
                                )}
                              </div>
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

                        {change.status === 'risk_assessed' && change.approvals.length === 0 && (
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

      {/* Impact Assessment Modal */}
      {showImpactAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass-card max-w-2xl w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Impact Assessment</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const assessment = {
                affectsValidation: formData.get('affectsValidation') === 'on',
                requiresRegulatoryNotification: formData.get('requiresRegulatoryNotification') === 'on',
                affectsOtherProducts: formData.get('affectsOtherProducts') === 'on',
                requiresRevalidation: formData.get('requiresRevalidation') === 'on',
                affectsQualityAttributes: formData.get('affectsQualityAttributes') === 'on',
                justification: formData.get('justification')
              };
              performImpactAssessment(showImpactAssessment, assessment);
            }}>
              <div className="space-y-3 mb-4">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="affectsValidation" className="rounded" />
                  <span className="text-sm">Affects existing validation status</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="requiresRegulatoryNotification" className="rounded" />
                  <span className="text-sm">Requires regulatory notification (FDA/EMA)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="affectsOtherProducts" className="rounded" />
                  <span className="text-sm">Affects other products/processes</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="requiresRevalidation" className="rounded" />
                  <span className="text-sm font-semibold text-orange-700">Requires revalidation</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="affectsQualityAttributes" className="rounded" />
                  <span className="text-sm">Affects critical quality attributes</span>
                </label>
                <div>
                  <label className="block text-sm font-semibold mb-1">Justification</label>
                  <textarea
                    name="justification"
                    rows="3"
                    className="border rounded px-3 py-2 w-full text-sm"
                    placeholder="Provide detailed justification for your assessment..."
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="btn-primary">Submit Assessment</button>
                <button 
                  type="button" 
                  onClick={() => setShowImpactAssessment(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Effectiveness Review Modal */}
      {showEffectivenessReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass-card max-w-2xl w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Change Effectiveness Review</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const reviewData = {
                isEffective: formData.get('isEffective') === 'yes',
                meetsObjectives: formData.get('meetsObjectives') === 'on',
                noUnintendedConsequences: formData.get('noUnintendedConsequences') === 'on',
                comments: formData.get('comments'),
                dataReviewed: formData.get('dataReviewed')
              };
              performEffectivenessReview(showEffectivenessReview, reviewData);
            }}>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Is the change effective?</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="isEffective" value="yes" required />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="isEffective" value="no" required />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="meetsObjectives" className="rounded" />
                  <span className="text-sm">Change meets intended objectives</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="noUnintendedConsequences" className="rounded" />
                  <span className="text-sm">No unintended consequences observed</span>
                </label>
                <div>
                  <label className="block text-sm font-semibold mb-1">Data Reviewed</label>
                  <textarea
                    name="dataReviewed"
                    rows="2"
                    className="border rounded px-3 py-2 w-full text-sm"
                    placeholder="What data was reviewed? (e.g., 10 batches, 3 months of production data)"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Review Comments</label>
                  <textarea
                    name="comments"
                    rows="3"
                    className="border rounded px-3 py-2 w-full text-sm"
                    placeholder="Detailed comments on effectiveness..."
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="btn-primary">Submit Review</button>
                <button 
                  type="button" 
                  onClick={() => setShowEffectivenessReview(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}