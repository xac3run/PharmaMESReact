import React, { useState } from 'react';
import { FileCheck, AlertCircle, CheckCircle, XCircle, Download, Clock, Package, RotateCcw, AlertTriangle, Lock, PlayCircle } from 'lucide-react';

export default function BatchRelease({ 
  batches,
  setBatches,
  workflows,
  deviations = [],
  formulas = [],
  equipment = [],
  workStations = [],
  currentUser,
  releaseBatch,
  showESignature,
  addAuditEntry,
  createStabilityStudy,
  setDeviations
}) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [reworkBatchId, setReworkBatchId] = useState(null);

  // Get batches for disposition (completed, under_review, quarantine, investigating)
  const getBatchesForDisposition = () => {
    return batches.filter(b => 
      ['completed', 'under_review', 'quarantine', 'investigating'].includes(b.status)
    );
  };

  const dispositionBatches = getBatchesForDisposition();
  const filteredBatches = dispositionBatches.filter(batch => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'awaiting') return !batch.disposition;
    if (filterStatus === 'released') return batch.disposition?.decision === 'release';
    if (filterStatus === 'rejected') return batch.disposition?.decision === 'reject';
    if (filterStatus === 'quarantine') return batch.status === 'quarantine' || batch.disposition?.decision === 'quarantine';
    if (filterStatus === 'investigating') return batch.status === 'investigating' || batch.disposition?.decision === 'investigate';
    return true;
  });

  // Statistics
  const stats = {
    total: dispositionBatches.length,
    awaiting: dispositionBatches.filter(b => !b.disposition).length,
    released: dispositionBatches.filter(b => b.disposition?.decision === 'release').length,
    rejected: dispositionBatches.filter(b => b.disposition?.decision === 'reject').length,
    quarantine: dispositionBatches.filter(b => b.status === 'quarantine' || b.disposition?.decision === 'quarantine').length,
    withDeviations: dispositionBatches.filter(b => b.hasDeviations).length
  };

  // Auto-check conditions for release
  const getReleasabilityChecks = (batch) => {
    const workflow = workflows?.find(w => w.id === batch.workflowId);
    const batchDeviations = deviations?.filter(d => d.relatedBatch === batch.id) || [];
    
    const checks = {
      allStepsCompleted: {
        status: batch.history?.length === workflow?.steps?.length,
        label: 'All Manufacturing Steps Completed',
        details: `${batch.history?.length || 0}/${workflow?.steps?.length || 0} steps completed`
      },
      qcTestsPassed: {
        status: batch.qcResults?.every(r => r.pass) || false,
        label: 'All QC Tests Passed',
        details: batch.qcResults ? `${batch.qcResults.filter(r => r.pass).length}/${batch.qcResults.length} tests passed` : 'No QC results'
      },
      noDeviations: {
        status: !batch.hasDeviations,
        label: 'No Open Deviations',
        details: batch.hasDeviations ? `${batchDeviations.length} deviations detected` : 'No deviations'
      },
      deviationsClosed: {
        status: batchDeviations.every(d => d.status === 'closed'),
        label: 'All Deviations Closed',
        details: `${batchDeviations.filter(d => d.status === 'closed').length}/${batchDeviations.length} closed`
      },
      yieldReconciled: {
        status: batch.yieldReconciliation?.status === 'reconciled',
        label: 'Yield Reconciled',
        details: batch.yieldReconciliation ? `${batch.yieldReconciliation.yieldPercentage?.toFixed(2)}%` : 'Not reconciled'
      },
      documentationComplete: {
        status: batch.history?.every(h => h.completedBy),
        label: 'All Steps Signed',
        details: 'All steps have electronic signatures'
      },
      cleaningVerified: {
        status: batch.cleaningVerified || false,
        label: 'Equipment Cleaning Verified',
        details: batch.cleaningVerified ? 'Verified' : 'Not verified'
      }
    };

    return checks;
  };

  // Make disposition decision
  const makeDisposition = (batchId, decision, reason) => {
    const batch = batches.find(b => b.id === batchId);
    const checks = getReleasabilityChecks(batch);
    
    // Validate decision based on batch state
    if (decision === 'release') {
      const allChecksPassed = Object.values(checks).every(c => c.status);
      if (!allChecksPassed) {
        alert('Cannot release: Not all requirements met. Consider Quarantine or Investigation first.');
        return;
      }
    }

    showESignature(
      'Batch Disposition Decision',
      `${decision.toUpperCase()} - Batch ${batchId}`,
      (signature) => {
        const disposition = {
          decision,
          reason,
          decidedBy: signature.user,
          decidedAt: signature.timestamp,
          signature
        };

        let newStatus = batch.status;
        if (decision === 'release') {
          newStatus = 'released';
          
          // Generate CoA
          const formula = formulas.find(f => f.id === batch.formulaId);
          const coaData = {
            batchNumber: batch.id,
            product: formula?.productName,
            articleNumber: formula?.articleNumber,
            formulaVersion: formula?.version,
            manufacturingDate: batch.startedAt,
            expiryDate: calculateExpiryDate(batch.startedAt, 24),
            quantity: batch.actualYield || batch.targetQuantity,
            unit: 'units',
            qcResults: batch.qcResults || [],
            releaseDate: signature.timestamp,
            releasedBy: signature.user
          };

          // Update batch with release info
          setBatches(prev => prev.map(b => 
            b.id === batchId ? {
              ...b,
              disposition,
              status: newStatus,
              releaseInfo: {
                releasedBy: signature.user,
                releasedAt: signature.timestamp,
                signature,
                certificateOfAnalysis: coaData
              }
            } : b
          ));

          // Create stability study
          if (createStabilityStudy) {
            const stabilityData = {
              batchId: batch.id,
              product: formula?.productName,
              startDate: new Date().toISOString(),
              conditions: [
                { id: 1, name: '25°C/60%RH', type: 'long_term', temperature: 25, humidity: 60 },
                { id: 2, name: '40°C/75%RH', type: 'accelerated', temperature: 40, humidity: 75 }
              ],
              duration: 24,
              pullSchedule: [0, 3, 6, 12, 18, 24],
              status: 'active',
              initiatedBy: signature.user,
              initiatedDate: signature.timestamp
            };
            createStabilityStudy(stabilityData);
          }
        } else if (decision === 'reject') {
          newStatus = 'rejected';
          setBatches(prev => prev.map(b => 
            b.id === batchId ? { ...b, disposition, status: newStatus } : b
          ));
        } else if (decision === 'quarantine') {
          newStatus = 'quarantine';
          setBatches(prev => prev.map(b => 
            b.id === batchId ? { ...b, disposition, status: newStatus } : b
          ));
        } else if (decision === 'investigate') {
          newStatus = 'investigating';
          setBatches(prev => prev.map(b => 
            b.id === batchId ? { ...b, disposition, status: newStatus } : b
          ));
        }

        addAuditEntry(
          "Batch Disposition",
          `Batch ${batchId} - ${decision.toUpperCase()}: ${reason}`,
          batchId
        );
      }
    );
  };

  // Handle disposition action
  const handleDispositionAction = (batch, decision) => {
    const reasons = {
      release: 'All quality criteria met, batch approved for distribution',
      reject: 'Does not meet quality specifications, batch rejected',
      quarantine: 'Additional testing or investigation required',
      investigate: 'Investigation required due to deviations or QC failures'
    };

    const reason = prompt(`Enter reason for ${decision}:`, reasons[decision]);
    if (!reason) return;

    makeDisposition(batch.id, decision, reason);
  };

  // Rework batch - return to specific step
  const handleRework = (batchId, stepIndex, reason) => {
    showESignature(
      'Batch Rework Authorization',
      `Rework batch ${batchId} from step ${stepIndex + 1}`,
      (signature) => {
        const batch = batches.find(b => b.id === batchId);
        const workflow = workflows.find(w => w.id === batch.workflowId);
        const steps = workflow?.steps || [];

        if (stepIndex < 0 || stepIndex >= steps.length) {
          alert('Invalid step index');
          return;
        }

        // Remove history after the step
        const newHistory = batch.history.slice(0, stepIndex);
        const newMaterialConsumption = batch.materialConsumption.filter(mc => 
          newHistory.some(h => h.stepId === mc.stepId)
        );

        setBatches(prev => prev.map(b => 
          b.id === batchId ? {
            ...b,
            status: 'in_progress',
            history: newHistory,
            materialConsumption: newMaterialConsumption,
            currentStep: steps[stepIndex].id,
            currentStepIndex: stepIndex,
            progress: Math.round((stepIndex / steps.length) * 100),
            reworkInfo: {
              reworkedAt: signature.timestamp,
              reworkedBy: signature.user,
              reason,
              fromStep: stepIndex + 1,
              signature
            },
            disposition: null // Clear previous disposition
          } : b
        ));

        addAuditEntry(
          "Batch Rework",
          `Batch ${batchId} returned to step ${stepIndex + 1} for rework. Reason: ${reason}`,
          batchId
        );

        setShowReworkModal(false);
        setReworkBatchId(null);
      }
    );
  };

  const calculateExpiryDate = (manufacturingDate, monthsShelfLife) => {
    const date = new Date(manufacturingDate);
    date.setMonth(date.getMonth() + monthsShelfLife);
    return date.toISOString().split('T')[0];
  };

  const exportCoAPDF = (batch) => {
    const coaData = batch.releaseInfo?.certificateOfAnalysis;
    if (!coaData) {
      alert('No Certificate of Analysis available');
      return;
    }

    let content = `CERTIFICATE OF ANALYSIS\n\n`;
    content += `Batch Number: ${coaData.batchNumber}\n`;
    content += `Product: ${coaData.product}\n`;
    content += `Article Number: ${coaData.articleNumber}\n`;
    content += `Formula Version: ${coaData.formulaVersion}\n`;
    content += `Manufacturing Date: ${new Date(coaData.manufacturingDate).toLocaleDateString()}\n`;
    content += `Expiry Date: ${coaData.expiryDate}\n`;
    content += `Quantity: ${coaData.quantity} ${coaData.unit}\n`;
    content += `\n--- QC TEST RESULTS ---\n`;
    coaData.qcResults.forEach(qc => {
      content += `${qc.test}: ${qc.result} ${qc.unit} (Spec: ${qc.min}-${qc.max}) - ${qc.pass ? 'PASS' : 'FAIL'}\n`;
    });
    content += `\nReleased By: ${coaData.releasedBy}\n`;
    content += `Release Date: ${new Date(coaData.releaseDate).toLocaleString()}\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CoA_${batch.id}.txt`;
    a.click();
    addAuditEntry("CoA Exported", `Certificate of Analysis exported for batch ${batch.id}`, batch.id);
  };

  const ReworkModal = ({ batch }) => {
    const [selectedStep, setSelectedStep] = useState(0);
    const [reworkReason, setReworkReason] = useState('');
    
    const workflow = workflows.find(w => w.id === batch.workflowId);
    const steps = workflow?.steps || [];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="glass-card max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center">
              <RotateCcw className="w-5 h-5 mr-2" />
              Rework Batch {batch.id}
            </h3>
            <button onClick={() => setShowReworkModal(false)} className="text-gray-500 hover:text-gray-700">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Select Step to Return To:</label>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
                {steps.map((step, idx) => {
                  const completed = batch.history?.find(h => h.stepId === step.id);
                  return (
                    <div 
                      key={step.id}
                      className={`p-3 rounded border-2 cursor-pointer ${
                        selectedStep === idx 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedStep(idx)}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">Step {idx + 1}</span>
                        <span className="font-semibold">{step.name}</span>
                        {completed && <CheckCircle className="w-4 h-4 text-green-600" />}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{step.type}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Rework Reason (Required):</label>
              <textarea
                className="w-full border rounded px-3 py-2"
                rows="4"
                value={reworkReason}
                onChange={(e) => setReworkReason(e.target.value)}
                placeholder="Enter detailed reason for rework..."
              />
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-300 rounded">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-900">Rework Warning</p>
                  <p className="text-yellow-800">
                    This will delete all execution history from step {selectedStep + 1} onwards. 
                    Material consumption will be recalculated. This action requires electronic signature.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  if (!reworkReason.trim()) {
                    alert('Please enter rework reason');
                    return;
                  }
                  handleRework(batch.id, selectedStep, reworkReason);
                }}
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                <Lock className="w-4 h-4" />
                <span>Authorize Rework & E-Sign</span>
              </button>
              <button
                onClick={() => setShowReworkModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <FileCheck className="w-6 h-6 mr-2" />
          Batch Release & Disposition
        </h2>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-6 gap-3">
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
          <div className="text-xs text-gray-600">Total Batches</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.awaiting}</div>
          <div className="text-xs text-gray-600">Awaiting Decision</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-green-600">{stats.released}</div>
          <div className="text-xs text-gray-600">Released</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          <div className="text-xs text-gray-600">Rejected</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.quarantine}</div>
          <div className="text-xs text-gray-600">Quarantine</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.withDeviations}</div>
          <div className="text-xs text-gray-600">With Deviations</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-semibold">Filter:</label>
          <select 
            className="border rounded px-3 py-1 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Batches</option>
            <option value="awaiting">Awaiting Decision</option>
            <option value="released">Released</option>
            <option value="rejected">Rejected</option>
            <option value="quarantine">Quarantine</option>
            <option value="investigating">Investigating</option>
          </select>
        </div>
      </div>

      {/* Batches Table */}
      <div className="glass-card">
        <table className="w-full text-sm">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs">Batch ID</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Product</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Status</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Issues</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Completed</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBatches.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No batches requiring disposition
                </td>
              </tr>
            ) : (
              filteredBatches.map((batch, idx) => {
                const formula = formulas.find(f => f.id === batch.formulaId);
                const batchDeviations = deviations.filter(d => d.relatedBatch === batch.id);
                const checks = getReleasabilityChecks(batch);
                const canRelease = Object.values(checks).every(c => c.status) && 
                                  (currentUser.role === 'QA' || currentUser.role === 'Admin');
                const isExpanded = expandedBatch === batch.id;

                return (
                  <React.Fragment key={batch.id}>
                    <tr 
                      className={`border-b hover:bg-white/40 cursor-pointer ${idx % 2 === 0 ? 'bg-white/20' : ''}`}
                      onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}
                    >
                      <td className="py-2 px-2 font-mono text-xs font-semibold">{batch.id}</td>
                      <td className="py-2 px-2 text-xs">{formula?.productName}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          batch.status === 'released' ? 'bg-green-100 text-green-800' :
                          batch.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          batch.status === 'quarantine' ? 'bg-orange-100 text-orange-800' :
                          batch.status === 'investigating' ? 'bg-purple-100 text-purple-800' :
                          batch.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {batch.status.toUpperCase().replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center space-x-1">
                          {batch.hasDeviations && (
                            <span className="px-1 py-0.5 bg-red-100 text-red-800 rounded text-xs font-semibold">
                              {batchDeviations.length} DEV
                            </span>
                          )}
                          {batch.qcResults?.some(qc => !qc.pass) && (
                            <span className="px-1 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                              QC FAIL
                            </span>
                          )}
                          {!batch.hasDeviations && batch.qcResults?.every(qc => qc.pass) && (
                            <span className="px-1 py-0.5 bg-green-100 text-green-800 rounded text-xs font-semibold">
                              OK
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-xs">
                        {batch.completedAt ? new Date(batch.completedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-2 px-2">
                        {!batch.disposition ? (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!canRelease) {
                                  alert('Cannot release: Requirements not met or insufficient permissions');
                                  return;
                                }
                                handleDispositionAction(batch, 'release');
                              }}
                              disabled={!canRelease}
                              className={`p-1 rounded ${
                                canRelease 
                                  ? 'hover:bg-green-100 text-green-600' 
                                  : 'text-gray-400 cursor-not-allowed'
                              }`}
                              title="Release"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDispositionAction(batch, 'quarantine');
                              }}
                              className="p-1 hover:bg-yellow-100 rounded text-yellow-600"
                              title="Quarantine"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDispositionAction(batch, 'investigate');
                              }}
                              className="p-1 hover:bg-blue-100 rounded text-blue-600"
                              title="Investigate"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDispositionAction(batch, 'reject');
                              }}
                              className="p-1 hover:bg-red-100 rounded text-red-600"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReworkBatchId(batch.id);
                                setShowReworkModal(true);
                              }}
                              className="p-1 hover:bg-purple-100 rounded text-purple-600"
                              title="Rework"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            {batch.disposition.decision.toUpperCase()}
                          </div>
                        )}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan="6" className="p-4 bg-gray-50">
                          <div className="space-y-4">
                            {/* Release Checklist */}
                            <div>
                              <h4 className="font-semibold mb-3">Release Checklist</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(checks).map(([key, check]) => (
                                  <div key={key} className={`p-2 rounded border text-xs ${
                                    check.status ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                                  }`}>
                                    <div className="flex items-center space-x-2">
                                      {check.status ? (
                                        <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                                      ) : (
                                        <XCircle className="w-3 h-3 text-red-600 flex-shrink-0" />
                                      )}
                                      <div>
                                        <p className="font-semibold">{check.label}</p>
                                        <p className="text-gray-600">{check.details}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Deviations */}
                            {batch.hasDeviations && batchDeviations.length > 0 && (
                              <div className="p-3 bg-red-50 border border-red-300 rounded">
                                <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                                  <AlertTriangle className="w-4 h-4 mr-1" />
                                  Deviations ({batchDeviations.length})
                                </h4>
                                <div className="space-y-2">
                                  {batchDeviations.map(dev => (
                                    <div key={dev.id} className="text-xs bg-white p-2 rounded">
                                      <div className="font-semibold">{dev.id}: {dev.title}</div>
                                      <div className="text-gray-600">{dev.description}</div>
                                      <div className="mt-1">
                                        <span className={`px-2 py-0.5 rounded text-xs ${
                                          dev.status === 'closed' ? 'bg-green-100 text-green-800' :
                                          dev.status === 'open' ? 'bg-red-100 text-red-800' :
                                          'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          {dev.status.toUpperCase()}
                                        </span>
                                        </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* QC Results */}
                            {batch.qcResults && batch.qcResults.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2">QC Test Results</h4>
                                <table className="w-full text-xs">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="text-left p-2">Test</th>
                                      <th className="text-left p-2">Result</th>
                                      <th className="text-left p-2">Specification</th>
                                      <th className="text-left p-2">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {batch.qcResults.map((qc, idx) => (
                                      <tr key={idx} className="border-t">
                                        <td className="p-2">{qc.test}</td>
                                        <td className="p-2">{qc.result} {qc.unit}</td>
                                        <td className="p-2">{qc.min} - {qc.max}</td>
                                        <td className="p-2">
                                          <span className={`px-2 py-0.5 rounded text-xs ${
                                            qc.pass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                          }`}>
                                            {qc.pass ? 'PASS' : 'FAIL'}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Disposition Info */}
                            {batch.disposition && (
                              <div className="p-3 bg-blue-50 border border-blue-300 rounded">
                                <h4 className="font-semibold text-blue-800 mb-2">Disposition Information</h4>
                                <div className="text-xs space-y-1">
                                  <p><span className="font-semibold">Decision:</span> {batch.disposition.decision.toUpperCase()}</p>
                                  <p><span className="font-semibold">Decided By:</span> {batch.disposition.decidedBy}</p>
                                  <p><span className="font-semibold">Date:</span> {new Date(batch.disposition.decidedAt).toLocaleString()}</p>
                                  <p><span className="font-semibold">Reason:</span> {batch.disposition.reason}</p>
                                </div>
                              </div>
                            )}

                            {/* Release Info & CoA */}
                            {batch.releaseInfo && (
                              <div className="p-3 bg-green-50 border border-green-300 rounded">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-semibold text-green-800">Certificate of Analysis</h4>
                                  <button
                                    onClick={() => exportCoAPDF(batch)}
                                    className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center space-x-1"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Download CoA</span>
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div><span className="font-semibold">Released By:</span> {batch.releaseInfo.releasedBy}</div>
                                  <div><span className="font-semibold">Release Date:</span> {new Date(batch.releaseInfo.releasedAt).toLocaleString()}</div>
                                  <div><span className="font-semibold">Quantity:</span> {batch.releaseInfo.certificateOfAnalysis.quantity} {batch.releaseInfo.certificateOfAnalysis.unit}</div>
                                  <div><span className="font-semibold">Expiry Date:</span> {batch.releaseInfo.certificateOfAnalysis.expiryDate}</div>
                                </div>
                              </div>
                            )}

                            {/* Rework History */}
                            {batch.reworkInfo && (
                              <div className="p-3 bg-purple-50 border border-purple-300 rounded">
                                <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                                  <RotateCcw className="w-4 h-4 mr-1" />
                                  Rework History
                                </h4>
                                <div className="text-xs space-y-1">
                                  <p><span className="font-semibold">Reworked By:</span> {batch.reworkInfo.reworkedBy}</p>
                                  <p><span className="font-semibold">Date:</span> {new Date(batch.reworkInfo.reworkedAt).toLocaleString()}</p>
                                  <p><span className="font-semibold">From Step:</span> {batch.reworkInfo.fromStep}</p>
                                  <p><span className="font-semibold">Reason:</span> {batch.reworkInfo.reason}</p>
                                </div>
                              </div>
                            )}

                            {/* Material Consumption */}
                            {batch.materialConsumption && batch.materialConsumption.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center">
                                  <Package className="w-4 h-4 mr-1" />
                                  Material Consumption
                                </h4>
                                <div className="space-y-1">
                                  {batch.materialConsumption.map((mc, idx) => (
                                    <div key={idx} className="flex justify-between text-xs p-2 bg-white rounded border">
                                      <span className="font-semibold">{mc.materialArticle}</span>
                                      <span>{mc.quantity} {mc.unit} (Lot: {mc.lotNumber})</span>
                                      {mc.hasDeviation && (
                                        <span className="text-red-600 font-semibold">⚠ DEVIATION</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Batch History Summary */}
                            {batch.history && batch.history.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2">Execution Summary</h4>
                                <div className="text-xs space-y-1">
                                  <p><span className="font-semibold">Started:</span> {new Date(batch.startedAt).toLocaleString()}</p>
                                  <p><span className="font-semibold">Completed:</span> {batch.completedAt ? new Date(batch.completedAt).toLocaleString() : 'In progress'}</p>
                                  <p><span className="font-semibold">Started By:</span> {batch.startedBy}</p>
                                  <p><span className="font-semibold">Steps Completed:</span> {batch.history.length}/{workflows.find(w => w.id === batch.workflowId)?.steps?.length || 0}</p>
                                  {batch.actualYield && (
                                    <p><span className="font-semibold">Actual Yield:</span> {batch.actualYield} units ({batch.yieldReconciliation?.yieldPercentage?.toFixed(2)}%)</p>
                                  )}
                                </div>
                              </div>
                            )}
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

      {/* Empty State */}
      {dispositionBatches.length === 0 && (
        <div className="glass-card text-center py-12">
          <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Batches for Disposition</h3>
          <p className="text-gray-500">Completed batches will appear here for release decision</p>
        </div>
      )}

      {/* Rework Modal */}
      {showReworkModal && reworkBatchId && (
        <ReworkModal batch={batches.find(b => b.id === reworkBatchId)} />
      )}

      {/* Help Section */}
      <div className="glass-card bg-blue-50 border border-blue-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-900 mb-1">Batch Disposition Guidelines</p>
            <ul className="text-blue-800 space-y-1 list-disc list-inside">
              <li><strong>Release:</strong> All quality criteria must be met. Generates CoA and initiates stability study.</li>
              <li><strong>Reject:</strong> Batch does not meet specifications and will be discarded.</li>
              <li><strong>Quarantine:</strong> Hold for additional testing or analysis before final decision.</li>
              <li><strong>Investigate:</strong> Requires investigation (mandatory for batches with deviations).</li>
              <li><strong>Rework:</strong> Return batch to specific step to correct issues.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}