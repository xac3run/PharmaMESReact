import { useState } from "react";
import { FileText, Plus, Save, Copy, Edit3, Trash2, CheckCircle } from 'lucide-react';

export default function Templates({ templates, setTemplates }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const addTemplate = () => {
    setTemplates(prev => [...prev, {
      id: Date.now(),
      name: "New Template",
      version: "0.1",
      status: "draft",
      createdDate: new Date().toISOString().split('T')[0],
      bom: [],
      steps: []
    }]);
  };

  const cloneTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const newTemplate = {
        ...template,
        id: Date.now(),
        name: template.name + " (Copy)",
        version: "0.1",
        status: "draft",
        createdDate: new Date().toISOString().split('T')[0],
        bom: template.bom ? [...template.bom.map(item => ({ ...item, id: Date.now() + Math.random() }))] : [],
        steps: template.steps ? [...template.steps.map(step => ({ 
          ...step, 
          id: Date.now() + Math.random(), 
          materials: step.materials ? [...step.materials.map(m => ({ ...m, id: Date.now() + Math.random() }))] : [] 
        }))] : []
      };
      setTemplates(prev => [...prev, newTemplate]);
    }
  };

  const createNewVersion = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const currentVersion = parseFloat(template.version);
      const newVersion = (currentVersion + 0.1).toFixed(1);
      const newTemplate = {
        ...template,
        id: Date.now(),
        version: newVersion,
        status: "draft",
        createdDate: new Date().toISOString().split('T')[0],
        bom: template.bom ? [...template.bom.map(item => ({ ...item, id: Date.now() + Math.random() }))] : [],
        steps: template.steps ? [...template.steps.map(step => ({ 
          ...step, 
          id: Date.now() + Math.random(), 
          materials: step.materials ? [...step.materials.map(m => ({ ...m, id: Date.now() + Math.random() }))] : [] 
        }))] : []
      };
      setTemplates(prev => [...prev, newTemplate]);
    }
  };

  const saveTemplate = (templateId) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, lastSaved: new Date().toISOString() } : t
    ));
    alert('Template saved successfully!');
  };

  const updateTemplate = (templateId, field, value) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, [field]: value } : t
    ));
  };

  const addStep = (templateId) => {
    setTemplates(prev => prev.map(t =>
      t.id === templateId
        ? { ...t, steps: [...(t.steps || []), { 
            id: Date.now(), 
            name: "New Step", 
            type: "instruction", 
            param: "", 
            min: null, 
            max: null, 
            materials: [], 
            instruction: "" 
          }] }
        : t
    ));
  };

  const updateStep = (templateId, stepId, field, value) => {
    setTemplates(prev => prev.map(t =>
      t.id === templateId
        ? { ...t, steps: (t.steps || []).map(s => s.id === stepId ? { ...s, [field]: value } : s) }
        : t
    ));
  };

  const removeStep = (templateId, stepId) => {
    setTemplates(prev => prev.map(t =>
      t.id === templateId
        ? { ...t, steps: (t.steps || []).filter(s => s.id !== stepId) }
        : t
    ));
  };

  const addMaterialToStep = (templateId, stepId) => {
    setTemplates(prev => prev.map(t =>
      t.id === templateId
        ? { 
            ...t, 
            steps: (t.steps || []).map(s => 
              s.id === stepId 
                ? { 
                    ...s, 
                    materials: [...(s.materials || []), { 
                      id: Date.now(), 
                      item: "New Material", 
                      quantity: 0, 
                      unit: "mg", 
                      lotNumber: "" 
                    }] 
                  }
                : s
            )
          }
        : t
    ));
  };

  const updateStepMaterial = (templateId, stepId, materialId, field, value) => {
    setTemplates(prev => prev.map(t =>
      t.id === templateId
        ? { 
            ...t, 
            steps: (t.steps || []).map(s => 
              s.id === stepId 
                ? { 
                    ...s, 
                    materials: (s.materials || []).map(m => 
                      m.id === materialId ? { ...m, [field]: value } : m
                    )
                  }
                : s
            )
          }
        : t
    ));
  };

  const removeMaterialFromStep = (templateId, stepId, materialId) => {
    setTemplates(prev => prev.map(t =>
      t.id === templateId
        ? { 
            ...t, 
            steps: (t.steps || []).map(s => 
              s.id === stepId 
                ? { 
                    ...s, 
                    materials: (s.materials || []).filter(m => m.id !== materialId)
                  }
                : s
            )
          }
        : t
    ));
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8 animate-fade-in">
        <h2 className="text-4xl font-bold mb-2 glow-text" style={{
          background: 'linear-gradient(135deg, rgb(49,85,77) 0%, rgb(122,154,145) 50%, rgb(195,224,218) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          eBR Templates
        </h2>
        <p className="text-gray-600 animate-fade-in-delay">Electronic Batch Record template configuration</p>
      </div>

      <div className="flex justify-end animate-slide-up">
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={addTemplate}
        >
          <Plus className="w-5 h-5" />
          <span>Add Template</span>
        </button>
      </div>

      <div className="space-y-4">
        {templates.map((t, index) => (
          <div 
            key={t.id} 
            className="glass-card animate-slide-up hover-lift"
            style={{animationDelay: `${index * 0.1}s`}}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-3">
                  <FileText className="w-6 h-6 text-teal-600" />
                  <input
                    className="text-xl font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-teal-600 focus:outline-none"
                    value={t.name}
                    onChange={(e) => updateTemplate(t.id, 'name', e.target.value)}
                  />
                  <input
                    className="text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-teal-600 focus:outline-none w-16"
                    value={t.version}
                    onChange={(e) => updateTemplate(t.id, 'version', e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Created: {t.createdDate}</span>
                  <select
                    value={t.status}
                    onChange={(e) => updateTemplate(t.id, 'status', e.target.value)}
                    className="border rounded px-3 py-1"
                  >
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="approved">Approved</option>
                  </select>
                  {t.status === 'approved' && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => saveTemplate(t.id)}
                  className="p-2 text-green-600 hover:bg-green-100 rounded transition-all"
                  title="Save Template"
                >
                  <Save className="w-5 h-5" />
                </button>
                <button
                  onClick={() => createNewVersion(t.id)}
                  className="p-2 text-purple-600 hover:bg-purple-100 rounded transition-all"
                  title="Create New Version"
                >
                  📝
                </button>
                <button
                  onClick={() => cloneTemplate(t.id)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-all"
                  title="Clone Template"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedTemplate(selectedTemplate === t.id ? null : t.id)}
                  className="p-2 text-teal-600 hover:bg-teal-100 rounded transition-all"
                  title="Edit Template"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {selectedTemplate === t.id && (
              <div className="border-t pt-4 space-y-4 mt-4">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Process Steps</h4>
                    <button
                      onClick={() => addStep(t.id)}
                      className="btn-primary flex items-center space-x-2 text-sm px-4 py-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Step</span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(t.steps || []).map((step, idx) => (
                      <div key={step.id} className="border rounded-lg p-4 bg-white/60">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1 font-semibold">Step Name</label>
                            <input
                              className="w-full border px-3 py-2 rounded-lg"
                              value={step.name}
                              onChange={(e) => updateStep(t.id, step.id, "name", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1 font-semibold">Type</label>
                            <select
                              className="w-full border px-3 py-2 rounded-lg"
                              value={step.type}
                              onChange={(e) => updateStep(t.id, step.id, "type", e.target.value)}
                            >
                              <option value="instruction">Instruction</option>
                              <option value="input">Data Input</option>
                              <option value="control">Quality Control</option>
                            </select>
                          </div>
                        </div>

                        {(step.type === "input" || step.type === "control") && (
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1 font-semibold">Parameter</label>
                              <input
                                className="w-full border px-3 py-2 rounded-lg"
                                placeholder="Parameter name"
                                value={step.param || ""}
                                onChange={(e) => updateStep(t.id, step.id, "param", e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1 font-semibold">Min</label>
                              <input
                                type="number"
                                className="w-full border px-3 py-2 rounded-lg"
                                value={step.min || ""}
                                onChange={(e) => updateStep(t.id, step.id, "min", parseFloat(e.target.value))}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1 font-semibold">Max</label>
                              <input
                                type="number"
                                className="w-full border px-3 py-2 rounded-lg"
                                value={step.max || ""}
                                onChange={(e) => updateStep(t.id, step.id, "max", parseFloat(e.target.value))}
                              />
                            </div>
                          </div>
                        )}

                        <div className="mb-3">
                          <label className="block text-xs text-gray-600 mb-1 font-semibold">Instructions</label>
                          <textarea
                            className="w-full border px-3 py-2 rounded-lg"
                            rows="2"
                            value={step.instruction || ""}
                            onChange={(e) => updateStep(t.id, step.id, "instruction", e.target.value)}
                          />
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t">
                          <span className="text-xs text-gray-500">Step {idx + 1}</span>
                          <button
                            onClick={() => removeStep(t.id, step.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}