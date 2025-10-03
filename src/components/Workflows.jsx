import React from 'react';
import { Plus, Trash2, Save, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function Workflows({ 
  workflows, 
  setWorkflows, 
  formulas,
  equipment,
  workStations,
  addAuditEntry,
  language = 'en'
}) {
  
  const [editingWorkflow, setEditingWorkflow] = React.useState(null);
  const [expandedWorkflow, setExpandedWorkflow] = React.useState(null);
  
  const t = (key) => {
    const translations = {
      en: {
        workflowConfiguration: "Workflow Configuration",
        newWorkflow: "New Workflow",
        name: "Name",
        formula: "Formula",
        version: "Version",
        steps: "Steps",
        status: "Status",
        actions: "Actions",
        details: "Details"
      },
      ru: {
        workflowConfiguration: "Конфигурация процессов",
        newWorkflow: "Новый процесс",
        name: "Название",
        formula: "Формула",
        version: "Версия",
        steps: "Шаги",
        status: "Статус",
        actions: "Действия",
        details: "Подробности"
      }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
  };
  
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
    setEditingWorkflow(newWorkflow.id);
    addAuditEntry("Workflow Created", `New workflow created`);
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
    addAuditEntry("Workflow Modified", `Step added to workflow`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('workflowConfiguration')}</h2>
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={addNewWorkflow}
        >
          <Plus className="w-4 h-4" />
          <span>{t('newWorkflow')}</span>
        </button>
      </div>
      
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs">{t('name')}</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">{t('formula')}</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">{t('version')}</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">{t('steps')}</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">{t('status')}</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((wf, idx) => {
              const selectedFormula = formulas.find(f => f.id === wf.formulaId);
              const isEditing = editingWorkflow === wf.id;
              const isExpanded = expandedWorkflow === wf.id;
              
              return (
                <React.Fragment key={wf.id}>
                  <tr className={`border-b hover:bg-white/40 transition-colors ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                    <td className="py-2 px-2 text-xs font-semibold">{wf.name}</td>
                    <td className="py-2 px-2 text-xs">{selectedFormula?.productName || 'Not set'}</td>
                    <td className="py-2 px-2 text-xs">{wf.version}</td>
                    <td className="py-2 px-2 text-xs">{wf.steps.length}</td>
                    <td className="py-2 px-2">
                      <select
                        className={`text-xs px-2 py-1 rounded font-semibold ${
                          wf.status === "approved" ? "bg-green-100 text-green-800" :
                          wf.status === "review" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}
                        value={wf.status}
                        onChange={(e) => {
                          setWorkflows(prev => prev.map(w => 
                            w.id === wf.id ? {...w, status: e.target.value} : w
                          ));
                          addAuditEntry("Workflow Status Changed", `Status changed to ${e.target.value}`);
                        }}
                      >
                        <option value="draft">Draft</option>
                        <option value="review">Review</option>
                        <option value="approved">Approved</option>
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setEditingWorkflow(isEditing ? null : wf.id)}
                          className="p-1 hover:bg-blue-100 rounded text-blue-600"
                          title="Edit"
                        >
                          {isEditing ? <Save className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => setExpandedWorkflow(isExpanded ? null : wf.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Details"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {(isEditing || isExpanded) && (
                    <tr>
                      <td colSpan="6" className="py-3 px-3 bg-white/60">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-xs font-semibold mb-1">Workflow Name</label>
                                <input
                                  className="border rounded px-2 py-1 w-full text-xs"
                                  value={wf.name}
                                  onChange={(e) => {
                                    setWorkflows(prev => prev.map(w => 
                                      w.id === wf.id ? {...w, name: e.target.value} : w
                                    ));
                                    addAuditEntry("Workflow Modified", `Name changed to ${e.target.value}`);
                                  }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold mb-1">Link Formula</label>
                                <select
                                  className="border rounded px-2 py-1 w-full text-xs"
                                  value={wf.formulaId || ""}
                                  onChange={(e) => {
                                    setWorkflows(prev => prev.map(w => 
                                      w.id === wf.id ? {...w, formulaId: parseInt(e.target.value) || null} : w
                                    ));
                                    addAuditEntry("Workflow Modified", `Formula linked`);
                                  }}
                                >
                                  <option value="">Select Formula</option>
                                  {formulas.map(f => (
                                    <option key={f.id} value={f.id}>{f.productName}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold mb-1">Version</label>
                                <input
                                  className="border rounded px-2 py-1 w-full text-xs"
                                  value={wf.version}
                                  onChange={(e) => {
                                    setWorkflows(prev => prev.map(w => 
                                      w.id === wf.id ? {...w, version: e.target.value} : w
                                    ));
                                  }}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <label className="font-semibold text-xs">Workflow Steps</label>
                                <button
                                  onClick={() => addWorkflowStep(wf.id)}
                                  className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                                >
                                  + Add Step
                                </button>
                              </div>
                              
                              <div className="space-y-1">
                                {wf.steps.map((step, stepIdx) => (
                                  <div key={step.id} className="border rounded p-2 bg-white/40">
                                    <div className="grid grid-cols-6 gap-2 mb-2">
                                      <div>
                                        <label className="block text-xs mb-1">Step Name</label>
                                        <input
                                          className="border rounded px-2 py-1 w-full text-xs"
                                          value={step.name}
                                          onChange={(e) => {
                                            setWorkflows(prev => prev.map(w => 
                                              w.id === wf.id 
                                                ? {
                                                    ...w,
                                                    steps: w.steps.map(s => 
                                                      s.id === step.id ? {...s, name: e.target.value} : s
                                                    )
                                                  }
                                                : w
                                            ));
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs mb-1">Type</label>
                                        <select
                                          className="border rounded px-2 py-1 w-full text-xs"
                                          value={step.type}
                                          onChange={(e) => {
                                            setWorkflows(prev => prev.map(w => 
                                              w.id === wf.id 
                                                ? {
                                                    ...w,
                                                    steps: w.steps.map(s => 
                                                      s.id === step.id ? {...s, type: e.target.value} : s
                                                    )
                                                  }
                                                : w
                                            ));
                                          }}
                                        >
                                          <option value="process">Process</option>
                                          <option value="dispensing">Dispensing</option>
                                          <option value="qc">QC</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs mb-1">Equipment</label>
                                        <select
                                          className="border rounded px-2 py-1 w-full text-xs"
                                          value={step.equipmentId || ""}
                                          onChange={(e) => {
                                            setWorkflows(prev => prev.map(w => 
                                              w.id === wf.id 
                                                ? {
                                                    ...w,
                                                    steps: w.steps.map(s => 
                                                      s.id === step.id ? {...s, equipmentId: parseInt(e.target.value) || null} : s
                                                    )
                                                  }
                                                : w
                                            ));
                                          }}
                                        >
                                          <option value="">None</option>
                                          {equipment.map(eq => (
                                            <option key={eq.id} value={eq.id}>{eq.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs mb-1">Station</label>
                                        <select
                                          className="border rounded px-2 py-1 w-full text-xs"
                                          value={step.workStationId || ""}
                                          onChange={(e) => {
                                            setWorkflows(prev => prev.map(w => 
                                              w.id === wf.id 
                                                ? {
                                                    ...w,
                                                    steps: w.steps.map(s => 
                                                      s.id === step.id ? {...s, workStationId: parseInt(e.target.value) || null} : s
                                                    )
                                                  }
                                                : w
                                            ));
                                          }}
                                        >
                                          <option value="">None</option>
                                          {workStations.map(ws => (
                                            <option key={ws.id} value={ws.id}>{ws.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                      
                                      {step.type === "dispensing" && selectedFormula && (
                                        <div>
                                          <label className="block text-xs mb-1">Material</label>
                                          <select
                                            className="border rounded px-2 py-1 w-full text-xs"
                                            value={step.formulaBomId || ""}
                                            onChange={(e) => {
                                              setWorkflows(prev => prev.map(w => 
                                                w.id === wf.id 
                                                  ? {
                                                      ...w,
                                                      steps: w.steps.map(s => 
                                                        s.id === step.id ? {...s, formulaBomId: parseInt(e.target.value) || null} : s
                                                      )
                                                    }
                                                  : w
                                              ));
                                            }}
                                          >
                                            <option value="">Select</option>
                                            {selectedFormula.bom.map(b => (
                                              <option key={b.id} value={b.id}>
                                                {b.materialArticle}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      )}
                                      
                                      {step.type === "qc" && (
                                        <>
                                          <div>
                                            <label className="block text-xs mb-1">Parameter</label>
                                            <input
                                              className="border rounded px-2 py-1 w-full text-xs"
                                              placeholder="Weight, pH..."
                                              value={step.qcParameters?.parameter || ""}
                                              onChange={(e) => {
                                                setWorkflows(prev => prev.map(w => 
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
                                                ));
                                              }}
                                            />
                                          </div>
                                        </>
                                      )}
                                      
                                      <button
                                        onClick={() => {
                                          setWorkflows(prev => prev.map(w => 
                                            w.id === wf.id 
                                              ? {...w, steps: w.steps.filter(s => s.id !== step.id)}
                                              : w
                                          ));
                                        }}
                                        className="text-red-600 hover:bg-red-100 p-1 rounded self-end"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                    
                                    {step.type === "qc" && (
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-xs mb-1">Min</label>
                                          <input
                                            type="number"
                                            className="border rounded px-2 py-1 w-full text-xs"
                                            value={step.qcParameters?.min || ""}
                                            onChange={(e) => {
                                              setWorkflows(prev => prev.map(w => 
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
                                              ));
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs mb-1">Max</label>
                                          <input
                                            type="number"
                                            className="border rounded px-2 py-1 w-full text-xs"
                                            value={step.qcParameters?.max || ""}
                                            onChange={(e) => {
                                              setWorkflows(prev => prev.map(w => 
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
                                              ));
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="mt-2">
                                      <label className="block text-xs mb-1">Instruction</label>
                                      <textarea
                                        className="border rounded px-2 py-1 w-full text-xs"
                                        rows="1"
                                        value={step.instruction}
                                        onChange={(e) => {
                                          setWorkflows(prev => prev.map(w => 
                                            w.id === wf.id 
                                              ? {
                                                  ...w,
                                                  steps: w.steps.map(s => 
                                                    s.id === step.id ? {...s, instruction: e.target.value} : s
                                                  )
                                                }
                                              : w
                                          ));
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => setEditingWorkflow(null)}
                              className="btn-primary text-xs px-3 py-1"
                            >
                              Save & Close
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div><span className="font-semibold">Created:</span> {wf.createdDate}</div>
                              <div><span className="font-semibold">Formula:</span> {selectedFormula?.productName || 'Not set'}</div>
                              <div><span className="font-semibold">Steps:</span> {wf.steps.length}</div>
                            </div>
                            <div>
                              <span className="font-semibold">Steps:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {wf.steps.map((s, idx) => (
                                  <span key={s.id} className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                    {idx + 1}. {s.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
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