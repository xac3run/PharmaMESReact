import React, { useState } from 'react';
import { Beaker, CheckCircle, GitBranch, Package, Download, Plus, Play, Settings } from 'lucide-react';

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
  exportBatchPDF,
  addAuditEntry
}) {
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [newBatch, setNewBatch] = useState({
    formulaId: '',
    workflowId: '',
    targetQuantity: '',
    priority: 'normal'
  });

  // Create new batch function for demo
  const createNewBatch = () => {
    if (!newBatch.formulaId || !newBatch.workflowId || !newBatch.targetQuantity) {
      alert('Please fill all required fields');
      return;
    }

    const batchId = `BATCH-${String(batches.length + 1).padStart(3, '0')}`;
    const selectedFormula = formulas.find(f => f.id === parseInt(newBatch.formulaId));
    const selectedWorkflow = workflows.find(w => w.id === parseInt(newBatch.workflowId));

    const newBatchData = {
      id: batchId,
      formulaId: parseInt(newBatch.formulaId),
      workflowId: parseInt(newBatch.workflowId),
      status: "ready",
      targetQuantity: parseInt(newBatch.targetQuantity),
      actualQuantity: 0,
      progress: 0,
      priority: newBatch.priority,
      currentStep: null,
      currentStepIndex: 0,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      createdBy: currentUser.name,
      startedBy: null,
      history: [],
      materialConsumption: [],
      qcResults: [],
      deviations: []
    };

    setBatches(prev => [newBatchData, ...prev]);
    
    if (addAuditEntry) {
      addAuditEntry(
        "Batch Created", 
        `New batch ${batchId} created for ${selectedFormula?.productName} with target quantity ${newBatch.targetQuantity}`
      );
    }

    // Reset form
    setNewBatch({
      formulaId: '',
      workflowId: '',
      targetQuantity: '',
      priority: 'normal'
    });
    setShowCreateBatch(false);
  };

  // Enhanced start production function
  const handleStartProduction = (batchId, targetQty) => {
    const batch = batches.find(b => b.id === batchId);
    const workflow = workflows.find(w => w.id === batch.workflowId);
    
    if (!workflow || !workflow.steps || workflow.steps.length === 0) {
      alert('No workflow steps found for this batch');
      return;
    }
    
    setBatches(prev => prev.map(b => 
      b.id === batchId 
        ? { 
            ...b, 
            status: "in_progress", 
            targetQuantity: targetQty, 
            currentStep: workflow.steps[0].id,
            currentStepIndex: 0,
            startedAt: new Date().toISOString(),
            startedBy: currentUser.name
          }
        : b
    ));
    
    if (addAuditEntry) {
      addAuditEntry("Batch Started", `Batch ${batchId} started with target quantity ${targetQty}`, batchId);
    }
  };

  // Quick start function for demo
  const quickStartBatch = (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    const defaultQty = batch.targetQuantity || 1000;
    handleStartProduction(batchId, defaultQty);
  };

  // Demo batch completion function
  const completeBatchDemo = (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    const workflow = workflows.find(w => w.id === batch.workflowId);
    
    if (!workflow) return;

    // Auto-complete all remaining steps for demo
    const remainingSteps = workflow.steps.filter(step => 
      !batch.history.find(h => h.stepId === step.id)
    );

    const newHistory = [...batch.history];
    remainingSteps.forEach((step, index) => {
      newHistory.push({
        stepId: step.id,
        stepName: step.name,
        value: step.type === 'qc' ? '95.5' : 'COMPLETED',
        lotNumber: step.type === 'dispensing' ? `LOT-${Date.now()}-${index}` : null,
        completedBy: currentUser.name,
        timestamp: new Date(Date.now() + index * 1000).toISOString(),
        workStation: workStations.find(ws => ws.id === step.workStationId)?.name
      });
    });

    setBatches(prev => prev.map(b => 
      b.id === batchId 
        ? { 
            ...b, 
            status: "completed", 
            progress: 100,
            currentStep: null,
            completedAt: new Date().toISOString(),
            history: newHistory,
            actualQuantity: batch.targetQuantity * 0.98 // 98% yield for demo
          }
        : b
    ));

    if (addAuditEntry) {
      addAuditEntry("Batch Completed", `Batch ${batchId} completed (DEMO AUTO-COMPLETE)`, batchId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Batch Production</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowCreateBatch(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Batch</span>
          </button>
        </div>
      </div>

      {/* Create Batch Modal */}
      {showCreateBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass-card max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Create New Batch</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Formula</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newBatch.formulaId}
                  onChange={(e) => setNewBatch(prev => ({ ...prev, formulaId: e.target.value }))}
                >
                  <option value="">Select Formula</option>
                  {formulas.filter(f => f.status === 'approved').map(formula => (
                    <option key={formula.id} value={formula.id}>
                      {formula.articleNumber} - {formula.productName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Workflow</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newBatch.workflowId}
                  onChange={(e) => setNewBatch(prev => ({ ...prev, workflowId: e.target.value }))}
                >
                  <option value="">Select Workflow</option>
                  {workflows.map(workflow => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name} ({workflow.steps?.length || 0} steps)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Target Quantity</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={newBatch.targetQuantity}
                  onChange={(e) => setNewBatch(prev => ({ ...prev, targetQuantity: e.target.value }))}
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Priority</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newBatch.priority}
                  onChange={(e) => setNewBatch(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-2 mt-6">
              <button
                onClick={createNewBatch}
                className="btn-primary flex-1"
              >
                Create Batch
              </button>
              <button
                onClick={() => setShowCreateBatch(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Batches List */}
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
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-bold">{batch.id}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    batch.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    batch.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    batch.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {(batch.priority || 'normal').toUpperCase()}
                  </span>
                </div>
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
                  (batch.status || 'ready') === "completed" ? "bg-green-100 text-green-800" :
                  (batch.status || 'ready') === "in_progress" ? "bg-blue-100 text-blue-800" :
                  (batch.status || 'ready') === "ready" ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {(batch.status || 'ready').toUpperCase()}
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

            {/* Batch Action Buttons */}
            {batch.status === "ready" && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const qty = prompt("Enter target quantity:", batch.targetQuantity);
                      if (qty) handleStartProduction(batch.id, parseInt(qty));
                    }}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Production</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      quickStartBatch(batch.id);
                    }}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Quick Start</span>
                  </button>
                </div>
              </div>
            )}

            {batch.status === "in_progress" && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Complete all remaining steps automatically? (Demo feature)')) {
                        completeBatchDemo(batch.id);
                      }
                    }}
                    className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Auto-Complete (Demo)</span>
                  </button>
                </div>
              </div>
            )}

            {isExpanded && (
              <div className="mt-6 pt-6 border-t space-y-6">
                {/* Batch Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Created:</span> {new Date(batch.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-semibold">Created By:</span> {batch.createdBy}
                  </div>
                  {batch.startedAt && (
                    <>
                      <div>
                        <span className="font-semibold">Started:</span> {new Date(batch.startedAt).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-semibold">Started By:</span> {batch.startedBy}
                      </div>
                    </>
                  )}
                  {batch.completedAt && (
                    <div className="col-span-2">
                      <span className="font-semibold">Completed:</span> {new Date(batch.completedAt).toLocaleString()}
                    </div>
                  )}
                </div>

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
                          className={`p-4 rounded-lg border-2 mb-3 ${
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
      
      {batches.length === 0 && (
        <div className="glass-card text-center py-12">
          <Beaker className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Batches Created</h3>
          <p className="text-gray-500 mb-4">Create your first batch to start production</p>
          <button 
            onClick={() => setShowCreateBatch(true)}
            className="btn-primary"
          >
            Create First Batch
          </button>
        </div>
      )}
    </div>
  );
}