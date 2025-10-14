import React, { useState } from 'react';
import { Plus, FileCheck, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, Shield, Download } from 'lucide-react';

export default function Validation({
  validations,
  setValidations,
  equipment,
  workflows,
  formulas,
  batches,
  currentUser,
  addAuditEntry,
  showESignature,
  language = 'en'
}) {
  const [expandedValidation, setExpandedValidation] = useState(null);
  const [showNewValidation, setShowNewValidation] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const createValidation = (formData) => {
    const newValidation = {
      id: `VAL-${Date.now()}`,
      title: formData.get('title'),
      type: formData.get('type'),
      validationType: formData.get('validationType'), // IQ, OQ, PQ, Process
      relatedItem: formData.get('relatedItem'),
      relatedItemType: formData.get('relatedItemType'), // equipment, process, method
      initiator: currentUser.name,
      initiatedDate: new Date().toISOString(),
      status: 'protocol_development',
      targetCompletionDate: formData.get('targetDate'),
      protocol: {
        approved: false,
        approvedBy: null,
        approvedDate: null,
        version: '1.0'
      },
      executionSteps: generateExecutionSteps(formData.get('validationType')),
      testResults: [],
      deviations: [],
      conclusion: null,
      revalidationDue: null,
      approvers: []
    };

    setValidations(prev => [...prev, newValidation]);
    addAuditEntry("Validation Created", `${newValidation.id}: ${newValidation.title}`);
    setShowNewValidation(false);
  };

  const generateExecutionSteps = (type) => {
    const steps = {
      'IQ': [
        { id: 1, name: 'Verify equipment delivery documentation', status: 'pending', completedBy: null, date: null },
        { id: 2, name: 'Check equipment specifications against purchase order', status: 'pending', completedBy: null, date: null },
        { id: 3, name: 'Verify installation location meets requirements', status: 'pending', completedBy: null, date: null },
        { id: 4, name: 'Verify utilities (power, water, HVAC)', status: 'pending', completedBy: null, date: null },
        { id: 5, name: 'Review equipment manuals and drawings', status: 'pending', completedBy: null, date: null },
        { id: 6, name: 'Verify calibration certificates', status: 'pending', completedBy: null, date: null }
      ],
      'OQ': [
        { id: 1, name: 'Verify all IQ requirements completed', status: 'pending', completedBy: null, date: null },
        { id: 2, name: 'Test equipment at minimum operating parameters', status: 'pending', completedBy: null, date: null },
        { id: 3, name: 'Test equipment at maximum operating parameters', status: 'pending', completedBy: null, date: null },
        { id: 4, name: 'Test all safety interlocks', status: 'pending', completedBy: null, date: null },
        { id: 5, name: 'Test alarm systems', status: 'pending', completedBy: null, date: null },
        { id: 6, name: 'Verify data logging and recording', status: 'pending', completedBy: null, date: null }
      ],
      'PQ': [
        { id: 1, name: 'Verify all OQ requirements completed', status: 'pending', completedBy: null, date: null },
        { id: 2, name: 'Execute 3 consecutive successful production batches', status: 'pending', completedBy: null, date: null },
        { id: 3, name: 'Monitor process parameters for all runs', status: 'pending', completedBy: null, date: null },
        { id: 4, name: 'Collect and test product samples', status: 'pending', completedBy: null, date: null },
        { id: 5, name: 'Review yield data', status: 'pending', completedBy: null, date: null },
        { id: 6, name: 'Statistical analysis of results', status: 'pending', completedBy: null, date: null }
      ],
      'Process': [
        { id: 1, name: 'Define critical process parameters (CPP)', status: 'pending', completedBy: null, date: null },
        { id: 2, name: 'Execute worst-case challenge runs', status: 'pending', completedBy: null, date: null },
        { id: 3, name: 'Execute 3 validation batches at target parameters', status: 'pending', completedBy: null, date: null },
        { id: 4, name: 'In-process testing for all validation batches', status: 'pending', completedBy: null, date: null },
        { id: 5, name: 'Final product testing', status: 'pending', completedBy: null, date: null },
        { id: 6, name: 'Statistical process capability analysis', status: 'pending', completedBy: null, date: null }
      ]
    };
    return steps[type] || steps['Process'];
  };

  const approveProtocol = (validationId) => {
    showESignature(
      'Approve Validation Protocol',
      `Approve protocol for ${validationId}`,
      (signature) => {
        setValidations(prev => prev.map(v => {
          if (v.id === validationId) {
            return {
              ...v,
              protocol: {
                ...v.protocol,
                approved: true,
                approvedBy: signature.signedBy,
                approvedDate: signature.timestamp,
                signature: signature
              },
              status: 'execution'
            };
          }
          return v;
        }));
        addAuditEntry("Validation Protocol Approved", `${validationId} approved by ${signature.signedBy}`);
      }
    );
  };

  const executeStep = (validationId, stepId, results) => {
    showESignature(
      'Complete Validation Step',
      `Complete step ${stepId} for ${validationId}`,
      (signature) => {
        setValidations(prev => prev.map(v => {
          if (v.id === validationId) {
            const updatedSteps = v.executionSteps.map(step => {
              if (step.id === stepId) {
                return {
                  ...step,
                  status: 'completed',
                  completedBy: signature.signedBy,
                  date: signature.timestamp,
                  results: results,
                  signature: signature
                };
              }
              return step;
            });

            const allCompleted = updatedSteps.every(s => s.status === 'completed');
            
            return {
              ...v,
              executionSteps: updatedSteps,
              status: allCompleted ? 'review' : 'execution'
            };
          }
          return v;
        }));
        addAuditEntry("Validation Step Completed", `${validationId} - Step ${stepId} by ${signature.signedBy}`);
      }
    );
  };

  const addTestResult = (validationId, testData) => {
    setValidations(prev => prev.map(v => {
      if (v.id === validationId) {
        return {
          ...v,
          testResults: [...v.testResults, {
            id: Date.now(),
            ...testData,
            recordedDate: new Date().toISOString()
          }]
        };
      }
      return v;
    }));
  };

  const finalizeValidation = (validationId, conclusion, revalidationMonths) => {
    showESignature(
      'Finalize Validation',
      `Approve validation report for ${validationId}`,
      (signature) => {
        const revalidationDate = new Date();
        revalidationDate.setMonth(revalidationDate.getMonth() + parseInt(revalidationMonths));

        setValidations(prev => prev.map(v => {
          if (v.id === validationId) {
            return {
              ...v,
              status: 'completed',
              conclusion: {
                text: conclusion,
                approvedBy: signature.signedBy,
                approvedDate: signature.timestamp,
                signature: signature
              },
              revalidationDue: revalidationDate.toISOString(),
              completedDate: new Date().toISOString()
            };
          }
          return v;
        }));
        addAuditEntry("Validation Completed", `${validationId} finalized by ${signature.signedBy}`);
      }
    );
  };

  const exportValidationReport = (validation) => {
    let content = `VALIDATION REPORT - ${validation.id}\n\n`;
    content += `Title: ${validation.title}\n`;
    content += `Type: ${validation.validationType}\n`;
    content += `Status: ${validation.status}\n`;
    content += `Initiated: ${new Date(validation.initiatedDate).toLocaleDateString()}\n`;
    content += `Initiated By: ${validation.initiator}\n\n`;

    content += `--- PROTOCOL INFORMATION ---\n`;
    content += `Version: ${validation.protocol.version}\n`;
    content += `Approved: ${validation.protocol.approved ? 'Yes' : 'No'}\n`;
    if (validation.protocol.approved) {
      content += `Approved By: ${validation.protocol.approvedBy}\n`;
      content += `Approved Date: ${new Date(validation.protocol.approvedDate).toLocaleString()}\n`;
    }

    content += `\n--- EXECUTION STEPS ---\n`;
    validation.executionSteps.forEach((step, idx) => {
      content += `\nStep ${idx + 1}: ${step.name}\n`;
      content += `Status: ${step.status}\n`;
      if (step.completedBy) {
        content += `Completed By: ${step.completedBy}\n`;
        content += `Date: ${new Date(step.date).toLocaleString()}\n`;
        if (step.results) content += `Results: ${step.results}\n`;
      }
    });

    if (validation.testResults.length > 0) {
      content += `\n--- TEST RESULTS ---\n`;
      validation.testResults.forEach((test, idx) => {
        content += `Test ${idx + 1}: ${test.parameter}\n`;
        content += `Result: ${test.result} ${test.unit}\n`;
        content += `Spec: ${test.min} - ${test.max}\n`;
        content += `Status: ${test.pass ? 'PASS' : 'FAIL'}\n\n`;
      });
    }

    if (validation.conclusion) {
      content += `\n--- CONCLUSION ---\n`;
      content += `${validation.conclusion.text}\n`;
      content += `Approved By: ${validation.conclusion.approvedBy}\n`;
      content += `Date: ${new Date(validation.conclusion.approvedDate).toLocaleString()}\n`;
    }

    if (validation.revalidationDue) {
      content += `\nRevalidation Due: ${new Date(validation.revalidationDue).toLocaleDateString()}\n`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Validation_Report_${validation.id}.txt`;
    a.click();
    addAuditEntry("Validation Report Exported", `Report for ${validation.id} exported`);
  };

  const filteredValidations = validations.filter(v => {
    if (filterStatus === 'all') return true;
    return v.status === filterStatus;
  });

  const stats = {
    total: validations.length,
    inProgress: validations.filter(v => v.status === 'execution').length,
    dueRevalidation: validations.filter(v => {
      if (!v.revalidationDue) return false;
      return new Date(v.revalidationDue) < new Date();
    }).length,
    completed: validations.filter(v => v.status === 'completed').length
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <Shield className="w-6 h-6 mr-2" />
          Validation Management
        </h2>
        <button 
          onClick={() => setShowNewValidation(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Validation</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-blue-700">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Validations</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats.inProgress}</div>
          <div className="text-sm text-gray-600">In Execution</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-red-600">{stats.dueRevalidation}</div>
          <div className="text-sm text-gray-600">Due Revalidation</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      {showNewValidation && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Create New Validation</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            createValidation(new FormData(e.target));
          }}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input
                  name="title"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="e.g., Mixer-01 Installation Qualification"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Validation Type</label>
                <select name="validationType" className="border rounded px-3 py-2 w-full" required>
                  <option value="IQ">IQ - Installation Qualification</option>
                  <option value="OQ">OQ - Operational Qualification</option>
                  <option value="PQ">PQ - Performance Qualification</option>
                  <option value="Process">Process Validation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Type Category</label>
                <select name="type" className="border rounded px-3 py-2 w-full" required>
                  <option value="Equipment">Equipment Qualification</option>
                  <option value="Process">Process Validation</option>
                  <option value="Method">Analytical Method Validation</option>
                  <option value="Cleaning">Cleaning Validation</option>
                  <option value="Computer">Computer System Validation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Related Item Type</label>
                <select name="relatedItemType" className="border rounded px-3 py-2 w-full" required>
                  <option value="equipment">Equipment</option>
                  <option value="process">Process/Workflow</option>
                  <option value="method">Method</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Related Item ID</label>
                <input
                  name="relatedItem"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="e.g., Mixer-01 or WF-001"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Target Completion Date</label>
                <input
                  name="targetDate"
                  type="date"
                  required
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">Create Validation</button>
              <button 
                type="button" 
                onClick={() => setShowNewValidation(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Validations List */}
      <div className="glass-card">
        <div className="flex items-center space-x-4 mb-4">
          <label className="text-sm font-semibold">Status:</label>
          <select 
            className="border rounded px-3 py-1 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="protocol_development">Protocol Development</option>
            <option value="execution">Execution</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs">Validation ID</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Title</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Type</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Status</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Progress</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredValidations.map((validation, idx) => {
              const completedSteps = validation.executionSteps.filter(s => s.status === 'completed').length;
              const totalSteps = validation.executionSteps.length;
              const progress = Math.round((completedSteps / totalSteps) * 100);

              return (
                <React.Fragment key={validation.id}>
                  <tr className={`border-b hover:bg-white/40 ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                    <td className="py-2 px-2 font-mono text-xs">{validation.id}</td>
                    <td className="py-2 px-2 text-xs">{validation.title}</td>
                    <td className="py-2 px-2 text-xs">{validation.validationType}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        validation.status === 'completed' ? 'bg-green-100 text-green-800' :
                        validation.status === 'execution' ? 'bg-blue-100 text-blue-800' :
                        validation.status === 'review' ? 'bg-purple-100 text-purple-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {validation.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{width: `${progress}%`}}
                          />
                        </div>
                        <span className="text-xs">{progress}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => setExpandedValidation(expandedValidation === validation.id ? null : validation.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {expandedValidation === validation.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </td>
                  </tr>

                  {expandedValidation === validation.id && (
                    <tr>
                      <td colSpan="6" className="py-4 px-4 bg-white/60">
                        <div className="space-y-4">
                          {/* Protocol Info */}
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm font-semibold mb-2">Protocol Information</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>Version: {validation.protocol.version}</div>
                              <div>Approved: {validation.protocol.approved ? 'Yes' : 'No'}</div>
                              {validation.protocol.approved && (
                                <>
                                  <div>Approved By: {validation.protocol.approvedBy}</div>
                                  <div>Date: {new Date(validation.protocol.approvedDate).toLocaleDateString()}</div>
                                </>
                              )}
                            </div>
                            {!validation.protocol.approved && validation.status === 'protocol_development' && (
                              <button
                                onClick={() => approveProtocol(validation.id)}
                                className="mt-2 text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                              >
                                Approve Protocol
                              </button>
                            )}
                          </div>

                          {/* Execution Steps */}
                          {validation.status !== 'protocol_development' && (
                            <div>
                              <p className="text-sm font-semibold mb-2">Execution Steps:</p>
                              <div className="space-y-2">
                                {validation.executionSteps.map((step) => (
                                  <div key={step.id} className={`p-2 rounded border ${
                                    step.status === 'completed' ? 'bg-green-50 border-green-300' :
                                    'bg-white border-gray-200'
                                  }`}>
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          {step.status === 'completed' ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                          ) : (
                                            <Clock className="w-4 h-4 text-gray-400" />
                                          )}
                                          <p className="text-xs font-semibold">{step.name}</p>
                                        </div>
                                        {step.completedBy && (
                                          <p className="text-xs text-gray-600 ml-6">
                                            By: {step.completedBy} on {new Date(step.date).toLocaleDateString()}
                                          </p>
                                        )}
                                        {step.results && (
                                          <p className="text-xs text-gray-700 ml-6 mt-1">Results: {step.results}</p>
                                        )}
                                      </div>
                                      {step.status === 'pending' && validation.status === 'execution' && (
                                        <button
                                          onClick={() => {
                                            const results = prompt("Enter step results/observations:");
                                            if (results) executeStep(validation.id, step.id, results);
                                          }}
                                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                        >
                                          Complete
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Finalize Validation */}
                          {validation.status === 'review' && !validation.conclusion && (
                            <div className="bg-purple-50 p-3 rounded">
                              <p className="text-sm font-semibold mb-2">Finalize Validation</p>
                              <button
                                onClick={() => {
                                  const conclusion = prompt("Enter validation conclusion:");
                                  const months = prompt("Revalidation interval (months):", "36");
                                  if (conclusion && months) {
                                    finalizeValidation(validation.id, conclusion, months);
                                  }
                                }}
                                className="text-sm bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                              >
                                Approve & Finalize
                              </button>
                            </div>
                          )}

                          {/* Conclusion */}
                          {validation.conclusion && (
                            <div className="bg-green-50 p-3 rounded">
                              <p className="text-sm font-semibold mb-2">Validation Conclusion:</p>
                              <p className="text-xs text-gray-700 mb-2">{validation.conclusion.text}</p>
                              <div className="text-xs text-gray-600">
                                <p>Approved By: {validation.conclusion.approvedBy}</p>
                                <p>Date: {new Date(validation.conclusion.approvedDate).toLocaleDateString()}</p>
                                {validation.revalidationDue && (
                                  <p className="text-orange-600 font-semibold mt-1">
                                    Revalidation Due: {new Date(validation.revalidationDue).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex space-x-2 pt-3 border-t">
                            {validation.status === 'completed' && (
                              <button
                                onClick={() => exportValidationReport(validation)}
                                className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center space-x-1"
                              >
                                <Download className="w-3 h-3" />
                                <span>Export Report</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}