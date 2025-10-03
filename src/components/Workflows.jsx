import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function Workflows({ 
  workflows, 
  setWorkflows, 
  formulas,
  equipment,
  workStations
}) {
  
  const addNewWorkflow = () => {
    const newWorkflow = {
      id: Date.now(),
      name: "New Workflow",
      formulaId: null,
      version: "0.1",
      status: "draft",
      createdDate: new Date().toISOString().split('T')[0],
      steps: []
    };
    setWorkflows(prev => [...prev, newWorkflow]);
  };

  const addWorkflowStep = (workflowId) => {
    const newStep = {
      id: Date.now(),
      name: "New Step",
      type: "process",
      formulaBomId: null,
      equipmentId: null,
      workStationId: null,
      requiresQC: false,
      instruction: "",
      stepParameters: {},
      qcParameters: {}
    };
    
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { ...w, steps: [...w.steps, newStep] }
        : w
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Workflow Configuration</h2>
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={addNewWorkflow}
        >
          <Plus className="w-4 h-4" />
          <span>New Workflow</span>
        </button>
      </div>
      
      {workflows.map(wf => {
        const selectedFormula = formulas.find(f => f.id === wf.formulaId);
        
        return (
          <div key={wf.id} className="glass-card">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <input
                    className="text-xl font-bold bg-transparent border-b border-gray-300 focus:border-blue-600 px-2 py-1"
                    value={wf.name}
                    onChange={(e) => setWorkflows(prev => prev.map(w => 
                      w.id === wf.id ? {...w, name: e.target.value} : w
                    ))}
                  />
                  <select
                    className="border rounded px-3 py-2 text-sm"
                    value={wf.formulaId || ""}
                    onChange={(e) => setWorkflows(prev => prev.map(w => 
                      w.id === wf.id ? {...w, formulaId: parseInt(e.target.value) || null} : w
                    ))}
                  >
                    <option value="">Select Formula</option>
                    {formulas.map(f => (
                      <option key={f.id} value={f.id}>{f.productName}</option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-gray-600">
                  Version: {wf.version} | Created: {wf.createdDate}
                </p>
              </div>
              <select
                className="border rounded px-3 py-2"
                value={wf.status}
                onChange={(e) => setWorkflows(prev => prev.map(w => 
                  w.id === wf.id ? {...w, status: e.target.value} : w
                ))}
              >
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="approved">Approved</option>
              </select>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Workflow Steps</h4>
                <button
                  onClick={() => addWorkflowStep(wf.id)}
                  className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  + Add Step
                </button>
              </div>
              
              {wf.steps.map((step, idx) => (
                <div key={step.id} className="border rounded-lg p-4 bg-white/60">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Step Name</label>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={step.name}
                        onChange={(e) => setWorkflows(prev => prev.map(w => 
                          w.id === wf.id 
                            ? {
                                ...w,
                                steps: w.steps.map(s => 
                                  s.id === step.id ? {...s, name: e.target.value} : s
                                )
                              }
                            : w
                        ))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Type</label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={step.type}
                        onChange={(e) => setWorkflows(prev => prev.map(w => 
                          w.id === wf.id 
                            ? {
                                ...w,
                                steps: w.steps.map(s => 
                                  s.id === step.id ? {...s, type: e.target.value} : s
                                )
                              }
                            : w
                        ))}
                      >
                        <option value="process">Process</option>
                        <option value="dispensing">Dispensing</option>
                        <option value="qc">QC Check</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Equipment</label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={step.equipmentId || ""}
                        onChange={(e) => setWorkflows(prev => prev.map(w => 
                          w.id === wf.id 
                            ? {
                                ...w,
                                steps: w.steps.map(s => 
                                  s.id === step.id ? {...s, equipmentId: parseInt(e.target.value) || null} : s
                                )
                              }
                            : w
                        ))}
                      >
                        <option value="">None</option>
                        {equipment.map(eq => (
                          <option key={eq.id} value={eq.id}>{eq.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Work Station</label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={step.workStationId || ""}
                        onChange={(e) => setWorkflows(prev => prev.map(w => 
                          w.id === wf.id 
                            ? {
                                ...w,
                                steps: w.steps.map(s => 
                                  s.id === step.id ? {...s, workStationId: parseInt(e.target.value) || null} : s
                                )
                              }
                            : w
                        ))}
                      >
                        <option value="">None</option>
                        {workStations.map(ws => (
                          <option key={ws.id} value={ws.id}>{ws.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {step.type === "dispensing" && selectedFormula && (
                      <div>
                        <label className="block text-xs font-semibold mb-1">Formula Material</label>
                        <select
                          className="border rounded px-3 py-2 w-full"
                          value={step.formulaBomId || ""}
                          onChange={(e) => setWorkflows(prev => prev.map(w => 
                            w.id === wf.id 
                              ? {
                                  ...w,
                                  steps: w.steps.map(s => 
                                    s.id === step.id ? {...s, formulaBomId: parseInt(e.target.value) || null} : s
                                  )
                                }
                              : w
                          ))}
                        >
                          <option value="">Select Material</option>
                          {selectedFormula.bom.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.materialArticle} ({b.quantity}{b.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {step.type === "qc" && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold mb-1">QC Parameter</label>
                          <input
                            className="border rounded px-3 py-2 w-full"
                            placeholder="e.g., Weight, pH"
                            value={step.qcParameters?.parameter || ""}
                            onChange={(e) => setWorkflows(prev => prev.map(w => 
                              w.id === wf.id 
                                ? {
                                    ...w,
                                    steps: w.steps.map(s => 
                                      s.id === step.id 
                                        ? {...s, qcParameters: {...s.qcParameters, parameter: e.target.value}} 
                                        : s
                                    )
                                  }
                                : w
                            ))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Min Value</label>
                          <input
                            type="number"
                            className="border rounded px-3 py-2 w-full"
                            value={step.qcParameters?.min || ""}
                            onChange={(e) => setWorkflows(prev => prev.map(w => 
                              w.id === wf.id 
                                ? {
                                    ...w,
                                    steps: w.steps.map(s => 
                                      s.id === step.id 
                                        ? {...s, qcParameters: {...s.qcParameters, min: parseFloat(e.target.value)}} 
                                        : s
                                    )
                                  }
                                : w
                            ))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Max Value</label>
                          <input
                            type="number"
                            className="border rounded px-3 py-2 w-full"
                            value={step.qcParameters?.max || ""}
                            onChange={(e) => setWorkflows(prev => prev.map(w => 
                              w.id === wf.id 
                                ? {
                                    ...w,
                                    steps: w.steps.map(s => 
                                      s.id === step.id 
                                        ? {...s, qcParameters: {...s.qcParameters, max: parseFloat(e.target.value)}} 
                                        : s
                                    )
                                  }
                                : w
                            ))}
                          />
                        </div>
                      </>
                    )}
                    
                    <div className="col-span-3">
                      <label className="block text-xs font-semibold mb-1">Instruction</label>
                      <textarea
                        className="border rounded px-3 py-2 w-full"
                        rows="2"
                        value={step.instruction}
                        onChange={(e) => setWorkflows(prev => prev.map(w => 
                          w.id === wf.id 
                            ? {
                                ...w,
                                steps: w.steps.map(s => 
                                  s.id === step.id ? {...s, instruction: e.target.value} : s
                                )
                              }
                            : w
                        ))}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <span className="text-xs text-gray-500">Step {idx + 1}</span>
                    <button
                      onClick={() => setWorkflows(prev => prev.map(w => 
                        w.id === wf.id 
                          ? {...w, steps: w.steps.filter(s => s.id !== step.id)}
                          : w
                      ))}
                      className="text-red-600 hover:bg-red-100 p-2 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}