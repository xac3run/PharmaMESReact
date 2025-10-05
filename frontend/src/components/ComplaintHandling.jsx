import React, { useState } from 'react';
import { MessageSquare, Plus, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock, TrendingUp, Link as LinkIcon } from 'lucide-react';

export default function ComplaintHandling({ 
  complaints,
  setComplaints,
  batches,
  formulas,
  currentUser,
  addAuditEntry,
  showESignature,
  capas,
  setCapas,
  language = 'en'
}) {
  const [expandedComplaint, setExpandedComplaint] = useState(null);
  const [showNewComplaint, setShowNewComplaint] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const createComplaint = (formData) => {
    const newComplaint = {
      id: `CPL-${Date.now()}`,
      complaintNumber: `C-${new Date().getFullYear()}-${String(complaints.length + 1).padStart(4, '0')}`,
      type: formData.get('type'), // customer, internal, regulatory
      category: formData.get('category'),
      severity: formData.get('severity'),
      source: formData.get('source'),
      customerName: formData.get('customerName') || null,
      customerContact: formData.get('customerContact') || null,
      productName: formData.get('productName'),
      batchNumber: formData.get('batchNumber') || null,
      complaintDescription: formData.get('description'),
      receivedDate: new Date().toISOString(),
      receivedBy: currentUser.name,
      status: 'received',
      targetCloseDate: formData.get('targetClose'),
      investigation: {
        startDate: null,
        investigator: null,
        findings: '',
        rootCause: '',
        productDefect: null, // true/false/null
        batchesAffected: [],
        completedDate: null,
        signature: null
      },
      correctiveAction: {
        description: '',
        responsiblePerson: null,
        targetDate: null,
        completedDate: null,
        signature: null
      },
      customerResponse: {
        responseDate: null,
        responseMethod: null, // email, phone, letter
        customerSatisfied: null,
        responseText: '',
        signature: null
      },
      linkedCapa: null,
      regulatoryReporting: {
        required: false,
        reportedTo: [],
        reportDate: null,
        referenceNumber: null
      },
      workflow: [
        { step: 'Receipt', status: 'completed', completedBy: currentUser.name, date: new Date().toISOString() },
        { step: 'Initial Assessment', status: 'pending', completedBy: null, date: null },
        { step: 'Investigation', status: 'pending', completedBy: null, date: null },
        { step: 'Corrective Action', status: 'pending', completedBy: null, date: null },
        { step: 'Customer Response', status: 'pending', completedBy: null, date: null },
        { step: 'Closure', status: 'pending', completedBy: null, date: null }
      ],
      trend: {
        relatedComplaints: [],
        pattern: null
      }
    };

    setComplaints(prev => [...prev, newComplaint]);
    addAuditEntry("Complaint Registered", `${newComplaint.complaintNumber}: ${newComplaint.productName}`);
    setShowNewComplaint(false);
  };

  const completeInitialAssessment = (complaintId) => {
    const severity = prompt("Confirm severity (minor/moderate/major/critical):");
    if (!severity) return;
    
    const regulatoryRequired = confirm("Does this require regulatory reporting?");

    showESignature(
      'Initial Assessment',
      `Complaint ${complaintId}`,
      (signature) => {
        setComplaints(prev => prev.map(c => {
          if (c.id === complaintId) {
            const workflow = [...c.workflow];
            workflow[1] = {
              ...workflow[1],
              status: 'completed',
              completedBy: signature.signedBy,
              date: signature.timestamp
            };
            workflow[2].status = 'active';

            return {
              ...c,
              severity: severity.toLowerCase(),
              regulatoryReporting: {
                ...c.regulatoryReporting,
                required: regulatoryRequired
              },
              workflow
            };
          }
          return c;
        }));
        addAuditEntry("Complaint Assessment", `${complaintId}: Severity ${severity}, Regulatory: ${regulatoryRequired}`);
      }
    );
  };

  const completeInvestigation = (complaintId) => {
    const findings = prompt("Investigation findings:");
    if (!findings) return;
    const rootCause = prompt("Root cause:");
    if (!rootCause) return;
    const isDefect = confirm("Is this a product defect?");

    showESignature(
      'Investigation Completion',
      `Complaint ${complaintId}`,
      (signature) => {
        setComplaints(prev => prev.map(c => {
          if (c.id === complaintId) {
            const workflow = [...c.workflow];
            workflow[2] = {
              ...workflow[2],
              status: 'completed',
              completedBy: signature.signedBy,
              date: signature.timestamp
            };
            workflow[3].status = 'active';

            return {
              ...c,
              investigation: {
                startDate: c.investigation.startDate || new Date().toISOString(),
                investigator: signature.signedBy,
                findings: findings,
                rootCause: rootCause,
                productDefect: isDefect,
                batchesAffected: c.batchNumber ? [c.batchNumber] : [],
                completedDate: signature.timestamp,
                signature: signature
              },
              workflow
            };
          }
          return c;
        }));
        addAuditEntry("Complaint Investigation", `${complaintId}: ${rootCause}`);
      }
    );
  };

  const addCorrectiveAction = (complaintId) => {
    const action = prompt("Corrective action description:");
    if (!action) return;
    const responsible = prompt("Responsible person:");
    const targetDate = prompt("Target completion date (YYYY-MM-DD):");

    showESignature(
      'Corrective Action',
      `Complaint ${complaintId}`,
      (signature) => {
        setComplaints(prev => prev.map(c => {
          if (c.id === complaintId) {
            const workflow = [...c.workflow];
            workflow[3] = {
              ...workflow[3],
              status: 'completed',
              completedBy: signature.signedBy,
              date: signature.timestamp
            };
            workflow[4].status = 'active';

            return {
              ...c,
              correctiveAction: {
                description: action,
                responsiblePerson: responsible || signature.signedBy,
                targetDate: targetDate,
                completedDate: signature.timestamp,
                signature: signature
              },
              workflow
            };
          }
          return c;
        }));
        addAuditEntry("Corrective Action Added", `${complaintId}: ${action}`);
      }
    );
  };

  const respondToCustomer = (complaintId) => {
    const responseText = prompt("Customer response text:");
    if (!responseText) return;
    const method = prompt("Response method (email/phone/letter):");
    const satisfied = confirm("Customer satisfied with response?");

    showESignature(
      'Customer Response',
      `Complaint ${complaintId}`,
      (signature) => {
        setComplaints(prev => prev.map(c => {
          if (c.id === complaintId) {
            const workflow = [...c.workflow];
            workflow[4] = {
              ...workflow[4],
              status: 'completed',
              completedBy: signature.signedBy,
              date: signature.timestamp
            };
            workflow[5].status = 'active';

            return {
              ...c,
              customerResponse: {
                responseDate: signature.timestamp,
                responseMethod: method || 'email',
                customerSatisfied: satisfied,
                responseText: responseText,
                signature: signature
              },
              workflow
            };
          }
          return c;
        }));
        addAuditEntry("Customer Response Sent", `${complaintId}: Method ${method}`);
      }
    );
  };

  const closeComplaint = (complaintId) => {
    showESignature(
      'Close Complaint',
      `Complaint ${complaintId}`,
      (signature) => {
        setComplaints(prev => prev.map(c => {
          if (c.id === complaintId) {
            const workflow = [...c.workflow];
            workflow[5] = {
              ...workflow[5],
              status: 'completed',
              completedBy: signature.signedBy,
              date: signature.timestamp
            };

            return {
              ...c,
              status: 'closed',
              closedBy: signature.signedBy,
              closedDate: signature.timestamp,
              workflow
            };
          }
          return c;
        }));
        addAuditEntry("Complaint Closed", `${complaintId} closed by ${signature.signedBy}`);
      }
    );
  };

  const linkToCAPA = (complaintId) => {
    const complaint = complaints.find(c => c.id === complaintId);
    
    const newCapa = {
      id: `CAPA-${Date.now()}`,
      title: `CAPA for Complaint ${complaint.complaintNumber}`,
      description: `Customer complaint: ${complaint.complaintDescription}\nRoot cause: ${complaint.investigation.rootCause}`,
      type: 'corrective',
      category: 'complaint',
      severity: complaint.severity,
      source: 'complaint',
      initiator: currentUser.name,
      initiatedDate: new Date().toISOString(),
      status: 'initiated',
      targetCloseDate: new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0],
      workflow: [
        { step: 'Initiation', status: 'completed', completedBy: currentUser.name, date: new Date().toISOString(), notes: `Linked to ${complaint.complaintNumber}` },
        { step: 'Investigation', status: 'pending', completedBy: null, date: null, notes: '' },
        { step: 'Root Cause Analysis', status: 'pending', completedBy: null, date: null, notes: '' },
        { step: 'Action Plan', status: 'pending', completedBy: null, date: null, notes: '' },
        { step: 'Implementation', status: 'pending', completedBy: null, date: null, notes: '' },
        { step: 'Effectiveness Check', status: 'pending', completedBy: null, date: null, notes: '' },
        { step: 'Closure', status: 'pending', completedBy: null, date: null, notes: '' }
      ],
      rootCause: complaint.investigation.rootCause,
      actionPlan: [],
      effectivenessCheck: null,
      relatedDeviations: [],
      relatedBatches: complaint.batchNumber ? [complaint.batchNumber] : []
    };

    setCapas(prev => [...prev, newCapa]);
    setComplaints(prev => prev.map(c => 
      c.id === complaintId ? { ...c, linkedCapa: newCapa.id } : c
    ));
    addAuditEntry("CAPA Created from Complaint", `${newCapa.id} created for ${complaint.complaintNumber}`);
    alert(`New CAPA created: ${newCapa.id}`);
  };

  const filteredComplaints = complaints.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterType !== 'all' && c.type !== filterType) return false;
    return true;
  });

  // Statistics
  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'received' || c.status === 'investigating').length,
    critical: complaints.filter(c => c.severity === 'critical').length,
    productDefects: complaints.filter(c => c.investigation.productDefect === true).length,
    closed: complaints.filter(c => c.status === 'closed').length,
    avgCloseDays: complaints.filter(c => c.closedDate).length > 0 
      ? Math.round(complaints.filter(c => c.closedDate).reduce((sum, c) => {
          const days = (new Date(c.closedDate) - new Date(c.receivedDate)) / (1000*60*60*24);
          return sum + days;
        }, 0) / complaints.filter(c => c.closedDate).length)
      : 0
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <MessageSquare className="w-6 h-6 mr-2 text-blue-600" />
          Complaint Handling System
        </h2>
        <button 
          onClick={() => setShowNewComplaint(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Register Complaint</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-6 gap-4">
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.open}</div>
          <div className="text-xs text-gray-600">Open</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          <div className="text-xs text-gray-600">Critical</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.productDefects}</div>
          <div className="text-xs text-gray-600">Defects</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-green-600">{stats.closed}</div>
          <div className="text-xs text-gray-600">Closed</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.avgCloseDays}</div>
          <div className="text-xs text-gray-600">Avg Days</div>
        </div>
      </div>

      {showNewComplaint && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Register New Complaint</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            createComplaint(new FormData(e.target));
          }}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Type</label>
                <select name="type" className="border rounded px-3 py-2 w-full" required>
                  <option value="customer">Customer Complaint</option>
                  <option value="internal">Internal Quality Issue</option>
                  <option value="regulatory">Regulatory/Authority</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Category</label>
                <select name="category" className="border rounded px-3 py-2 w-full" required>
                  <option value="quality">Product Quality</option>
                  <option value="contamination">Contamination</option>
                  <option value="packaging">Packaging Defect</option>
                  <option value="labeling">Labeling Error</option>
                  <option value="efficacy">Efficacy Issue</option>
                  <option value="adverse_event">Adverse Event</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Severity</label>
                <select name="severity" className="border rounded px-3 py-2 w-full" required>
                  <option value="minor">Minor</option>
                  <option value="moderate">Moderate</option>
                  <option value="major">Major</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Source</label>
                <select name="source" className="border rounded px-3 py-2 w-full" required>
                  <option value="customer">Customer</option>
                  <option value="distributor">Distributor</option>
                  <option value="healthcare">Healthcare Professional</option>
                  <option value="regulatory">Regulatory Authority</option>
                  <option value="internal">Internal Audit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Customer Name</label>
                <input
                  name="customerName"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Customer Contact</label>
                <input
                  name="customerContact"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Email/Phone"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Product Name</label>
                <input
                  name="productName"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Product affected"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Batch Number</label>
                <select name="batchNumber" className="border rounded px-3 py-2 w-full">
                  <option value="">Unknown/Not Applicable</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.id}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Complaint Description</label>
                <textarea
                  name="description"
                  required
                  rows="4"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Detailed description of the complaint..."
                />
              </div>
              <div>
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
              <button type="submit" className="btn-primary">Register Complaint</button>
              <button 
                type="button" 
                onClick={() => setShowNewComplaint(false)}
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
              <option value="received">Received</option>
              <option value="investigating">Investigating</option>
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
              <option value="customer">Customer</option>
              <option value="internal">Internal</option>
              <option value="regulatory">Regulatory</option>
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        <table className="w-full text-sm">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs">Complaint #</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Type</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Product</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Severity</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Status</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Received</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredComplaints.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  No complaints found
                </td>
              </tr>
            ) : (
              filteredComplaints.map((cpl, idx) => (
                <React.Fragment key={cpl.id}>
                  <tr className={`border-b hover:bg-white/40 ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                    <td className="py-2 px-2 font-mono text-xs">{cpl.complaintNumber}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        cpl.type === 'customer' ? 'bg-blue-100 text-blue-800' :
                        cpl.type === 'regulatory' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {cpl.type}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-xs">{cpl.productName}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        cpl.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        cpl.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                        cpl.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {cpl.severity}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        cpl.status === 'closed' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cpl.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-xs">{new Date(cpl.receivedDate).toLocaleDateString()}</td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => setExpandedComplaint(expandedComplaint === cpl.id ? null : cpl.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {expandedComplaint === cpl.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </td>
                  </tr>

                  {expandedComplaint === cpl.id && (
                    <tr>
                      <td colSpan="7" className="py-4 px-4 bg-white/60">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-semibold mb-1">Customer Information:</p>
                              <div className="text-sm space-y-1">
                                {cpl.customerName && <p><span className="font-semibold">Name:</span> {cpl.customerName}</p>}
                                {cpl.customerContact && <p><span className="font-semibold">Contact:</span> {cpl.customerContact}</p>}
                                <p><span className="font-semibold">Source:</span> {cpl.source}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-semibold mb-1">Product Information:</p>
                              <div className="text-sm space-y-1">
                                <p><span className="font-semibold">Product:</span> {cpl.productName}</p>
                                {cpl.batchNumber && <p><span className="font-semibold">Batch:</span> {cpl.batchNumber}</p>}
                                <p><span className="font-semibold">Category:</span> {cpl.category}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-semibold mb-1">Complaint Description:</p>
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{cpl.complaintDescription}</p>
                          </div>

                          {cpl.regulatoryReporting.required && (
                            <div className="bg-red-50 border border-red-300 rounded p-2">
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <p className="text-sm font-semibold text-red-900">Regulatory Reporting Required</p>
                              </div>
                            </div>
                          )}

                          {cpl.linkedCapa && (
                            <div className="flex items-center space-x-2 text-sm">
                              <LinkIcon className="w-4 h-4 text-green-600" />
                              <span className="font-semibold">Linked CAPA:</span>
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{cpl.linkedCapa}</span>
                            </div>
                          )}

                          {/* Workflow */}
                          <div>
                            <p className="text-sm font-semibold mb-2">Workflow Progress:</p>
                            <div className="space-y-2">
                              {cpl.workflow.map((step, idx) => (
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

                          {/* Investigation Results */}
                          {cpl.investigation.completedDate && (
                            <div className="bg-purple-50 p-3 rounded">
                              <p className="text-sm font-semibold mb-2">Investigation Results:</p>
                              <div className="text-sm space-y-1">
                                <p><span className="font-semibold">Findings:</span> {cpl.investigation.findings}</p>
                                <p><span className="font-semibold">Root Cause:</span> {cpl.investigation.rootCause}</p>
                                <p><span className="font-semibold">Product Defect:</span> {cpl.investigation.productDefect ? 'Yes' : 'No'}</p>
                              </div>
                            </div>
                          )}

                          {/* Customer Response */}
                          {cpl.customerResponse.responseDate && (
                            <div className="bg-blue-50 p-3 rounded">
                              <p className="text-sm font-semibold mb-2">Customer Response:</p>
                              <div className="text-sm space-y-1">
                                <p><span className="font-semibold">Method:</span> {cpl.customerResponse.responseMethod}</p>
                                <p><span className="font-semibold">Response:</span> {cpl.customerResponse.responseText}</p>
                                <p><span className="font-semibold">Customer Satisfied:</span> {cpl.customerResponse.customerSatisfied ? 'Yes' : 'No'}</p>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 pt-3 border-t">
                            {cpl.workflow[1].status === 'active' && (
                              <button
                                onClick={() => completeInitialAssessment(cpl.id)}
                                className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                              >
                                Complete Assessment
                              </button>
                            )}
                            {cpl.workflow[2].status === 'active' && (
                              <button
                                onClick={() => completeInvestigation(cpl.id)}
                                className="text-sm bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                              >
                                Complete Investigation
                              </button>
                            )}
                            {cpl.workflow[3].status === 'active' && (
                              <button
                                onClick={() => addCorrectiveAction(cpl.id)}
                                className="text-sm bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600"
                              >
                                Add Corrective Action
                              </button>
                            )}
                            {cpl.workflow[4].status === 'active' && (
                              <button
                                onClick={() => respondToCustomer(cpl.id)}
                                className="text-sm bg-teal-500 text-white px-3 py-1 rounded hover:bg-teal-600"
                              >
                                Respond to Customer
                              </button>
                            )}
                            {cpl.workflow[5].status === 'active' && (
                              <button
                                onClick={() => closeComplaint(cpl.id)}
                                className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                              >
                                Close Complaint
                              </button>
                            )}
                            {cpl.status !== 'closed' && !cpl.linkedCapa && cpl.investigation.completedDate && (
                              <button
                                onClick={() => linkToCAPA(cpl.id)}
                                className="text-sm bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600"
                              >
                                Create CAPA
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
