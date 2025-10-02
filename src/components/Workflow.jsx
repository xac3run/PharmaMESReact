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

  // Start workflow from template (Planner function)
  const startWorkflow = (batchId, templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (!template || template.status !== "approved") {
      alert("Only approved templates can be used to start workflow!");
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
      isCritical: step.type === "control"
    }));

    setWorkflow(workflowSteps);
    setActiveWorkflow({
      id: Date.now(),
      batchId: batchId,
      templateId: templateId,
      templateName: template.name,
      status: "running",
      startedAt: new Date().toISOString(),
      startedBy: currentUser.name,
      pausedAt: null,
      currentStep: 0
    });

    setBatches(prev => prev.map(b => 
      b.id === batchId ? { ...b, status: "in_progress", progress: 0 } : b
    ));

    alert(`Workflow started for batch ${batchId}`);
  };

  // Pause workflow (Master function)
  const pauseWorkflow = () => {
    if (!activeWorkflow) return;
    setActiveWorkflow(prev => ({
      ...prev,
      status: "paused",
      pausedAt: new Date().toISOString()
    }));
  };

  // Resume workflow (Master function)
  const resumeWorkflow = () => {
    if (!activeWorkflow) return;
    setActiveWorkflow(prev => ({
      ...prev,
      status: "running",
      pausedAt: null
    }));
  };

  // Complete workflow step with signature (Operator function)
  const completeWorkflowStep = (stepId, value) => {
    const step = workflow.find(s => s.id === stepId);
    if (!step) return;

    // Check if value is within limits for control steps
    if (step.type === "control" && (value < step.min || value > step.max)) {
      alert(`Value ${value} is out of limits (${step.min}-${step.max}). Please register a deviation.`);
      return;
    }

    const signature = {
      signedBy: currentUser.name,
      role: currentUser.role,
      timestamp: new Date().toISOString()
    };

    setWorkflow(prev => prev.map(s => {
      if (s.id === stepId) {
        return {
          ...s,
          value: value,
          status: "completed",
          completedBy: currentUser.name,
          completedAt: new Date().toISOString(),
          signatures: [...s.signatures, signature]
        };
      }
      // Activate next step
      if (s.stepNumber === step.stepNumber + 1) {
        return { ...s, status: "active" };
      }
      return s;
    }));

    // Update workflow progress
    const completedSteps = workflow.filter(s => s.status === "completed").length + 1;
    const totalSteps = workflow.length;
    const progress = Math.round((completedSteps / totalSteps) * 100);

    if (activeWorkflow) {
      setActiveWorkflow(prev => ({ ...prev, currentStep: step.stepNumber }));
      setBatches(prev => prev.map(b => 
        b.id === activeWorkflow.batchId 
          ? { ...b, progress: progress, status: progress === 100 ? "completed" : "in_progress" }
          : b
      ));
    }
  };

  // Add second signature for critical steps (QA function)
  const addSecondSignature = (stepId) => {
    const qaSignature = prompt("Enter QA name for approval:");
    if (!qaSignature) return;

    setWorkflow(prev => prev.map(s => 
      s.id === stepId 
        ? {
            ...s,
            signatures: [...s.signatures, {
              signedBy: qaSignature,
              role: "QA",
              timestamp: new Date().toISOString()
            }]
          }
        : s
    ));
  };

  // Register deviation from workflow step
  const reportDeviationFromStep = (stepId) => {
    const deviationText = prompt("Enter deviation description:");
    if (!deviationText) return;

    const step = workflow.find(s => s.id === stepId);
    const newDeviation = {
      id: Date.now(),
      batchId: activeWorkflow?.batchId,
      stepId: stepId,
      stepName: step?.name,
      description: deviationText,
      status: "pending",
      reportedBy: currentUser.name,
      reportedDate: new Date().toISOString().split('T')[0],
      investigator: null
    };

    setDeviations(prev => [...prev, newDeviation]);
    
    setWorkflow(prev => prev.map(s => 
      s.id === stepId 
        ? { ...s, status: "blocked", deviation: deviationText }
        : s
    ));

    pauseWorkflow();
  };

  // Complete entire workflow (Master function)
  const completeWorkflow = () => {
    if (!activeWorkflow) return;

    const allCompleted = workflow.every(s => s.status === "completed");
    const allCriticalSigned = workflow
      .filter(s => s.requiresDoubleSignature)
      .every(s => s.signatures.length >= 2);

    if (!allCompleted) {
      alert("All steps must be completed before closing the workflow!");
      return;
    }

    if (!allCriticalSigned) {
      alert("All critical steps require double signature before closing!");
      return;
    }

    setActiveWorkflow(prev => ({
      ...prev,
      status: "completed",
      completedAt: new Date().toISOString()
    }));

    setBatches(prev => prev.map(b => 
      b.id === activeWorkflow.batchId 
        ? { ...b, status: "completed", progress: 100 }
        : b
    ));

    alert("Workflow completed successfully!");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Workflow Execution 🔄</h2>
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

      {/* Start Workflow Section (Planner only) */}
      {!activeWorkflow && currentUser.role === "Planner" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">🚀 Start New Workflow</h3>
          <div className="space-y-3">
            {batches.filter(b => b.status !== "completed").map(batch => (
              <div key={batch.id} className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
                <div>
                  <div className="font-semibold text-lg">{batch.id}</div>
                  <div className="text-gray-600">{batch.product}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {templates.filter(t => t.status === "approved").map(template => (
                    <button
                      key={template.id}
                      onClick={() => startWorkflow(batch.id, template.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Start with {template.name} v{template.version}
                    </button>
                  ))}
                  {templates.filter(t => t.status === "approved").length === 0 && (
                    <span className="text-red-500 text-sm">No approved templates available</span>
                  )}
                </div>
              </div>
            ))}
            {batches.filter(b => b.status !== "completed").length === 0 && (
              <div className="text-center py-8 text-gray-500">
                All batches are completed
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Workflow Section */}
      {activeWorkflow && (
        <div>
          {/* Workflow Header */}
          <div className="bg-white border rounded-lg p-6 mb-6 shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">Batch: {activeWorkflow.batchId}</h3>
                <p className="text-gray-600">Template: {activeWorkflow.templateName}</p>
                <p className="text-sm text-gray-500">
                  Started by {activeWorkflow.startedBy} at {new Date(activeWorkflow.startedAt).toLocaleString()}
                </p>
                {activeWorkflow.pausedAt && (
                  <p className="text-sm text-yellow-600">
                    Paused at {new Date(activeWorkflow.pausedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-4 py-2 rounded-lg font-semibold ${
                  activeWorkflow.status === "running" ? "bg-green-100 text-green-800" :
                  activeWorkflow.status === "paused" ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {activeWorkflow.status.toUpperCase()}
                </span>
                
                {currentUser.role === "Master" && (
                  <div className="flex space-x-2">
                    {activeWorkflow.status === "running" && (
                      <button
                        onClick={pauseWorkflow}
                        className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                      >
                        ⏸️ Pause
                      </button>
                    )}
                    {activeWorkflow.status === "paused" && (
                      <button
                        onClick={resumeWorkflow}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        ▶️ Resume
                      </button>
                    )}
                    <button
                      onClick={completeWorkflow}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      ✅ Complete Workflow
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all" 
                style={{
                  width: `${Math.round((workflow.filter(s => s.status === "completed").length / workflow.length) * 100)}%`
                }}
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
                  "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      step.status === "completed" ? "bg-green-500 text-white" :
                      step.status === "active" ? "bg-blue-500 text-white animate-pulse" :
                      step.status === "blocked" ? "bg-red-500 text-white" :
                      "bg-gray-300 text-gray-600"
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-xl font-bold">{step.name}</h4>
                        <span className={`px-3 py-1 rounded text-xs font-semibold ${
                          step.isCritical ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"
                        }`}>
                          {step.type.toUpperCase()} {step.isCritical && "⚠️ CRITICAL"}
                        </span>
                      </div>
                      
                      {step.instruction && (
                        <div className="bg-white border-l-4 border-blue-500 rounded p-4 mb-3">
                          <p className="text-sm"><strong className="text-blue-600">📋 Instruction:</strong></p>
                          <p className="mt-1">{step.instruction}</p>
                        </div>
                      )}

                      {step.materials && step.materials.length > 0 && (
                        <div className="bg-white border-l-4 border-purple-500 rounded p-4 mb-3">
                          <p className="text-sm font-semibold text-purple-600 mb-2">📦 Materials Required:</p>
                          <ul className="text-sm space-y-1">
                            {step.materials.map(m => (
                              <li key={m.id} className="flex justify-between">
                                <span>• {m.item}</span>
                                <span className="text-gray-600">{m.quantity} {m.unit} (Lot: {m.lotNumber})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Active Step - Input Section */}
                {step.status === "active" && activeWorkflow.status === "running" && (
                  <div className="mt-4 p-4 bg-white border-2 border-blue-300 rounded-lg">
                    {step.type === "instruction" && (
                      <div>
                        <button
                          onClick={() => completeWorkflowStep(step.id, "confirmed")}
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                          disabled={currentUser.role !== "Operator"}
                        >
                          ✓ Confirm Step Completed
                        </button>
                        {currentUser.role !== "Operator" && (
                          <p className="text-sm text-red-600 mt-2">Only Operators can complete this step</p>
                        )}
                      </div>
                    )}

                    {(step.type === "input" || step.type === "control") && (
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold">
                          Enter {step.param}
                          {step.type === "control" && (
                            <span className="text-red-600"> (Limits: {step.min} - {step.max})</span>
                          )}
                        </label>
                        <div className="flex space-x-3">
                          <input
                            type="number"
                            className="border-2 px-4 py-3 rounded-lg flex-1 text-lg"
                            placeholder={`Enter ${step.param}`}
                            id={`input-${step.id}`}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && currentUser.role === "Operator") {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value)) {
                                  completeWorkflowStep(step.id, value);
                                  e.target.value = '';
                                }
                              }
                            }}
                            disabled={currentUser.role !== "Operator"}
                          />
                          <button
                            onClick={(e) => {
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
                            Submit
                          </button>
                        </div>
                        {currentUser.role !== "Operator" && (
                          <p className="text-sm text-red-600">Only Operators can input data</p>
                        )}
                      </div>
                    )}

                    <div className="flex space-x-3 pt-4 border-t mt-4">
                      <button
                        onClick={() => reportDeviationFromStep(step.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 font-semibold"
                        disabled={currentUser.role !== "Operator"}
                      >
                        🚨 Report Deviation
                      </button>
                    </div>
                  </div>
                )}

                {/* Completed Step - Show Results */}
                {step.status === "completed" && (
                  <div className="mt-4 space-y-3">
                    <div className="bg-white border rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Value Entered:</p>
                          <p className="text-lg font-bold">{step.value}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Completed By:</p>
                          <p className="text-lg font-bold">{step.completedBy}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(step.completedAt).toLocaleString()}
                      </p>
                      
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-semibold mb-2">Electronic Signatures:</p>
                        {step.signatures.map((sig, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-sm bg-gray-50 p-2 rounded mb-1">
                            <span className="font-semibold">✍️ {sig.signedBy}</span>
                            <span className="text-gray-600">({sig.role})</span>
                            <span className="text-gray-500">- {new Date(sig.timestamp).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      {step.requiresDoubleSignature && step.signatures.length < 2 && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded">
                          <p className="text-sm text-yellow-800 font-semibold mb-2">
                            ⚠️ This critical step requires QA approval
                          </p>
                          <button
                            onClick={() => addSecondSignature(step.id)}
                            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 font-semibold"
                            disabled={currentUser.role !== "QA"}
                          >
                            ✍️ Add QA Signature
                          </button>
                          {currentUser.role !== "QA" && (
                            <p className="text-xs text-gray-600 mt-2">Only QA personnel can approve this step</p>
                          )}
                        </div>
                      )}

                      {step.requiresDoubleSignature && step.signatures.length >= 2 && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-300 rounded">
                          <p className="text-sm text-green-800 font-semibold">
                            ✅ Double signature completed
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Blocked Step haspotcавмв*/}
                {step.status === "blocked" && (
                  <div className="mt-4 bg-red-100 border-2 border-red-300 rounded-lg p-4">
                    <p className="text-sm text-red-800 font-semibold">
                      <strong>⚠️ BLOCKED:</strong> {step.deviation || "Value out of limits or deviation reported"}
                    </p>
                    <p className="text-xs text-red-600 mt-2">
                      Workflow is paused. QA must approve the deviation to continue.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Workflow Active - Other Roles */}
      {!activeWorkflow && currentUser.role !== "Planner" && (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">🔄</div>
          <p className="text-xl text-gray-600 mb-2">No active workflow</p>
          <p className="text-gray-500">Please contact a Planner to start a workflow for a batch</p>
        </div>
      )}
    </div>
  );
}