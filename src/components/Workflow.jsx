import { useState } from "react";

export default function Workflow({ 
  workflow, 
  setWorkflow,
  activeWorkflow,
  setActiveWorkflow,
  batches,
  setBatches,
  templates,
  currentUser,
  setCurrentUser,
  deviations,
  setDeviations
}) {

  const [authModal, setAuthModal] = useState(null); // For e-signature authentication
  const [password, setPassword] = useState("");

  // Start workflow from approved template (Planner only)
  const startWorkflow = (batchId, templateId) => {
    const template = templates.find(t => t.id === templateId);
    const batch = batches.find(b => b.id === batchId);

    if (!template || template.status !== "approved") {
      alert("Only approved templates can be used to start workflow!");
      return;
    }

    // Check batch status - must be "Released for Production"
    if (batch.status === "completed") {
      alert("Cannot start workflow for completed batch!");
      return;
    }

    const workflowSteps = template.steps.map((step, index) => ({
      ...step,
      workflowId: Date.now(),
      batchId: batchId,
      stepNumber: index + 1,
      status: index === 0 ? "active" : "pending",
      value: null,
      completedBy: null,
      completedAt: null,
      signatures: [],
      requiresDoubleSignature: step.type === "control" && (step.min !== undefined || step.max !== undefined),
      isCritical: step.type === "control",
      deviation: null,
      skipCondition: null // For conditional logic
    }));

    setWorkflow(workflowSteps);
    setActiveWorkflow({
      id: Date.now(),
      batchId: batchId,
      templateId: templateId,
      templateName: template.name,
      templateVersion: template.version,
      status: "running",
      startedAt: new Date().toISOString(),
      startedBy: currentUser.name,
      pausedAt: null,
      currentStep: 0,
      auditTrail: [{
        action: "Workflow Started",
        user: currentUser.name,
        timestamp: new Date().toISOString(),
        details: `Started workflow using template ${template.name} v${template.version}`
      }]
    });

    setBatches(prev => prev.map(b => 
      b.id === batchId ? { ...b, status: "in_progress", progress: 0 } : b
    ));

    alert(`Workflow started for batch ${batchId} using template ${template.name} v${template.version}`);
  };

  // Pause workflow (Master only)
  const pauseWorkflow = () => {
    if (!activeWorkflow) return;
    setActiveWorkflow(prev => ({
      ...prev,
      status: "paused",
      pausedAt: new Date().toISOString(),
      auditTrail: [...prev.auditTrail, {
        action: "Workflow Paused",
        user: currentUser.name,
        timestamp: new Date().toISOString(),
        details: "Workflow paused by Master"
      }]
    }));
  };

  // Resume workflow (Master only)
  const resumeWorkflow = () => {
    if (!activeWorkflow) return;
    setActiveWorkflow(prev => ({
      ...prev,
      status: "running",
      pausedAt: null,
      auditTrail: [...prev.auditTrail, {
        action: "Workflow Resumed",
        user: currentUser.name,
        timestamp: new Date().toISOString(),
        details: "Workflow resumed by Master"
      }]
    }));
  };

  // E-signature authentication
  const authenticateSignature = (callback) => {
    const pwd = prompt(`Enter password for ${currentUser.name}:`);
    if (pwd === "1234") { // Simplified - in production use real auth
      callback();
    } else {
      alert("Invalid password!");
    }
  };

  // Complete workflow step with e-signature
  const completeWorkflowStep = (stepId, value) => {
    const step = workflow.find(s => s.id === stepId);
    if (!step) return;

    // Validate against limits for control/input steps
    if ((step.type === "control" || step.type === "input") && step.min !== undefined && step.max !== undefined) {
      if (value < step.min || value > step.max) {
        alert(`Value ${value} is out of limits (${step.min}-${step.max}).\nPlease register a deviation or correct the value.`);
        return;
      }
    }

    // Authenticate before completing
    authenticateSignature(() => {
      const signature = {
        signedBy: currentUser.name,
        role: currentUser.role,
        timestamp: new Date().toISOString(),
        ipAddress: "192.168.1.1", // In production, get real IP
        method: "Password"
      };

      setWorkflow(prev => prev.map(s => {
        if (s.id === stepId) {
          return {
            ...s,
            value: value,
            status: s.requiresDoubleSignature && s.signatures.length < 1 ? "pending_qa_approval" : "completed",
            completedBy: currentUser.name,
            completedAt: new Date().toISOString(),
            signatures: [...s.signatures, signature]
          };
        }
        // Activate next step only if current step is fully completed
        if (s.stepNumber === step.stepNumber + 1 && (!step.requiresDoubleSignature || step.signatures.length >= 1)) {
          return { ...s, status: "active" };
        }
        return s;
      }));

      // Update workflow progress
      const completedSteps = workflow.filter(s => s.status === "completed").length + 1;
      const totalSteps = workflow.length;
      const progress = Math.round((completedSteps / totalSteps) * 100);

      if (activeWorkflow) {
        setActiveWorkflow(prev => ({ 
          ...prev, 
          currentStep: step.stepNumber,
          auditTrail: [...prev.auditTrail, {
            action: "Step Completed",
            user: currentUser.name,
            timestamp: new Date().toISOString(),
            details: `Step ${step.stepNumber}: ${step.name} - Value: ${value}`,
            signature: signature
          }]
        }));
        
        setBatches(prev => prev.map(b => 
          b.id === activeWorkflow.batchId 
            ? { ...b, progress: progress, status: progress === 100 ? "completed" : "in_progress" }
            : b
        ));
      }
    });
  };

  // Add second signature (QA approval for CCP)
  const addSecondSignature = (stepId) => {
    if (currentUser.role !== "QA") {
      alert("Only QA personnel can approve critical control points!");
      return;
    }

    authenticateSignature(() => {
      const qaSignature = {
        signedBy: currentUser.name,
        role: "QA",
        timestamp: new Date().toISOString(),
        ipAddress: "192.168.1.1",
        method: "Password"
      };

      setWorkflow(prev => prev.map(s => {
        if (s.id === stepId) {
          const updatedStep = {
            ...s,
            signatures: [...s.signatures, qaSignature],
            status: "completed"
          };
          return updatedStep;
        }
        // Activate next step after QA approval
        if (s.stepNumber === (workflow.find(ws => ws.id === stepId)?.stepNumber || 0) + 1) {
          return { ...s, status: "active" };
        }
        return s;
      }));

      setActiveWorkflow(prev => ({
        ...prev,
        auditTrail: [...prev.auditTrail, {
          action: "QA Approval (Double Signature)",
          user: currentUser.name,
          timestamp: new Date().toISOString(),
          details: `Critical Control Point approved by QA`,
          signature: qaSignature
        }]
      }));

      alert("Critical Control Point approved!");
    });
  };

  // Register deviation with classification
  const reportDeviationFromStep = (stepId) => {
    const step = workflow.find(s => s.id === stepId);
    
    const deviationText = prompt("Enter deviation description:");
    if (!deviationText) return;

    const classification = prompt("Classify deviation:\n1. Technical\n2. Human Error\n3. Material Issue\nEnter 1, 2, or 3:");
    const classificationMap = {
      "1": "Technical",
      "2": "Human Error",
      "3": "Material Issue"
    };

    const newDeviation = {
      id: Date.now(),
      batchId: activeWorkflow?.batchId,
      stepId: stepId,
      stepName: step?.name,
      description: deviationText,
      classification: classificationMap[classification] || "Unclassified",
      status: "pending",
      reportedBy: currentUser.name,
      reportedDate: new Date().toISOString().split('T')[0],
      investigator: null,
      resolution: null
    };

    setDeviations(prev => [...prev, newDeviation]);
    
    setWorkflow(prev => prev.map(s => 
      s.id === stepId 
        ? { ...s, status: "blocked", deviation: deviationText }
        : s
    ));

    setActiveWorkflow(prev => ({
      ...prev,
      status: "paused",
      auditTrail: [...prev.auditTrail, {
        action: "Deviation Registered",
        user: currentUser.name,
        timestamp: new Date().toISOString(),
        details: `Deviation on step ${step?.name}: ${deviationText} (${classificationMap[classification]})`
      }]
    }));

    alert("Deviation registered. Workflow paused pending QA review.");
  };

  // QA approve/reject deviation
  const handleDeviation = (deviationId, action) => {
    if (currentUser.role !== "QA") {
      alert("Only QA can approve/reject deviations!");
      return;
    }

    const resolution = prompt(`Enter resolution notes for ${action}:`);
    if (!resolution) return;

    setDeviations(prev => prev.map(d => 
      d.id === deviationId 
        ? { ...d, status: action, investigator: currentUser.name, resolution: resolution }
        : d
    ));

    const deviation = deviations.find(d => d.id === deviationId);
    
    if (action === "approved" && deviation?.stepId) {
      // Allow workflow to continue
      setWorkflow(prev => prev.map(s => 
        s.id === deviation.stepId 
          ? { ...s, status: "active", deviation: null }
          : s
      ));
      
      if (activeWorkflow?.status === "paused") {
        resumeWorkflow();
      }

      setActiveWorkflow(prev => ({
        ...prev,
        auditTrail: [...prev.auditTrail, {
          action: "Deviation Approved",
          user: currentUser.name,
          timestamp: new Date().toISOString(),
          details: `Deviation approved: ${resolution}`
        }]
      }));
    } else if (action === "rejected") {
      // Stop workflow
      setActiveWorkflow(prev => ({
        ...prev,
        status: "stopped",
        auditTrail: [...prev.auditTrail, {
          action: "Deviation Rejected - Workflow Stopped",
          user: currentUser.name,
          timestamp: new Date().toISOString(),
          details: `Deviation rejected: ${resolution}`
        }]
      }));
      alert("Deviation rejected. Workflow stopped.");
    }
  };

  // Complete entire workflow (Master only)
  const completeWorkflow = () => {
    if (!activeWorkflow) return;
    if (currentUser.role !== "Master") {
      alert("Only Master can complete workflow!");
      return;
    }

    const allCompleted = workflow.every(s => s.status === "completed");
    const allCriticalSigned = workflow
      .filter(s => s.requiresDoubleSignature)
      .every(s => s.signatures.length >= 2);

    if (!allCompleted) {
      alert("All steps must be completed before closing the workflow!");
      return;
    }

    if (!allCriticalSigned) {
      alert("All Critical Control Points require double signature!");
      return;
    }

    authenticateSignature(() => {
      setActiveWorkflow(prev => ({
        ...prev,
        status: "completed",
        completedAt: new Date().toISOString(),
        completedBy: currentUser.name,
        auditTrail: [...prev.auditTrail, {
          action: "Workflow Completed",
          user: currentUser.name,
          timestamp: new Date().toISOString(),
          details: "All steps completed and signed. Batch Record finalized."
        }]
      }));

      setBatches(prev => prev.map(b => 
        b.id === activeWorkflow.batchId 
          ? { ...b, status: "completed", progress: 100 }
          : b
      ));

      alert("Workflow completed successfully! Completed Batch Record generated.");
    });
  };

  // Simulate auto-capture from equipment
  const autoCaptureData = (stepId) => {
    const simulatedValue = Math.random() * 100 + 50; // Random value between 50-150
    completeWorkflowStep(stepId, parseFloat(simulatedValue.toFixed(2)));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Workflow Execution</h2>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">
            User: <strong>{currentUser.name}</strong>
          </span>
          <select 
            value={currentUser.role}
            onChange={(e) => setCurrentUser({...currentUser, role: e.target.value})}
            className="border px-3 py-1 rounded text-sm"
          >
            <option value="Operator">Operator</option>
            <option value="QA">QA</option>
            <option value="Master">Master</option>
            <option value="Planner">Planner</option>
          </select>
        </div>
      </div>

      {/* Start Workflow Section */}
      {!activeWorkflow && currentUser.role === "Planner" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Start New Workflow</h3>
          <div className="space-y-3">
            {batches.filter(b => b.status !== "completed").map(batch => (
              <div key={batch.id} className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
                <div>
                  <div className="font-semibold text-lg">{batch.id}</div>
                  <div className="text-gray-600">{batch.product}</div>
                  <div className="text-xs text-gray-500">Status: Released for Production</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {templates.filter(t => t.status === "approved").map(template => (
                    <button
                      key={template.id}
                      onClick={() => startWorkflow(batch.id, template.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Start: {template.name} v{template.version}
                    </button>
                  ))}
                  {templates.filter(t => t.status === "approved").length === 0 && (
                    <span className="text-red-500 text-sm">No approved templates</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Workflow */}
      {activeWorkflow && (
        <div>
          {/* Workflow Header */}
          <div className="bg-white border rounded-lg p-6 mb-6 shadow">
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <h3 className="text-xl font-bold">Batch: {activeWorkflow.batchId}</h3>
                <p className="text-gray-600">Template: {activeWorkflow.templateName} v{activeWorkflow.templateVersion}</p>
                <p className="text-sm text-gray-500">
                  Started: {new Date(activeWorkflow.startedAt).toLocaleString()} by {activeWorkflow.startedBy}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className={`px-4 py-2 rounded-lg font-semibold mb-2 ${
                  activeWorkflow.status === "running" ? "bg-green-100 text-green-800" :
                  activeWorkflow.status === "paused" ? "bg-yellow-100 text-yellow-800" :
                  activeWorkflow.status === "stopped" ? "bg-red-100 text-red-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {activeWorkflow.status.toUpperCase()}
                </span>
                
                {currentUser.role === "Master" && activeWorkflow.status !== "completed" && (
                  <div className="flex space-x-2">
                    {activeWorkflow.status === "running" && (
                      <button onClick={pauseWorkflow} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
                        Pause
                      </button>
                    )}
                    {activeWorkflow.status === "paused" && (
                      <button onClick={resumeWorkflow} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                        Resume
                      </button>
                    )}
                    <button onClick={completeWorkflow} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                      Complete Workflow
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all" 
                style={{width: `${Math.round((workflow.filter(s => s.status === "completed").length / workflow.length) * 100)}%`}}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {workflow.filter(s => s.status === "completed").length} / {workflow.length} steps completed
            </p>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-4">
            {workflow.map((step, index) => (
              <div 
                key={step.id} 
                className={`border-2 rounded-lg p-6 transition-all ${
                  step.status === "active" ? "bg-blue-50 border-blue-400 shadow-lg" :
                  step.status === "completed" ? "bg-green-50 border-green-300" :
                  step.status === "blocked" ? "bg-red-50 border-red-400" :
                  step.status === "pending_qa_approval" ? "bg-yellow-50 border-yellow-400" :
                  "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      step.status === "completed" ? "bg-green-500 text-white" :
                      step.status === "active" ? "bg-blue-500 text-white" :
                      step.status === "blocked" ? "bg-red-500 text-white" :
                      step.status === "pending_qa_approval" ? "bg-yellow-500 text-white" :
                      "bg-gray-300 text-gray-600"
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-xl font-bold">{step.name}</h4>
                        <span className="px-3 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600">
                          {step.type.toUpperCase()}
                        </span>
                        {step.isCritical && (
                          <span className="px-3 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                            CCP - Double Signature Required
                          </span>
                        )}
                      </div>
                      
                      {step.instruction && (
                        <div className="bg-white border-l-4 border-blue-500 rounded p-4 mb-3">
                          <p className="font-semibold text-blue-600 mb-1">Instructions:</p>
                          <p>{step.instruction}</p>
                        </div>
                      )}

                      {step.materials && step.materials.length > 0 && (
                        <div className="bg-white border-l-4 border-purple-500 rounded p-4 mb-3">
                          <p className="font-semibold text-purple-600 mb-2">Materials Required:</p>
                          <ul className="space-y-1">
                            {step.materials.map(m => (
                              <li key={m.id} className="flex justify-between text-sm">
                                <span>{m.item}</span>
                                <span className="text-gray-600">{m.quantity} {m.unit} (Lot: {m.lotNumber})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Active Step Actions */}
                {step.status === "active" && activeWorkflow.status === "running" && (
                  <div className="mt-4 p-4 bg-white border-2 border-blue-300 rounded-lg">
                    {step.type === "instruction" && (
                      <button
                        onClick={() => completeWorkflowStep(step.id, "confirmed")}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                        disabled={currentUser.role !== "Operator"}
                      >
                        Acknowledge & Sign
                      </button>
                    )}

                    {step.type === "input" && (
                      <div className="space-y-3">
                        <label className="block font-semibold">
                          Enter {step.param}
                          {step.min !== undefined && step.max !== undefined && (
                            <span className="text-red-600"> (Limits: {step.min} - {step.max})</span>
                          )}
                        </label>
                        <div className="flex space-x-3">
                          <input
                            type="number"
                            step="0.01"
                            className="border-2 px-4 py-3 rounded-lg flex-1 text-lg"
                            placeholder={`Enter ${step.param}`}
                            id={`input-${step.id}`}
                            disabled={currentUser.role !== "Operator"}
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById(`input-${step.id}`);
                              const value = parseFloat(input.value);
                              if (!isNaN(value)) {
                                completeWorkflowStep(step.id, value);
                                input.value = '';
                              }
                            }}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
                            disabled={currentUser.role !== "Operator"}
                          >
                            Submit & Sign
                          </button>
                        </div>
                      </div>
                    )}

                    {step.type === "control" && (
                      <div className="space-y-3">
                        <label className="block font-semibold">
                          Enter {step.param}
                          <span className="text-red-600"> (Critical Limits: {step.min} - {step.max})</span>
                        </label>
                        <div className="flex space-x-3">
                          <input
                            type="number"
                            step="0.01"
                            className="border-2 px-4 py-3 rounded-lg flex-1 text-lg"
                            placeholder={`Enter ${step.param}`}
                            id={`input-${step.id}`}
                            disabled={currentUser.role !== "Operator"}
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById(`input-${step.id}`);
                              const value = parseFloat(input.value);
                              if (!isNaN(value)) {
                                completeWorkflowStep(step.id, value);
                                input.value = '';
                              }
                            }}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
                            disabled={currentUser.role !== "Operator"}
                          >
                            Submit & Sign
                          </button>
                          <button
                            onClick={() => autoCaptureData(step.id)}
                            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold"
                            disabled={currentUser.role !== "Operator"}
                          >
                            Auto Capture
                          </button>
                        </div>
                        <p className="text-xs text-gray-600">Auto Capture simulates data from equipment</p>
                      </div>
                    )}

                    <div className="flex space-x-3 pt-4 border-t mt-4">
                      <button
                        onClick={() => reportDeviationFromStep(step.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 font-semibold"
                        disabled={currentUser.role !== "Operator"}
                      >
                        Register Deviation
                      </button>
                    </div>
                  </div>
                )}

                {/* Completed Step */}
                {step.status === "completed" && (
                  <div className="mt-4 bg-white border rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Value:</p>
                        <p className="text-lg font-bold">{step.value}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Completed By:</p>
                        <p className="text-lg font-bold">{step.completedBy}</p>
                        <p className="text-xs text-gray-500">{new Date(step.completedAt).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <p className="font-semibold mb-2">Electronic Signatures:</p>
                      {step.signatures.map((sig, idx) => (
                        <div key={idx} className="bg-gray-50 p-2 rounded mb-1 text-sm">
                          <span className="font-semibold">{sig.signedBy}</span>
                          <span className="text-gray-600"> ({sig.role})</span>
                          <span className="text-gray-500"> - {new Date(sig.timestamp).toLocaleString()}</span>
                          <div className="text-xs text-gray-400">Method: {sig.method} | IP: {sig.ipAddress}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending QA Approval */}
                {step.status === "pending_qa_approval" && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded">
                    <p className="font-semibold text-yellow-800 mb-3">
                      Awaiting QA Approval - Critical Control Point
                    </p>
                    <p className="text-sm mb-3">
                      Operator signed: {step.signatures[0]?.signedBy} at {new Date(step.signatures[0]?.timestamp).toLocaleString()}
                    </p>
                    <button
                      onClick={() => addSecondSignature(step.id)}
                      className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 font-semibold"
                      disabled={currentUser.role !== "QA"}
                    >
                      Add QA Signature (Double Sign)
                    </button>
                    {currentUser.role !== "QA" && (
                      <p className="text-xs text-gray-600 mt-2">Only QA can approve Critical Control Points</p>
                    )}
                  </div>
                )}

                {/* Blocked Step */}
                {step.status === "blocked" && (
                  <div className="mt-4 bg-red-100 border-2 border-red-300 rounded-lg p-4">
                    <p className="font-semibold text-red-800 mb-2">
                      BLOCKED - Deviation Reported
                    </p>
                    <p className="text-red-700">{step.deviation}</p>
                    <p className="text-xs text-red-600 mt-2">
                      Workflow paused. QA must review and approve/reject deviation to continue.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Deviations Panel */}
          {deviations.filter(d => d.batchId === activeWorkflow.batchId).length > 0 && (
            <div className="mt-6 bg-white border rounded-lg p-6 shadow">
              <h3 className="text-xl font-semibold mb-4">Deviations for this Workflow</h3>
              <div className="space-y-3">
                {deviations.filter(d => d.batchId === activeWorkflow.batchId).map(deviation => (
                  <div key={deviation.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-lg">{deviation.stepName}</h4>
                          <span className={`px-3 py-1 rounded text-xs font-semibold ${
                            deviation.status === 'approved' ? 'bg-green-100 text-green-800' :
                            deviation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {deviation.status.toUpperCase()}
                          </span>
                          <span className="px-3 py-1 rounded text-xs bg-gray-100 text-gray-600">
                            {deviation.classification}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-2">{deviation.description}</p>
                        
                        <div className="text-sm text-gray-500">
                          <div>Reported by: {deviation.reportedBy} on {deviation.reportedDate}</div>
                          {deviation.investigator && (
                            <div>Investigator: {deviation.investigator}</div>
                          )}
                          {deviation.resolution && (
                            <div className="mt-2 p-2 bg-blue-50 rounded">
                              <strong>Resolution:</strong> {deviation.resolution}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {deviation.status === 'pending' && currentUser.role === 'QA' && (
                      <div className="flex space-x-2 mt-3 pt-3 border-t">
                        <button
                          onClick={() => handleDeviation(deviation.id, "approved")}
                          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center space-x-1"
                        >
                          <span>Approve - Continue Workflow</span>
                        </button>
                        <button
                          onClick={() => handleDeviation(deviation.id, "rejected")}
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center space-x-1"
                        >
                          <span>Reject - Stop Workflow</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Trail */}
          <div className="mt-6 bg-white border rounded-lg p-6 shadow">
            <h3 className="text-xl font-semibold mb-4">Audit Trail</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {activeWorkflow.auditTrail?.map((entry, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 bg-gray-50 p-3 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{entry.action}</p>
                      <p className="text-sm text-gray-600">{entry.details}</p>
                      {entry.signature && (
                        <div className="text-xs text-gray-500 mt-1 bg-white p-2 rounded">
                          E-Signature: {entry.signature.signedBy} ({entry.signature.role}) | 
                          Method: {entry.signature.method} | IP: {entry.signature.ipAddress}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      <div>{entry.user}</div>
                      <div>{new Date(entry.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Active Workflow */}
      {!activeWorkflow && currentUser.role !== "Planner" && (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">🔄</div>
          <p className="text-xl text-gray-600 mb-2">No active workflow</p>
          <p className="text-gray-500">Contact a Planner to start a workflow for a batch</p>
        </div>
      )}
    </div>
  );
}