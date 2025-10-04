import React, { useState } from 'react';
import { FileText, Plus, ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle, Search, Download } from 'lucide-react';

export default function SOPManagement({ 
  sops,
  setSops,
  personnel,
  currentUser,
  addAuditEntry,
  showESignature,
  language = 'en'
}) {
  const [expandedSop, setExpandedSop] = useState(null);
  const [showNewSop, setShowNewSop] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const createSOP = (formData) => {
    const newSop = {
      id: `SOP-${Date.now()}`,
      sopNumber: `SOP-${formData.get('department')}-${String(sops.filter(s => s.department === formData.get('department')).length + 1).padStart(3, '0')}`,
      title: formData.get('title'),
      department: formData.get('department'),
      category: formData.get('category'),
      version: '1.0',
      status: 'draft',
      effectiveDate: null,
      nextReviewDate: null,
      author: currentUser.name,
      createdDate: new Date().toISOString(),
      content: formData.get('content'),
      purpose: formData.get('purpose'),
      scope: formData.get('scope'),
      references: [],
      attachments: [],
      approvalWorkflow: [
        { step: 'Author', role: 'Author', status: 'completed', approver: currentUser.name, date: new Date().toISOString() },
        { step: 'Department Review', role: 'Master', status: 'pending', approver: null, date: null },
        { step: 'QA Review', role: 'QA', status: 'pending', approver: null, date: null },
        { step: 'Final Approval', role: 'Admin', status: 'pending', approver: null, date: null }
      ],
      trainingRecords: [],
      revisionHistory: [{
        version: '1.0',
        date: new Date().toISOString(),
        author: currentUser.name,
        changes: 'Initial creation'
      }]
    };

    setSops(prev => [...prev, newSop]);
    addAuditEntry("SOP Created", `${newSop.sopNumber}: ${newSop.title}`);
    setShowNewSop(false);
  };

  const approveSOPStep = (sopId, stepIndex) => {
    const sop = sops.find(s => s.id === sopId);
    const step = sop.approvalWorkflow[stepIndex];

    if (currentUser.role !== step.role && currentUser.role !== 'Admin') {
      alert(`Only ${step.role} can approve this step`);
      return;
    }

    showESignature(
      'SOP Approval',
      `${sop.sopNumber} - ${step.step}`,
      (signature) => {
        setSops(prev => prev.map(s => {
          if (s.id === sopId) {
            const workflow = [...s.approvalWorkflow];
            workflow[stepIndex] = {
              ...workflow[stepIndex],
              status: 'completed',
              approver: signature.signedBy,
              date: signature.timestamp,
              signature: signature
            };

            // Activate next step
            if (stepIndex < workflow.length - 1) {
              workflow[stepIndex + 1].status = 'active';
            }

            // If all approved, make effective
            const allApproved = workflow.every(w => w.status === 'completed');
            const newStatus = allApproved ? 'effective' : s.status === 'draft' ? 'in_review' : s.status;
            const effectiveDate = allApproved ? new Date().toISOString() : s.effectiveDate;
            const nextReviewDate = allApproved ? new Date(Date.now() + 365*24*60*60*1000).toISOString() : s.nextReviewDate;

            return {
              ...s,
              approvalWorkflow: workflow,
              status: newStatus,
              effectiveDate: effectiveDate,
              nextReviewDate: nextReviewDate
            };
          }
          return s;
        }));
        addAuditEntry("SOP Approved", `${sop.sopNumber} - ${step.step} approved by ${signature.signedBy}`);
      }
    );
  };

  const acknowledgeSOP = (sopId) => {
    showESignature(
      'SOP Training Acknowledgment',
      `I confirm I have read and understood ${sops.find(s => s.id === sopId).sopNumber}`,
      (signature) => {
        setSops(prev => prev.map(s => {
          if (s.id === sopId) {
            return {
              ...s,
              trainingRecords: [...s.trainingRecords, {
                userId: currentUser.name,
                role: currentUser.role,
                acknowledgedDate: signature.timestamp,
                signature: signature,
                version: s.version
              }]
            };
          }
          return s;
        }));
        addAuditEntry("SOP Acknowledged", `${sops.find(s => s.id === sopId).sopNumber} acknowledged by ${signature.signedBy}`);
      }
    );
  };

  const reviseSOPVersion = (sopId) => {
    const changes = prompt("Describe changes in this revision:");
    if (!changes) return;

    showESignature(
      'SOP Revision',
      `Create new version for ${sops.find(s => s.id === sopId).sopNumber}`,
      (signature) => {
        setSops(prev => prev.map(s => {
          if (s.id === sopId) {
            const [major, minor] = s.version.split('.').map(Number);
            const newVersion = `${major}.${minor + 1}`;

            return {
              ...s,
              version: newVersion,
              status: 'draft',
              effectiveDate: null,
              approvalWorkflow: [
                { step: 'Author', role: 'Author', status: 'completed', approver: signature.signedBy, date: signature.timestamp },
                { step: 'Department Review', role: 'Master', status: 'pending', approver: null, date: null },
                { step: 'QA Review', role: 'QA', status: 'pending', approver: null, date: null },
                { step: 'Final Approval', role: 'Admin', status: 'pending', approver: null, date: null }
              ],
              revisionHistory: [...s.revisionHistory, {
                version: newVersion,
                date: signature.timestamp,
                author: signature.signedBy,
                changes: changes
              }]
            };
          }
          return s;
        }));
        addAuditEntry("SOP Revised", `New version created for ${sops.find(s => s.id === sopId).sopNumber}`);
      }
    );
  };

  const filteredSops = sops.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (filterDepartment !== 'all' && s.department !== filterDepartment) return false;
    if (searchTerm && !s.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !s.sopNumber.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: sops.length,
    effective: sops.filter(s => s.status === 'effective').length,
    draft: sops.filter(s => s.status === 'draft').length,
    needsReview: sops.filter(s => s.nextReviewDate && new Date(s.nextReviewDate) < new Date()).length,
    needsTraining: sops.filter(s => 
      s.status === 'effective' && 
      !s.trainingRecords.some(tr => tr.userId === currentUser.name && tr.version === s.version)
    ).length
  };

  const departments = [...new Set(sops.map(s => s.department))];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <FileText className="w-6 h-6 mr-2 text-blue-600" />
          SOP Management System
        </h2>
        <button 
          onClick={() => setShowNewSop(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create SOP</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-5 gap-4">
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
          <div className="text-xs text-gray-600">Total SOPs</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-green-600">{stats.effective}</div>
          <div className="text-xs text-gray-600">Effective</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
          <div className="text-xs text-gray-600">In Draft</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-red-600">{stats.needsReview}</div>
          <div className="text-xs text-gray-600">Need Review</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.needsTraining}</div>
          <div className="text-xs text-gray-600">Your Training</div>
        </div>
      </div>

      {showNewSop && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Create New SOP</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            createSOP(new FormData(e.target));
          }}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input
                  name="title"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="SOP title"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Department</label>
                <select name="department" className="border rounded px-3 py-2 w-full" required>
                  <option value="Production">Production</option>
                  <option value="QA">Quality Assurance</option>
                  <option value="QC">Quality Control</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="R&D">R&D</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Category</label>
                <select name="category" className="border rounded px-3 py-2 w-full" required>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Testing">Testing</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Calibration">Calibration</option>
                  <option value="Documentation">Documentation</option>
                  <option value="Safety">Safety</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Purpose</label>
                <textarea
                  name="purpose"
                  required
                  rows="2"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Purpose and objective of this SOP"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Scope</label>
                <textarea
                  name="scope"
                  required
                  rows="2"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Scope and applicability"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Procedure Content</label>
                <textarea
                  name="content"
                  required
                  rows="8"
                  className="border rounded px-3 py-2 w-full font-mono text-sm"
                  placeholder="Detailed step-by-step procedure..."
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">Create SOP</button>
              <button 
                type="button" 
                onClick={() => setShowNewSop(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters & Search */}
      <div className="glass-card">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              className="border rounded px-3 py-2 pl-10 w-full"
              placeholder="Search SOPs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="border rounded px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="effective">Effective</option>
            <option value="obsolete">Obsolete</option>
          </select>
          <select 
            className="border rounded px-3 py-2 text-sm"
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* SOPs Table */}
        <table className="w-full text-sm">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs">SOP Number</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Title</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Version</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Department</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Status</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Effective Date</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSops.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  No SOPs found
                </td>
              </tr>
            ) : (
              filteredSops.map((sop, idx) => {
                const needsTraining = sop.status === 'effective' && 
                  !sop.trainingRecords.some(tr => tr.userId === currentUser.name && tr.version === sop.version);
                const needsReview = sop.nextReviewDate && new Date(sop.nextReviewDate) < new Date();

                return (
                  <React.Fragment key={sop.id}>
                    <tr className={`border-b hover:bg-white/40 ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                      <td className="py-2 px-2 font-mono text-xs">{sop.sopNumber}</td>
                      <td className="py-2 px-2 text-xs">{sop.title}</td>
                      <td className="py-2 px-2 text-xs font-semibold">v{sop.version}</td>
                      <td className="py-2 px-2 text-xs">{sop.department}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          sop.status === 'effective' ? 'bg-green-100 text-green-800' :
                          sop.status === 'in_review' ? 'bg-blue-100 text-blue-800' :
                          sop.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sop.status}
                        </span>
                        {needsReview && (
                          <AlertCircle className="w-3 h-3 text-red-600 inline ml-1" title="Needs periodic review" />
                        )}
                      </td>
                      <td className="py-2 px-2 text-xs">
                        {sop.effectiveDate ? new Date(sop.effectiveDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setExpandedSop(expandedSop === sop.id ? null : sop.id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {expandedSop === sop.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          {needsTraining && (
                            <button
                              onClick={() => acknowledgeSOP(sop.id)}
                              className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600"
                              title="Acknowledge training"
                            >
                              Acknowledge
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {expandedSop === sop.id && (
                      <tr>
                        <td colSpan="7" className="py-4 px-4 bg-white/60">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-semibold mb-1">Purpose:</p>
                                <p className="text-gray-700">{sop.purpose}</p>
                              </div>
                              <div>
                                <p className="font-semibold mb-1">Scope:</p>
                                <p className="text-gray-700">{sop.scope}</p>
                              </div>
                            </div>

                            <div>
                              <p className="font-semibold mb-2 text-sm">Procedure:</p>
                              <div className="bg-gray-50 p-3 rounded font-mono text-xs whitespace-pre-wrap">
                                {sop.content}
                              </div>
                            </div>

                            {/* Approval Workflow */}
                            <div>
                              <p className="font-semibold mb-2 text-sm">Approval Workflow:</p>
                              <div className="space-y-2">
                                {sop.approvalWorkflow.map((step, sidx) => (
                                  <div key={sidx} className="flex items-center space-x-3">
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
                                        <span className="text-white text-xs">{sidx + 1}</span>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold">{step.step} ({step.role})</p>
                                      {step.approver && (
                                        <p className="text-xs text-gray-600">
                                          By: {step.approver} on {new Date(step.date).toLocaleString()}
                                        </p>
                                      )}
                                    </div>
                                    {step.status === 'active' && (currentUser.role === step.role || currentUser.role === 'Admin') && (
                                      <button
                                        onClick={() => approveSOPStep(sop.id, sidx)}
                                        className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                      >
                                        Approve
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Training Records */}
                            {sop.trainingRecords.length > 0 && (
                              <div>
                                <p className="font-semibold mb-2 text-sm">Training Records ({sop.trainingRecords.length}):</p>
                                <div className="bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">
                                  {sop.trainingRecords.map((tr, idx) => (
                                    <div key={idx} className="text-xs py-1">
                                      {tr.userId} ({tr.role}) - v{tr.version} - {new Date(tr.acknowledgedDate).toLocaleString()}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex space-x-2 pt-3 border-t">
                              {sop.status === 'effective' && (
                                <button
                                  onClick={() => reviseSOPVersion(sop.id)}
                                  className="text-sm bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                                >
                                  Create Revision
                                </button>
                              )}
                              <button
                                className="text-sm bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 flex items-center space-x-1"
                              >
                                <Download className="w-3 h-3" />
                                <span>Export PDF</span>
                              </button>
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
