import React, { useState } from 'react';
import { FileCheck, AlertCircle, CheckCircle, XCircle, Download, Calendar, ClipboardCheck } from 'lucide-react';

export default function BatchRelease({ 
  batch,
  workflows,
  deviations = [], // добавить default
  formulas = [], // добавить default
  equipment = [], // добавить default
  workStations = [], // добавить default
  currentUser,
  releaseBatch,
  showESignature,
  addAuditEntry,
  createStabilityStudy
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [showCoA, setShowCoA] = useState(false);

  if (!batch || batch.status !== 'completed') {
    return (
      <div className="glass-card text-center py-8">
        <p className="text-gray-600">Batch release only available for completed batches</p>
      </div>
    );
  }

  const workflow = workflows?.find(w => w.id === batch.workflowId);
  const formula = formulas?.find(f => f.id === batch.formulaId);
  const batchDeviations = deviations?.filter(d => d.batchId === batch.id) || [];
  
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
  const canRelease = allChecksPassed && (currentUser.role === 'QA' || currentUser.role === 'Admin');

  const generateCoA = () => {
    return {
      batchNumber: batch.id,
      product: formula?.productName,
      articleNumber: formula?.articleNumber,
      formulaVersion: formula?.version,
      manufacturingDate: batch.startedAt,
      expiryDate: calculateExpiryDate(batch.startedAt, 24), // 24 months shelf life
      quantity: batch.actualYield || batch.targetQuantity,
      unit: 'units',
      qcResults: batch.qcResults || [],
      releaseDate: new Date().toISOString(),
      releasedBy: currentUser.name,
      inProcessControls: batch.history.filter(h => h.stepName.includes('QC')),
      specifications: formula?.bom || []
    };
  };

  const calculateExpiryDate = (manufacturingDate, monthsShelfLife) => {
    const date = new Date(manufacturingDate);
    date.setMonth(date.getMonth() + monthsShelfLife);
    return date.toISOString().split('T')[0];
  };

  const performRelease = () => {
    if (!canRelease) {
      alert('Cannot release: not all requirements met or insufficient permissions');
      return;
    }

    showESignature(
      'Batch Release',
      `Release batch ${batch.id} for distribution`,
      (signature) => {
        const coaData = generateCoA();
        
        releaseBatch(batch.id, {
          releasedBy: signature.signedBy,
          releasedAt: signature.timestamp,
          signature: signature,
          releaseChecklist: checks,
          certificateOfAnalysis: coaData
        });

        addAuditEntry("Batch Released", `Batch ${batch.id} released by ${signature.signedBy}`, batch.id);

        // Auto-create Stability Study
        if (createStabilityStudy) {
          const stabilityData = {
            batchId: batch.id,
            product: formula?.productName,
            startDate: new Date().toISOString(),
            conditions: ['25°C/60%RH', '40°C/75%RH'],
            duration: 24, // months
            pullSchedule: [0, 3, 6, 12, 18, 24], // months
            status: 'active'
          };
          createStabilityStudy(stabilityData);
          addAuditEntry("Stability Study Created", `Stability study initiated for batch ${batch.id}`, batch.id);
        }
      }
    );
  };

  const exportCoAPDF = () => {
    const coaData = batch.releaseInfo?.certificateOfAnalysis || generateCoA();
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
    content += `\n--- IN-PROCESS CONTROLS ---\n`;
    coaData.inProcessControls?.forEach(ipc => {
      content += `${ipc.stepName}: ${ipc.value} - ${new Date(ipc.timestamp).toLocaleString()}\n`;
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

  const exportBatchHistory = () => {
    let content = `BATCH EXECUTION HISTORY - ${batch.id}\n\n`;
    content += `Product: ${formula?.productName}\n`;
    content += `Formula: ${formula?.articleNumber} v${formula?.version}\n`;
    content += `Target Quantity: ${batch.targetQuantity} units\n`;
    content += `Actual Yield: ${batch.actualYield || 'N/A'} units\n`;
    content += `Started: ${new Date(batch.startedAt).toLocaleString()}\n`;
    content += `Completed: ${new Date(batch.completedAt).toLocaleString()}\n\n`;
    
    content += `--- EXECUTION STEPS ---\n`;
    batch.history.forEach((step, idx) => {
      const stepData = workflow?.steps.find(s => s.id === step.stepId);
      const equipmentUsed = equipment?.find(e => e.id === stepData?.equipmentId);
      const wsUsed = workStations?.find(ws => ws.id === stepData?.workStationId);
      
      content += `\nStep ${idx + 1}: ${step.stepName}\n`;
      content += `  Type: ${stepData?.type || 'N/A'}\n`;
      content += `  Value: ${step.value}\n`;
      if (step.lotNumber) content += `  Lot Number: ${step.lotNumber}\n`;
      if (equipmentUsed) {
        content += `  Equipment: ${equipmentUsed.name} (${equipmentUsed.class}/${equipmentUsed.subclass})\n`;
        content += `  Serial Number: ${equipmentUsed.serialNumber}\n`;
        if (step.equipmentParameters) {
          content += `  Parameters: ${JSON.stringify(step.equipmentParameters)}\n`;
        }
      }
      if (wsUsed) content += `  Work Station: ${wsUsed.name}\n`;
      content += `  Completed By: ${step.completedBy}\n`;
      content += `  Timestamp: ${new Date(step.timestamp).toLocaleString()}\n`;
      if (stepData?.instruction) content += `  Instruction: ${stepData.instruction}\n`;
    });

    content += `\n--- MATERIAL CONSUMPTION ---\n`;
    batch.materialConsumption.forEach(mc => {
      content += `${mc.materialArticle}: ${mc.quantity} ${mc.unit} (Lot: ${mc.lotNumber})\n`;
    });

    if (batchDeviations.length > 0) {
      content += `\n--- DEVIATIONS ---\n`;
      batchDeviations.forEach(dev => {
        content += `${dev.id}: ${dev.title} - Status: ${dev.status}\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Batch_History_${batch.id}.txt`;
    a.click();
    addAuditEntry("Batch History Exported", `Full history exported for batch ${batch.id}`, batch.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <FileCheck className="w-6 h-6 mr-2" />
          Electronic Batch Release - {batch.id}
        </h2>
        {batch.releaseInfo && (
          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
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
              <p><span className="font-semibold">Stability Study:</span> Initiated</p>
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

      {/* Detailed Batch History */}
      <div className="glass-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <ClipboardCheck className="w-5 h-5 mr-2" />
            Batch Execution History
          </h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showHistory ? 'Hide' : 'Show'} Details
          </button>
        </div>

        {showHistory && (
          <div className="space-y-3">
            {batch.history.map((step, idx) => {
              const stepData = workflow?.steps.find(s => s.id === step.stepId);
              const equipmentUsed = equipment?.find(e => e.id === stepData?.equipmentId);
              const wsUsed = workStations?.find(ws => ws.id === stepData?.workStationId);

              return (
                <div key={idx} className="border rounded-lg p-4 bg-white/40">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <h4 className="font-semibold">{step.stepName}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        stepData?.type === 'qc' ? 'bg-purple-100 text-purple-800' :
                        stepData?.type === 'dispensing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {stepData?.type?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-semibold">Value:</span> {step.value}</div>
                    {step.lotNumber && <div><span className="font-semibold">Lot:</span> {step.lotNumber}</div>}
                    <div><span className="font-semibold">Operator:</span> {step.completedBy}</div>
                    <div><span className="font-semibold">Time:</span> {new Date(step.timestamp).toLocaleString()}</div>
                    {equipmentUsed && (
                      <>
                        <div className="col-span-2"><span className="font-semibold">Equipment:</span> {equipmentUsed.name} ({equipmentUsed.class}/{equipmentUsed.subclass})</div>
                        <div className="col-span-2"><span className="font-semibold">Serial:</span> {equipmentUsed.serialNumber}</div>
                        {step.equipmentParameters && (
                          <div className="col-span-2">
                            <span className="font-semibold">Parameters:</span>
                            <div className="text-xs bg-gray-50 p-2 rounded mt-1">
                              {JSON.stringify(step.equipmentParameters, null, 2)}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {wsUsed && <div className="col-span-2"><span className="font-semibold">Work Station:</span> {wsUsed.name}</div>}
                    {stepData?.instruction && (
                      <div className="col-span-2">
                        <span className="font-semibold">Instruction:</span>
                        <p className="text-xs text-gray-600 mt-1">{stepData.instruction}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex space-x-2">
          <button
            onClick={exportBatchHistory}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Full History</span>
          </button>
        </div>
      </div>

      {/* Certificate of Analysis */}
      {batch.releaseInfo?.certificateOfAnalysis && (
        <div className="glass-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Certificate of Analysis</h3>
            <button
              onClick={() => setShowCoA(!showCoA)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showCoA ? 'Hide' : 'Show'} CoA
            </button>
          </div>

          {showCoA && (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="font-semibold">Batch Number:</p>
                  <p>{batch.releaseInfo.certificateOfAnalysis.batchNumber}</p>
                </div>
                <div>
                  <p className="font-semibold">Product:</p>
                  <p>{batch.releaseInfo.certificateOfAnalysis.product}</p>
                </div>
                <div>
                  <p className="font-semibold">Article Number:</p>
                  <p>{batch.releaseInfo.certificateOfAnalysis.articleNumber}</p>
                </div>
                <div>
                  <p className="font-semibold">Formula Version:</p>
                  <p>{batch.releaseInfo.certificateOfAnalysis.formulaVersion}</p>
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
                  <p>{batch.releaseInfo.certificateOfAnalysis.quantity} {batch.releaseInfo.certificateOfAnalysis.unit}</p>
                </div>
                <div>
                  <p className="font-semibold">Released By:</p>
                  <p>{batch.releaseInfo.certificateOfAnalysis.releasedBy}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-semibold mb-2">QC Test Results:</p>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-2">Test</th>
                      <th className="text-left p-2">Result</th>
                      <th className="text-left p-2">Specification</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batch.releaseInfo.certificateOfAnalysis.qcResults.map((qc, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{qc.test}</td>
                        <td className="p-2">{qc.result} {qc.unit}</td>
                        <td className="p-2">{qc.min} - {qc.max}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
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
            </>
          )}

          <div className="mt-4">
            <button
              onClick={exportCoAPDF}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download CoA</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}