import React, { useState } from 'react';
import { FileCheck, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function BatchRelease({ 
  batch,
  workflows,
  deviations,
  yieldReconciliation,
  currentUser,
  releaseBatch,
  showESignature,
  addAuditEntry
}) {
  const [releaseChecklist, setReleaseChecklist] = useState({
    allStepsCompleted: false,
    qcTestsPassed: false,
    deviationsClosed: false,
    yieldReconciled: false,
    documentationComplete: false,
    cleaningVerified: false
  });

  if (!batch || batch.status !== 'completed') {
    return (
      <div className="glass-card text-center py-8">
        <p className="text-gray-600">Batch release only available for completed batches</p>
      </div>
    );
  }

  const workflow = workflows.find(w => w.id === batch.workflowId);
  const batchDeviations = deviations.filter(d => d.batchId === batch.id);
  
  // Auto-check conditions
  const checks = {
    allStepsCompleted: {
      status: batch.history.length === workflow?.steps.length,
      label: 'All Manufacturing Steps Completed',
      details: `${batch.history.length}/${workflow?.steps.length} steps completed`
    },
    qcTestsPassed: {
      status: batch.qcResults?.every(r => r.pass) || false,
      label: 'All QC Tests Passed',
      details: batch.qcResults ? `${batch.qcResults.filter(r => r.pass).length}/${batch.qcResults.length} tests passed` : 'No QC results'
    },
    deviationsClosed: {
      status: batchDeviations.every(d => d.status === 'approved' || d.status === 'rejected'),
      label: 'All Deviations Closed',
      details: `${batchDeviations.length} deviations - ${batchDeviations.filter(d => d.status === 'approved').length} approved, ${batchDeviations.filter(d => d.status === 'rejected').length} rejected`
    },
    yieldReconciled: {
      status: batch.yieldReconciliation?.status === 'reconciled',
      label: 'Yield Reconciled',
      details: batch.yieldReconciliation ? `${batch.yieldReconciliation.yieldPercentage.toFixed(2)}%` : 'Not reconciled'
    },
    documentationComplete: {
      status: batch.history.every(h => h.completedBy),
      label: 'All Steps Signed',
      details: 'All steps have electronic signatures'
    },
    cleaningVerified: {
      status: batch.cleaningVerified || false,
      label: 'Equipment Cleaning Verified',
      details: batch.cleaningVerified ? 'Verified' : 'Not verified'
    }
  };

  const allChecksPassed = Object.values(checks).every(c => c.status);
  const canRelease = allChecksPassed && currentUser.role === 'QA';

  const performRelease = () => {
    if (!canRelease) {
      alert('Cannot release: not all requirements met or insufficient permissions');
      return;
    }

    showESignature(
      'Batch Release',
      `Release batch ${batch.id} for distribution`,
      (signature) => {
        releaseBatch(batch.id, {
          releasedBy: signature.signedBy,
          releasedAt: signature.timestamp,
          signature: signature,
          releaseChecklist: checks,
          certificateOfAnalysis: generateCoA(batch)
        });

        addAuditEntry("Batch Released", `Batch ${batch.id} released by ${signature.signedBy}`, batch.id);
      }
    );
  };

  const generateCoA = (batch) => {
    return {
      batchNumber: batch.id,
      product: batch.productName,
      manufacturingDate: batch.startedAt,
      expiryDate: calculateExpiryDate(batch.startedAt),
      quantity: batch.actualYield || batch.targetQuantity,
      qcResults: batch.qcResults || [],
      releaseDate: new Date().toISOString()
    };
  };

  const calculateExpiryDate = (manufacturingDate) => {
    const date = new Date(manufacturingDate);
    date.setFullYear(date.getFullYear() + 2); // 2 years shelf life
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <FileCheck className="w-6 h-6 mr-2" />
          Electronic Batch Release - {batch.id}
        </h2>
        {batch.releaseInfo && (
          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold">
            RELEASED
          </span>
        )}
      </div>

      <div className="glass-card">
        <h3 className="text-lg font-semibold mb-4">Release Checklist</h3>
        
        <div className="space-y-3">
          {Object.entries(checks).map(([key, check]) => (
            <div key={key} className={`p-4 rounded-lg border ${
              check.status ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-start space-x-3">
                {check.status ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{check.label}</p>
                  <p className="text-sm text-gray-600">{check.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!allChecksPassed && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Cannot Release</p>
                <p className="text-sm text-yellow-800">All checklist items must pass before release</p>
              </div>
            </div>
          </div>
        )}

        {batch.releaseInfo ? (
          <div className="mt-6 p-4 bg-green-50 border border-green-300 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Release Information</h4>
            <div className="text-sm space-y-1">
              <p><span className="font-semibold">Released By:</span> {batch.releaseInfo.releasedBy}</p>
              <p><span className="font-semibold">Release Date:</span> {new Date(batch.releaseInfo.releasedAt).toLocaleString()}</p>
              <p><span className="font-semibold">CoA Generated:</span> Yes</p>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex justify-end">
            <button
              onClick={performRelease}
              disabled={!canRelease}
              className={`px-6 py-3 rounded-lg font-semibold ${
                canRelease 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Release Batch for Distribution
            </button>
          </div>
        )}
      </div>

      {batch.releaseInfo?.certificateOfAnalysis && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Certificate of Analysis</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold">Batch Number:</p>
              <p>{batch.releaseInfo.certificateOfAnalysis.batchNumber}</p>
            </div>
            <div>
              <p className="font-semibold">Product:</p>
              <p>{batch.releaseInfo.certificateOfAnalysis.product}</p>
            </div>
            <div>
              <p className="font-semibold">Manufacturing Date:</p>
              <p>{new Date(batch.releaseInfo.certificateOfAnalysis.manufacturingDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-semibold">Expiry Date:</p>
              <p>{batch.releaseInfo.certificateOfAnalysis.expiryDate}</p>
            </div>
            <div>
              <p className="font-semibold">Quantity:</p>
              <p>{batch.releaseInfo.certificateOfAnalysis.quantity} units</p>
            </div>
            <div>
              <p className="font-semibold">Release Date:</p>
              <p>{new Date(batch.releaseInfo.certificateOfAnalysis.releaseDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
