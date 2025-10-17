import React, { useState } from 'react';
import { Beaker, CheckCircle, GitBranch, Package, Download, Plus, Play, Settings, Calculator, AlertTriangle, Lock } from 'lucide-react';

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
  addAuditEntry,
  showESignature,
  deviations = [],
  setDeviations = null
}) {
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [newBatch, setNewBatch] = useState({
    formulaId: '',
    workflowId: '',
    targetQuantity: '',
    priority: 'normal'
  });

  // Функция для расчета количества материала для батча
  const calculateMaterialQuantity = (bomItem, targetQuantity, formula) => {
    if (!bomItem || !targetQuantity || !formula) return 0;
    
    const baseQuantity = bomItem.quantity;
    const unitWeight = formula.weight_per_unit || 1000;
    const calculatedQuantity = (baseQuantity / unitWeight) * targetQuantity;
    
    return calculatedQuantity;
  };

  // Функция для получения шагов workflow
  const getWorkflowSteps = (workflow) => {
    if (!workflow) {
      console.log('No workflow provided');
      return [];
    }
    
    // Новая структура (nodes)
    if (workflow.nodes && workflow.nodes.length > 0) {
      const stepNodes = workflow.nodes.filter(node => node.type === 'step');
      if (stepNodes.length > 0) {
        return stepNodes
          .map(node => node.data)
          .sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));
      }
    }
    
    // Старая структура (steps)
    return workflow.steps || [];
  };

  // Функция автоматического создания отклонения
  const createDeviationFromStep = (stepData, deviationType, description) => {
    if (!setDeviations || typeof setDeviations !== 'function') {
      console.warn('setDeviations function not available - deviation not created');
      return null;
    }
    
    const { batchId, stepId, step, bomItem, value, calculatedQuantity } = stepData;
    
    const deviationId = `DEV-${Date.now()}`;
    const newDeviation = {
      id: deviationId,
      title: `${deviationType} in Batch ${batchId} - Step ${step.name}`,
      description: description,
      category: 'process',
      severity: deviationType.includes('Critical') || deviationType.includes('QC') ? 'major' : 'minor',
      detectedBy: currentUser.name,
      detectedDate: new Date().toISOString(),
      status: 'open',
      relatedBatch: batchId,
      relatedStep: stepId,
      stepName: step.name,
      stepType: step.type,
      relatedMaterial: bomItem?.material_article || null,
      actualValue: value,
      expectedValue: calculatedQuantity,
      immediateAction: 'Step execution continued with documented deviation',
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
        decision: null,
        comments: '',
        signature: null
      },
      linkedCapa: null,
      attachments: [],
      workflow: [
        { step: 'Detection', status: 'completed', completedBy: currentUser.name, date: new Date().toISOString() },
        { step: 'Immediate Action', status: 'completed', completedBy: currentUser.name, date: new Date().toISOString() },
        { step: 'Investigation', status: 'pending', completedBy: null, date: null },
        { step: 'QA Review', status: 'pending', completedBy: null, date: null },
        { step: 'Closure', status: 'pending', completedBy: null, date: null }
      ]
    };

    setDeviations(prev => [...prev, newDeviation]);
    
    setBatches(prev => prev.map(batch => 
      batch.id === batchId 
        ? { 
            ...batch, 
            hasDeviations: true,
            deviations: [...(batch.deviations || []), deviationId]
          } 
        : batch
    ));

    addAuditEntry("Deviation Auto-Created", `${deviationId}: ${newDeviation.title}`, batchId);
    return deviationId;
  };

  // Функция выполнения шага с электронной подписью
  const executeStepWithSignature = (stepData) => {
    const { batchId, stepId, value, lotNumber, bomItem, step } = stepData;
    
    const stepContext = `Execute step "${step.name}" in batch ${batchId}`;
    const stepDetails = [
      `Step: ${step.name} (${step.type})`,
      `Value: ${value}`,
      lotNumber ? `Lot: ${lotNumber}` : null,
      bomItem ? `Material: ${bomItem.material_article}` : null
    ].filter(Boolean).join('\n');
    
    console.log('Requesting e-signature for step execution...');
    
    if (showESignature && typeof showESignature === 'function') {
      showESignature(stepContext, stepDetails, (signature) => {
        console.log('Step execution signature received:', signature);
        performStepExecution(stepData, signature);
      });
    } else {
      console.warn('showESignature function not available');
      performStepExecution(stepData, null);
    }
  };

  // Функция фактического выполнения шага
  const performStepExecution = (stepData, signature = null) => {
    const { batchId, stepId, value, lotNumber, calculatedQuantity, bomItem, additionalData, step } = stepData;
    
    try {
      let deviationCreated = false;
      let deviationDescription = '';
      
      // Проверка на отклонения и автоматическое создание deviation
      if (step.type === "dispensing" || step.type === "weighing") {
        if (bomItem && calculatedQuantity) {
          const actualWeight = parseFloat(value);
          
          let tolerance;
          if (bomItem.max_quantity && bomItem.min_quantity) {
            tolerance = (bomItem.max_quantity - bomItem.min_quantity) / 2;
          } else {
            tolerance = calculatedQuantity * 0.05;
          }
          
          const minAllowed = calculatedQuantity - tolerance;
          const maxAllowed = calculatedQuantity + tolerance;
          
          if (actualWeight < minAllowed || actualWeight > maxAllowed) {
            deviationDescription = `Weight deviation: Actual ${actualWeight} ${bomItem.unit} outside tolerance range ${minAllowed.toFixed(2)}-${maxAllowed.toFixed(2)} ${bomItem.unit}. Target was ${calculatedQuantity.toFixed(2)} ${bomItem.unit}.`;
            createDeviationFromStep(stepData, 'Weight Deviation', deviationDescription);
            deviationCreated = true;
          }
        }
      } else if (step.type === "qc") {
        const val = parseFloat(value);
        if (val < step.qcParameters.min || val > step.qcParameters.max) {
          deviationDescription = `QC result deviation: Actual result ${val} ${step.qcParameters.unit} outside specification ${step.qcParameters.min}-${step.qcParameters.max} ${step.qcParameters.unit}.`;
          createDeviationFromStep(stepData, 'QC Result Deviation', deviationDescription);
          deviationCreated = true;
        }
      }
      
      // Обновляем батч
      setBatches(prev => prev.map(batch => {
        if (batch.id !== batchId) return batch;
        
        const workflow = workflows.find(w => w.id === batch.workflowId);
        const steps = getWorkflowSteps(workflow);
        const currentStepIndex = steps.findIndex(s => s.id === stepId);
        const nextStep = steps[currentStepIndex + 1];
        
        const historyEntry = {
          stepId,
          stepName: step.name,
          value,
          lotNumber,
          completedBy: currentUser.name,
          timestamp: new Date().toISOString(),
          workStation: workStations.find(ws => ws.id === step.workStationId)?.name,
          equipmentUsed: step.equipmentId ? equipment.find(eq => eq.id === step.equipmentId)?.name : null,
          signature: signature ? {
            user: signature.user,
            timestamp: signature.timestamp,
            reason: signature.reason
          } : null,
          calculatedQuantity,
          bomMaterial: bomItem?.material_article,
          additionalData,
          hasDeviation: deviationCreated,
          deviationDescription: deviationCreated ? deviationDescription : null
        };
        
        let materialConsumption = [...batch.materialConsumption];
        if ((step.type === "dispensing" || step.type === "weighing") && bomItem) {
          const actualQuantity = parseFloat(value);
          materialConsumption.push({
            stepId,
            materialArticle: bomItem.material_article,
            quantity: actualQuantity,
            unit: bomItem.unit,
            lotNumber: lotNumber || "MANUAL",
            timestamp: new Date().toISOString(),
            calculatedQuantity,
            variance: actualQuantity - calculatedQuantity,
            hasDeviation: deviationCreated
          });
        }
        
        const newHistory = [...batch.history, historyEntry];
        const progress = Math.round((newHistory.length / steps.length) * 100);
        
        let newStatus = batch.status;
        if (progress === 100) {
          newStatus = (batch.hasDeviations || deviationCreated) ? "under_review" : "completed";
        }
        
        return {
          ...batch,
          history: newHistory,
          materialConsumption,
          progress,
          currentStep: nextStep?.id || null,
          currentStepIndex: currentStepIndex + 1,
          status: newStatus,
          hasDeviations: batch.hasDeviations || deviationCreated
        };
      }));
      
      const auditDetails = [
        `Batch ${batchId} - Step: ${step.name}`,
        `Value: ${value}`,
        lotNumber ? `Lot: ${lotNumber}` : null,
        signature ? `E-Signed by: ${signature.user}` : null,
        deviationCreated ? `Deviation auto-created` : null
      ].filter(Boolean).join(', ');
      
      addAuditEntry("Step Completed", auditDetails, batchId);
      
      if (deviationCreated) {
        alert(`⚠️ Deviation Detected!\n\n${deviationDescription}\n\nA deviation record has been automatically created and will require investigation. The batch will continue but will need QA review upon completion.`);
      }
      
    } catch (error) {
      console.error('Failed to execute step:', error);
      alert(`Failed to execute step: ${error.message}`);
    }
  };

  // Create new batch function
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
      addAuditEntry("Batch Created", `New batch ${batchId} created for ${selectedFormula?.productName} with target quantity ${newBatch.targetQuantity}`);
    }

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
    const steps = getWorkflowSteps(workflow);
    
    if (!workflow || !steps || steps.length === 0) {
      alert('No workflow steps found for this batch');
      return;
    }
    
    setBatches(prev => prev.map(b => 
      b.id === batchId 
        ? { 
            ...b, 
            status: "in_progress", 
            targetQuantity: targetQty, 
            currentStep: steps[0].id,
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
                  {workflows.map(workflow => {
                    const steps = getWorkflowSteps(workflow);
                    return (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.name} ({steps.length} steps)
                      </option>
                    );
                  })}
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
        const steps = getWorkflowSteps(workflow);
        const isExpanded = expandedBatch === batch.id;
        const currentStep = steps.find(s => s.id === batch.currentStep);
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
                  (batch.status || 'ready') === "under_review" ? "bg-orange-100 text-orange-800" :
                  (batch.status || 'ready') === "in_progress" ? "bg-blue-100 text-blue-800" :
                  (batch.status || 'ready') === "ready" ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {(batch.status || 'ready').toUpperCase().replace('_', ' ')}
                </div>
                {batch.hasDeviations && (
                  <div className="mt-1 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    <span className="text-xs text-red-600 font-semibold">Has Deviations</span>
                  </div>
                )}
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
                    {steps.map((step, idx) => {
                      const completed = batch.history.find(h => h.stepId === step.id);
                      const isCurrent = step.id === batch.currentStep;
                      const equipmentItem = equipment.find(e => e.id === step.equipmentId);
                      const workStation = workStations.find(ws => ws.id === step.workStationId);
                      const canExecute = currentUser.allowedWorkStations?.includes(step.workStationId) || 
                                        currentUser.role === "Master" || 
                                        currentUser.role === "Admin";
                      
                      const bomItem = formula?.bom?.find(b => b.id === step.formulaBomId);
                      const calculatedQuantity = bomItem ? calculateMaterialQuantity(bomItem, batch.targetQuantity, formula) : null;
                      
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
                                  step.type === "weighing" ? "bg-orange-100 text-orange-800" :
                                  step.type === "mixing" ? "bg-cyan-100 text-cyan-800" :
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
                              
                              {/* Material Calculation */}
                              {bomItem && calculatedQuantity !== null && (
                                <div className="mt-2 p-2 bg-blue-50 rounded border">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Calculator className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-blue-800">Material Calculation</span>
                                  </div>
                                  <div className="text-xs space-y-1">
                                    <p><span className="font-semibold">Material:</span> {bomItem.material_article}</p>
                                    <p><span className="font-semibold">Formula quantity:</span> {bomItem.quantity} {bomItem.unit} per unit</p>
                                    <p><span className="font-semibold">Calculated for {batch.targetQuantity} units:</span> 
                                      <span className="text-blue-700 font-bold"> {calculatedQuantity.toFixed(2)} {bomItem.unit}</span>
                                    </p>
                                    <p><span className="font-semibold">Tolerance:</span> {bomItem.min_quantity} - {bomItem.max_quantity} {bomItem.unit}</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Step Parameters */}
                              {step.stepParameters && Object.keys(step.stepParameters).length > 0 && (
                                <div className="mt-2 p-2 bg-gray-50 rounded">
                                  <div className="text-xs font-semibold mb-1">Step Parameters:</div>
                                  <div className="text-xs text-gray-600">
                                    {Object.entries(step.stepParameters).map(([key, value]) => (
                                      <span key={key} className="mr-3">{key}: {value}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* QC Parameters */}
                              {step.qcParameters && Object.keys(step.qcParameters).length > 0 && (
                                <div className="mt-2 p-2 bg-purple-50 rounded border">
                                  <div className="text-xs font-semibold mb-1 text-purple-800">QC Specification:</div>
                                  <div className="text-xs text-purple-700">
                                    {step.qcParameters.parameter}: {step.qcParameters.min} - {step.qcParameters.max} {step.qcParameters.unit}
                                  </div>
                                </div>
                              )}
                            </div>
                            {completed && (
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            )}
                          </div>
                          
                          {/* Interactive Execution Area */}
                          {isCurrent && canExecute && (
                            <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-300">
                              <div className="space-y-3">
                                <div className="text-sm font-semibold text-blue-800 mb-2">Execute Step</div>
                                
                                {step.type === "dispensing" && (
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-semibold mb-1">
                                        Actual Weight ({bomItem?.unit || 'g'})
                                        {calculatedQuantity && (
                                          <span className="text-blue-600 ml-1">
                                            (Target: {calculatedQuantity.toFixed(2)})
                                          </span>
                                        )}
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        className="border rounded px-3 py-2 w-full"
                                        placeholder={calculatedQuantity ? calculatedQuantity.toFixed(2) : "Enter weight"}
                                        id={`weight-${step.id}`}
                                      />
                                      {bomItem && calculatedQuantity && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          Tolerance: {bomItem.min_quantity} - {bomItem.max_quantity} {bomItem.unit}
                                        </div>
                                      )}
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
                                
                                {step.type === "weighing" && (
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-semibold mb-1">
                                        Weighed Amount ({bomItem?.unit || 'g'})
                                        {calculatedQuantity && (
                                          <span className="text-blue-600 ml-1">
                                            (Target: {calculatedQuantity.toFixed(2)})
                                          </span>
                                        )}
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        className="border rounded px-3 py-2 w-full"
                                        placeholder={calculatedQuantity ? calculatedQuantity.toFixed(2) : "Enter weight"}
                                        id={`weight-${step.id}`}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold mb-1">Balance ID</label>
                                      <input
                                        type="text"
                                        className="border rounded px-3 py-2 w-full"
                                        placeholder="Balance identifier"
                                        id={`balance-${step.id}`}
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
                                
                                {step.type === "mixing" && (
                                  <div className="grid grid-cols-3 gap-3">
                                    <div>
                                      <label className="block text-xs font-semibold mb-1">Duration (min)</label>
                                      <input
                                        type="number"
                                        className="border rounded px-3 py-2 w-full"
                                        placeholder={step.stepParameters?.duration || "30"}
                                        id={`duration-${step.id}`}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold mb-1">RPM</label>
                                      <input
                                        type="number"
                                        className="border rounded px-3 py-2 w-full"
                                        placeholder={step.stepParameters?.rpm || "60"}
                                        id={`rpm-${step.id}`}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold mb-1">Temp (°C)</label>
                                      <input
                                        type="number"
                                        className="border rounded px-3 py-2 w-full"
                                        placeholder={step.stepParameters?.temperature || "20"}
                                        id={`temp-${step.id}`}
                                      />
                                    </div>
                                  </div>
                                )}
                                
                                {step.type === "qc" && (
                                  <div>
                                    <label className="block text-xs font-semibold mb-1">
                                      {step.qcParameters.parameter} ({step.qcParameters.unit})
                                    </label>
                                    <p className="text-xs text-red-600 mb-2">
                                      Specification: {step.qcParameters.min} - {step.qcParameters.max} {step.qcParameters.unit}
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
                                    let value, lotNumber = null, additionalData = {};
                                    
                                    if (step.type === "dispensing") {
                                      value = document.getElementById(`weight-${step.id}`).value;
                                      lotNumber = document.getElementById(`lot-${step.id}`).value;
                                      
                                      if (!value || !lotNumber) {
                                        alert("Please enter both weight and lot number");
                                        return;
                                      }
                                      
                                      if (bomItem && calculatedQuantity) {
                                        const actualWeight = parseFloat(value);
                                        const tolerance = bomItem.max_quantity - bomItem.min_quantity;
                                        const minAllowed = calculatedQuantity - tolerance;
                                        const maxAllowed = calculatedQuantity + tolerance;
                                        
                                        if (actualWeight < minAllowed || actualWeight > maxAllowed) {
                                          if (!confirm(`Weight ${actualWeight} ${bomItem.unit} is outside tolerance (${minAllowed.toFixed(2)}-${maxAllowed.toFixed(2)} ${bomItem.unit}). Continue?`)) {
                                            return;
                                          }
                                        }
                                      }
                                    } else if (step.type === "weighing") {
                                      value = document.getElementById(`weight-${step.id}`).value;
                                      additionalData.balanceId = document.getElementById(`balance-${step.id}`).value;
                                      
                                      if (!value) {
                                        alert("Please enter weight value");
                                        return;
                                      }
                                    } else if (step.type === "process") {
                                      value = document.getElementById(`confirm-${step.id}`).value;
                                      if (value.toUpperCase() !== "CONFIRMED") {
                                        alert("Please type 'CONFIRMED' to proceed");
                                        return;
                                      }
                                    } else if (step.type === "mixing") {
                                      const duration = document.getElementById(`duration-${step.id}`).value;
                                      const rpm = document.getElementById(`rpm-${step.id}`).value;
                                      const temp = document.getElementById(`temp-${step.id}`).value;
                                      
                                      if (!duration || !rpm || !temp) {
                                        alert("Please enter all mixing parameters");
                                        return;
                                      }
                                      
                                      value = `Duration: ${duration}min, RPM: ${rpm}, Temp: ${temp}°C`;
                                      additionalData = { duration, rpm, temperature: temp };
                                    } else if (step.type === "qc") {
                                      value = document.getElementById(`qc-${step.id}`).value;
                                      
                                      if (!value) {
                                        alert("Please enter QC measurement");
                                        return;
                                      }
                                      
                                      const val = parseFloat(value);
                                      
                                      if (val < step.qcParameters.min || val > step.qcParameters.max) {
                                        if (!confirm(`QC result ${val} ${step.qcParameters.unit} is out of specification (${step.qcParameters.min}-${step.qcParameters.max}). This will require deviation handling. Continue?`)) {
                                          return;
                                        }
                                      }
                                    }
                                    
                                    const stepData = {
                                      batchId: batch.id,
                                      stepId: step.id,
                                      value,
                                      lotNumber,
                                      calculatedQuantity,
                                      bomItem,
                                      additionalData,
                                      step
                                    };
                                    
                                    executeStepWithSignature(stepData);
                                  }}
                                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold w-full flex items-center justify-center space-x-2"
                                >
                                  <Lock className="w-4 h-4" />
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Complete Step & E-Sign</span>
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
                              {completed.hasDeviation && (
                                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded">
                                  <div className="flex items-center space-x-1 mb-1">
                                    <AlertTriangle className="w-3 h-3 text-red-600" />
                                    <span className="font-semibold text-red-800 text-xs">Deviation Detected</span>
                                  </div>
                                  <div className="text-xs text-red-700">
                                    {completed.deviationDescription}
                                  </div>
                                </div>
                              )}
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
                                {bomItem && (
                                  <div className="col-span-2">
                                    <span className="font-semibold">Material:</span> {bomItem.material_article}
                                  </div>
                                )}
                                {completed.signature && (
                                  <div className="col-span-2 mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                    <div className="flex items-center space-x-1 mb-1">
                                      <CheckCircle className="w-3 h-3 text-green-600" />
                                      <span className="font-semibold text-green-800 text-xs">Electronic Signature</span>
                                    </div>
                                    <div className="text-xs text-green-700">
                                      <div>Signed by: {completed.signature.user}</div>
                                      <div>Time: {new Date(completed.signature.timestamp).toLocaleString()}</div>
                                      {completed.signature.reason && (
                                        <div>Reason: {completed.signature.reason}</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {completed.calculatedQuantity && (
                                  <div className="col-span-2 text-xs text-blue-600">
                                    Target: {completed.calculatedQuantity.toFixed(2)} {bomItem?.unit}
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