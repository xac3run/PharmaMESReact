import React from 'react';
import { Beaker, CheckCircle, GitBranch, Package, Download } from 'lucide-react';

export default function Batches({ 
  batches, 
  setBatches,
  formulas,
  workflows,
  equipment,
  workStations,
  currentUser,
  expandedBatch,
  setExpandedBatch,
  startBatchProduction,
  executeStep,
  exportBatchPDF
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Batch Production</h2>
      </div>
      
      {batches.map(batch => {
        const formula = formulas.find(f => f.id === batch.formulaId);
        const workflow = workflows.find(w => w.id === batch.workflowId);
        const isExpanded = expandedBatch === batch.id;
        const currentStep = workflow?.steps.find(s => s.id === batch.currentStep);
        const currentWorkStation = workStations.find(ws => ws.id === currentStep?.workStationId);
        
        return (
          <div key={batch.id} className="glass-card">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}
            >
              <div className="flex-1">
                <h3 className="text-xl font-bold">{batch.id}</h3>
                <p className="text-gray-600">{formula?.productName} - {formula?.articleNumber}</p>
                <p className="text-sm text-gray-500">Target: {batch.targetQuantity} units</p>
                {batch.status === "in_progress" && currentStep && (
                  <div className="mt-2 text-sm">
                    <span className="font-semibold text-blue-600">Current Step:</span> {currentStep.name}
                    {currentWorkStation && (
                      <span className="text-gray-500"> @ {currentWorkStation.name}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className={`px-4 py-2 rounded-lg font-semibold ${
                  batch.status === "completed" ? "bg-green-100 text-green-800" :
                  batch.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {batch.status.toUpperCase()}
                </div>
                <div className="mt-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{width: `${batch.progress}%`}}
                    />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{batch.progress}% Complete</div>
                </div>
              </div>
            </div>

            {batch.status === "ready" && currentUser.role === "Planner" && (
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const qty = prompt("Enter target quantity:");
                    if (qty) startBatchProduction(batch.id, parseInt(qty));
                  }}
                  className="btn-primary"
                >
                  Start Production
                </button>
              </div>
            )}

            {isExpanded && (
              <div className="mt-6 pt-6 border-t space-y-6">
                {batch.status === "in_progress" && (
                  <div>
                    <h4 className="font-semibold text-lg mb-4 flex items-center">
                      <GitBranch className="w-5 h-5 mr-2" />
                      Workflow Execution
                    </h4>
                    {workflow?.steps.map((step, idx) => {
                      const completed = batch.history.find(h => h.stepId === step.id);
                      const isCurrent = step.id === batch.currentStep;
                      const equipmentItem = equipment.find(e => e.id === step.equipmentId);
                      const workStation = workStations.find(ws => ws.id === step.workStationId);
                      const canExecute = currentUser.allowedWorkStations?.includes(step.workStationId) || currentUser.role === "Master";
                      
                      return (
                        <div 
                          key={step.id}
                          className={`p-4 rounded-lg border-2 ${
                            completed ? "bg-green-50 border-green-300" :
                            isCurrent ? "bg-blue-50 border-blue-400" :
                            "bg-gray-50 border-gray-200 opacity-50"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                  completed ? "bg-green-500 text-white" :
                                  isCurrent ? "bg-blue-500 text-white" :
                                  "bg-gray-300 text-gray-600"
                                }`}>
                                  {idx + 1}
                                </span>
                                <h5 className="font-semibold text-lg">{step.name}</h5>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  step.type === "qc" ? "bg-purple-100 text-purple-800" :
                                  step.type === "dispensing" ? "bg-yellow-100 text-yellow-800" :
                                  "bg-blue-100 text-blue-800"
                                }`}>
                                  {step.type.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{step.instruction}</p>
                              {equipmentItem && (
                                <p className="text-xs text-gray-500">Equipment: {equipmentItem.name}</p>
                              )}
                              {workStation && (
                                <p className="text-xs text-gray-500">Work Station: {workStation.name}</p>
                              )}
                              {step.type === "dispensing" && step.formulaBomId && (
                                <p className="text-xs text-blue-600 font-semibold">
                                  Material: {formula.bom.find(b => b.id === step.formulaBomId)?.materialArticle}
                                </p>
                              )}
                            </div>
                            {completed && (
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            )}
                          </div>
                          
                          {isCurrent && currentUser.role === "Operator" && canExecute && (
                            <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-300">
                              <div className="space-y-3">
                                {step.type === "dispensing" && (
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-semibold mb-1">Weight (g)</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        className="border rounded px-3 py-2 w-full"
                                        placeholder="Enter weight"
                                        id={`weight-${step.id}`}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold mb-1">Lot Number</label>
                                      <input
                                        type="text"
                                        className="border rounded px-3 py-2 w-full"
                                        placeholder="Enter lot"
                                        id={`lot-${step.id}`}
                                      />
                                    </div>
                                  </div>
                                )}
                                
                                {step.type === "process" && (
                                  <div>
                                    <label className="block text-xs font-semibold mb-1">Confirmation</label>
                                    <input
                                      type="text"
                                      className="border rounded px-3 py-2 w-full"
                                      placeholder="Type 'CONFIRMED'"
                                      id={`confirm-${step.id}`}
                                    />
                                  </div>
                                )}
                                
                                {step.type === "qc" && (
                                  <div>
                                    <label className="block text-xs font-semibold mb-1">
                                      {step.qcParameters.parameter} ({step.qcParameters.unit})
                                    </label>
                                    <p className="text-xs text-red-600 mb-2">
                                      Spec: {step.qcParameters.min} - {step.qcParameters.max}
                                    </p>
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="border rounded px-3 py-2 w-full"
                                      placeholder="Enter measurement"
                                      id={`qc-${step.id}`}
                                    />
                                  </div>
                                )}
                                
                                <button
                                  onClick={() => {
                                    let value, lotNumber = null;
                                    if (step.type === "dispensing") {
                                      value = document.getElementById(`weight-${step.id}`).value;
                                      lotNumber = document.getElementById(`lot-${step.id}`).value;
                                    } else if (step.type === "process") {
                                      value = document.getElementById(`confirm-${step.id}`).value;
                                    } else if (step.type === "qc") {
                                      value = document.getElementById(`qc-${step.id}`).value;
                                    }
                                    
                                    if (value) {
                                      executeStep(batch.id, step.id, value, lotNumber);
                                    } else {
                                      alert("Please enter required data");
                                    }
                                  }}
                                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold w-full"
                                >
                                  Complete Step & Sign
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {isCurrent && !canExecute && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
                              <p className="text-sm text-yellow-800">
                                You don't have access to this work station. Please contact supervisor.
                              </p>
                            </div>
                          )}
                          
                          {completed && (
                            <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="font-semibold">Value:</span> {completed.value}
                                </div>
                                <div>
                                  <span className="font-semibold">By:</span> {completed.completedBy}
                                </div>
                                <div className="col-span-2">
                                  <span className="font-semibold">Time:</span> {new Date(completed.timestamp).toLocaleString()}
                                </div>
                                {completed.lotNumber && (
                                  <div className="col-span-2">
                                    <span className="font-semibold">Lot:</span> {completed.lotNumber}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <div className="glass-card bg-white/40">
                  <h4 className="font-semibold text-lg mb-3 flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Material Consumption
                  </h4>
                  {batch.materialConsumption.length > 0 ? (
                    <div className="space-y-2">
                      {batch.materialConsumption.map((mc, idx) => (
                        <div key={idx} className="flex justify-between text-sm p-2 bg-white rounded">
                          <span>{mc.materialArticle}</span>
                          <span>{mc.quantity.toFixed(2)} {mc.unit} (Lot: {mc.lotNumber})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No materials consumed yet</p>
                  )}
                </div>
                
                {batch.status === "completed" && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => exportBatchPDF(batch.id, "full")}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Full Report</span>
                    </button>
                    <button
                      onClick={() => exportBatchPDF(batch.id, "history")}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>History</span>
                    </button>
                    <button
                      onClick={() => exportBatchPDF(batch.id, "materials")}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Materials</span>
                    </button>
                    <button
                      onClick={() => exportBatchPDF(batch.id, "audit")}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Audit Trail</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}