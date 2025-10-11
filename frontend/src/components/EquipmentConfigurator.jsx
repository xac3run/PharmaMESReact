import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Save, ChevronDown, ChevronUp, X, Settings } from 'lucide-react';

export default function EquipmentConfigurator({
  equipmentClasses = {},
  setEquipmentClasses,
  equipment = [],
  setEquipment,
  addAuditEntry,
  language = 'en'
}) {
  const [editingClass, setEditingClass] = useState(null);
  const [newClassName, setNewClassName] = useState('');
  const [newSubclass, setNewSubclass] = useState('');
  const [expandedClass, setExpandedClass] = useState(null);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [expandedEquipment, setExpandedEquipment] = useState(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [currentClassName, setCurrentClassName] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [showCreateInstanceForm, setShowCreateInstanceForm] = useState(false);
  const [newInstance, setNewInstance] = useState({
    name: '',
    description: '',
    className: '',
    subclass: '',
    templateId: '',
    location: 'TBD'
  });

  const openTemplateModal = (className, template = null) => {
    setCurrentClassName(className);
    if (template) {
      setCurrentTemplate({ ...template });
    } else {
      setCurrentTemplate({
        id: Date.now(),
        name: '',
        description: '',
        baseTemplateId: null,
        parameters: {},
        customParameters: [],
        pharmaProperties: {
          currentBatch: { enabled: true, type: 'text' },
          lastBatch: { enabled: true, type: 'text' },
          batchHistory: { enabled: true, type: 'array' },
          cleaningStatus: { enabled: true, type: 'select', options: ['clean', 'dirty', 'in_progress'] },
          lastCleaningDate: { enabled: true, type: 'date' },
          nextCleaningDue: { enabled: true, type: 'date' },
          qualificationStatus: { enabled: true, type: 'select', options: ['qualified', 'not_qualified', 'requalification_due'] },
          qualificationExpiry: { enabled: true, type: 'date' },
          crossContaminationRisk: { enabled: true, type: 'select', options: ['low', 'medium', 'high'] },
          dedicatedProduct: { enabled: false, type: 'text' },
          changeControlId: { enabled: true, type: 'text' },
          maintenanceSchedule: { enabled: true, type: 'text' },
          lastPreventiveMaintenance: { enabled: true, type: 'date' },
          holdStatus: { enabled: true, type: 'select', options: ['released', 'on_hold'] },
          areaClassification: { enabled: false, type: 'select', options: ['Grade A', 'Grade B', 'Grade C', 'Grade D', 'Unclassified'] },
          sanitizationMethod: { enabled: false, type: 'text' }
        },
        calibrationIntervalDays: 365,
        defaultCalibrationStatus: 'valid',
        requiresCleaning: true,
        requiresQualification: true,
        additionalFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    setTemplateModalOpen(true);
  };

  const closeTemplateModal = () => {
    setTemplateModalOpen(false);
    setCurrentTemplate(null);
    setCurrentClassName(null);
    setActiveTab('basic');
  };

  const saveTemplate = () => {
    if (!currentTemplate || !currentTemplate.name || !currentTemplate.name.trim()) {
      alert('Template name is required');
      return;
    }

    if (!currentClassName || !equipmentClasses[currentClassName]) {
      alert('Invalid class name');
      return;
    }

    const updatedTemplate = {
      ...currentTemplate,
      updatedAt: new Date().toISOString()
    };

    setEquipmentClasses(prev => {
      const classData = prev[currentClassName] || { subclasses: [], templates: [] };
      const templates = classData.templates || [];
      
      const existingIndex = templates.findIndex(t => t && t.id === updatedTemplate.id);
      const newTemplates = existingIndex >= 0
        ? templates.map((t, i) => i === existingIndex ? updatedTemplate : t)
        : [...templates, updatedTemplate];

      return {
        ...prev,
        [currentClassName]: {
          subclasses: classData.subclasses || [],
          templates: newTemplates
        }
      };
    });

    const existingIndex = (equipmentClasses[currentClassName]?.templates || []).findIndex(t => t && t.id === updatedTemplate.id);
    addAuditEntry(
      'Equipment Template Saved',
      `Template ${updatedTemplate.name} ${existingIndex >= 0 ? 'updated' : 'created'} for class ${currentClassName}`
    );

    closeTemplateModal();
  };

  const deleteTemplate = (className, templateId) => {
    if (!confirm('Delete this template? Equipment using it will not be affected.')) return;

    setEquipmentClasses(prev => {
      const classData = prev[className] || { subclasses: [], templates: [] };
      
      return {
        ...prev,
        [className]: {
          ...classData,
          templates: (classData.templates || []).filter(t => t.id !== templateId)
        }
      };
    });

    addAuditEntry('Equipment Template Deleted', `Template deleted from class ${className}`);
  };

  const addParameterToTemplate = (paramType) => {
    const newParam = paramType === 'global' 
      ? { name: 'newParameter', type: 'number', min: 0, max: 100, unit: '', defaultValue: 0 }
      : { name: 'newField', type: 'text', defaultValue: '', required: false };

    setCurrentTemplate(prev => ({
      ...prev,
      [paramType === 'global' ? 'parameters' : 'customParameters']: 
        paramType === 'global'
          ? { ...(prev.parameters || {}), [newParam.name]: newParam }
          : [...(prev.customParameters || []), newParam]
    }));
  };

  const updateTemplateParameter = (paramType, index, field, value) => {
    setCurrentTemplate(prev => {
      if (paramType === 'global') {
        const paramNames = Object.keys(prev.parameters || {});
        const paramName = paramNames[index];
        if (!paramName) return prev;
        
        return {
          ...prev,
          parameters: {
            ...(prev.parameters || {}),
            [paramName]: { ...(prev.parameters[paramName] || {}), [field]: value }
          }
        };
      } else {
        const newCustomParams = [...(prev.customParameters || [])];
        if (newCustomParams[index]) {
          newCustomParams[index] = { ...newCustomParams[index], [field]: value };
        }
        return { ...prev, customParameters: newCustomParams };
      }
    });
  };

  const removeTemplateParameter = (paramType, index) => {
    setCurrentTemplate(prev => {
      if (paramType === 'global') {
        const paramNames = Object.keys(prev.parameters || {});
        const paramName = paramNames[index];
        if (!paramName) return prev;
        
        const { [paramName]: removed, ...rest } = prev.parameters || {};
        return { ...prev, parameters: rest };
      } else {
        return {
          ...prev,
          customParameters: (prev.customParameters || []).filter((_, i) => i !== index)
        };
      }
    });
  };

  const updatePharmaProperty = (propName, field, value) => {
    setCurrentTemplate(prev => ({
      ...prev,
      pharmaProperties: {
        ...(prev.pharmaProperties || {}),
        [propName]: {
          ...(prev.pharmaProperties?.[propName] || {}),
          [field]: value
        }
      }
    }));
  };

  const addClass = () => {
    if (!newClassName.trim()) return;
    setEquipmentClasses(prev => ({
      ...prev,
      [newClassName]: {
        subclasses: [],
        templates: []
      }
    }));
    setNewClassName('');
    addAuditEntry("Equipment Class Created", `New class ${newClassName} created`);
  };

  const addSubclass = (className) => {
    if (!newSubclass.trim()) return;
    setEquipmentClasses(prev => {
      const classData = prev[className] || { subclasses: [], templates: [] };
      const currentSubclasses = Array.isArray(classData) ? classData : (classData.subclasses || []);
      
      return {
        ...prev,
        [className]: {
          subclasses: [...currentSubclasses, newSubclass],
          templates: Array.isArray(classData) ? [] : (classData.templates || [])
        }
      };
    });
    setNewSubclass('');
    addAuditEntry("Equipment Subclass Created", `${newSubclass} added to ${className}`);
  };

  const removeClass = (className) => {
    if (confirm(`Delete class ${className}?`)) {
      const newClasses = { ...equipmentClasses };
      delete newClasses[className];
      setEquipmentClasses(newClasses);
      addAuditEntry("Equipment Class Deleted", `Class ${className} deleted`);
    }
  };

  const removeSubclass = (className, subclass) => {
    setEquipmentClasses(prev => {
      const classData = prev[className] || { subclasses: [], templates: [] };
      const currentSubclasses = Array.isArray(classData) ? classData : (classData.subclasses || []);
      
      return {
        ...prev,
        [className]: {
          subclasses: currentSubclasses.filter(s => s !== subclass),
          templates: Array.isArray(classData) ? [] : (classData.templates || [])
        }
      };
    });
    addAuditEntry("Equipment Subclass Deleted", `${subclass} removed from ${className}`);
  };

  const addEquipmentInstance = (className, subclass) => {
    const newEquipment = {
      id: Date.now(),
      name: `${className}-${subclass}-${Math.floor(Math.random() * 1000)}`,
      class: className,
      subclass,
      status: 'operational',
      location: 'Main Area',
      calibrationStatus: 'valid',
      globalParameters: {},
      customParameters: [],
    };
    setEquipment(prev => [...prev, newEquipment]);
    addAuditEntry("Equipment Created", `Equipment ${newEquipment.name} created (${className}/${subclass})`);
  };

  const updateEquipmentField = (id, field, value) => {
    setEquipment(prev =>
      prev.map(eq => (eq.id === id ? { ...eq, [field]: value } : eq))
    );
  };

  const addCustomParameter = (equipmentId) => {
    setEquipment(prev =>
      prev.map(eq => {
        if (eq.id === equipmentId) {
          const newParam = { name: 'New Param', value: '', unit: '', minValue: null, maxValue: null };
          return { ...eq, customParameters: [...(eq.customParameters || []), newParam] };
        }
        return eq;
      })
    );
  };

  const saveEquipmentChanges = (equipmentId) => {
    const eq = equipment.find(e => e.id === equipmentId);
    addAuditEntry("Equipment Updated", `${eq.name} updated`);
    setEditingEquipment(null);
  };

  const createEquipmentInstance = () => {
    if (!newInstance.name || !newInstance.className || !newInstance.subclass) {
      alert('Please fill Name, Class, and Subclass');
      return;
    }

    const classData = equipmentClasses[newInstance.className] || { subclasses: [], templates: [] };
    const selectedTemplate = newInstance.templateId 
      ? (classData.templates || []).find(t => t.id.toString() === newInstance.templateId.toString())
      : null;

    // Создаем pharma-специфичные поля из шаблона
    const pharmaFields = {};
    if (selectedTemplate?.pharmaProperties) {
      Object.entries(selectedTemplate.pharmaProperties).forEach(([key, prop]) => {
        if (prop.enabled) {
          switch (prop.type) {
            case 'text':
              pharmaFields[key] = '';
              break;
            case 'date':
              pharmaFields[key] = null;
              break;
            case 'select':
              pharmaFields[key] = prop.options?.[0] || '';
              break;
            case 'array':
              pharmaFields[key] = [];
              break;
            default:
              pharmaFields[key] = null;
          }
        }
      });
    }

    // Копируем глобальные параметры с default values
    const globalParameters = {};
    if (selectedTemplate?.parameters) {
      Object.entries(selectedTemplate.parameters).forEach(([key, param]) => {
        globalParameters[key] = param.defaultValue !== undefined ? param.defaultValue : '';
      });
    }

    // Копируем custom параметры с default values
    const customParameters = selectedTemplate?.customParameters 
      ? selectedTemplate.customParameters.map(param => ({
          ...param,
          value: param.defaultValue || ''
        }))
      : [];

    const equipmentInstance = {
      id: Date.now(),
      name: newInstance.name,
      description: newInstance.description || '',
      class: newInstance.className,
      subclass: newInstance.subclass,
      status: 'operational',
      location: newInstance.location || 'TBD',
      templateId: selectedTemplate?.id || null,
      templateName: selectedTemplate?.name || null,
      
      globalParameters,
      customParameters,
      
      ...pharmaFields,
      
      calibrationStatus: selectedTemplate?.defaultCalibrationStatus || 'valid',
      nextCalibrationDate: new Date(
        Date.now() + (selectedTemplate?.calibrationIntervalDays || 365) * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0],
      calibrationIntervalDays: selectedTemplate?.calibrationIntervalDays || 365,
      
      requiresCleaning: selectedTemplate?.requiresCleaning || false,
      requiresQualification: selectedTemplate?.requiresQualification || false,
      
      ...(selectedTemplate?.additionalFields || {})
    };

    setEquipment(prev => [...prev, equipmentInstance]);
    addAuditEntry(
      'Equipment Instance Created',
      `${equipmentInstance.name} created${selectedTemplate ? ` from template ${selectedTemplate.name}` : ''}`
    );

    setNewInstance({
      name: '',
      description: '',
      className: '',
      subclass: '',
      templateId: '',
      location: 'TBD'
    });
    setShowCreateInstanceForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Template Configuration Modal */}
      {templateModalOpen && currentTemplate && currentClassName && equipmentClasses[currentClassName] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {currentTemplate?.id ? 'Edit' : 'Create'} Equipment Template
              </h2>
              <button onClick={closeTemplateModal} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b bg-gray-50">
              <div className="flex space-x-4 px-6">
                {['basic', 'parameters', 'custom', 'pharma', 'calibration'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab === 'basic' && 'Basic Info'}
                    {tab === 'parameters' && 'Global Parameters'}
                    {tab === 'custom' && 'Custom Fields'}
                    {tab === 'pharma' && 'Pharma/GMP'}
                    {tab === 'calibration' && 'Cal & Qual'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Template Name *</label>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={currentTemplate?.name || ''}
                        onChange={(e) => setCurrentTemplate(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Standard Analytical Balance"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Base Template (Inheritance)</label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={currentTemplate?.baseTemplateId || ''}
                        onChange={(e) => {
                          const baseId = e.target.value ? parseInt(e.target.value) : null;
                          if (baseId && currentClassName && equipmentClasses[currentClassName]) {
                            const classData = equipmentClasses[currentClassName] || { subclasses: [], templates: [] };
                            const baseTemplate = (classData.templates || []).find(t => t.id === baseId);
                            if (baseTemplate) {
                              setCurrentTemplate(prev => ({
                                ...prev,
                                baseTemplateId: baseId,
                                parameters: { ...(baseTemplate.parameters || {}), ...(prev?.parameters || {}) },
                                customParameters: [...(baseTemplate.customParameters || []), ...(prev?.customParameters || [])],
                                pharmaProperties: { ...(baseTemplate.pharmaProperties || {}), ...(prev?.pharmaProperties || {}) }
                              }));
                            }
                          } else {
                            setCurrentTemplate(prev => ({ ...prev, baseTemplateId: null }));
                          }
                        }}
                      >
                        <option value="">None (Base Template)</option>
                        {(() => {
                          if (!currentClassName || !equipmentClasses[currentClassName]) return null;
                          const classData = equipmentClasses[currentClassName] || { subclasses: [], templates: [] };
                          const templates = classData.templates || [];
                          return templates
                            .filter(t => t.id !== currentTemplate?.id)
                            .map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ));
                        })()}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Description</label>
                    <textarea
                      className="border rounded px-3 py-2 w-full"
                      rows="3"
                      value={currentTemplate?.description || ''}
                      onChange={(e) => setCurrentTemplate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Template description..."
                    />
                  </div>
                </div>
              )}

              {/* Global Parameters Tab */}
              {activeTab === 'parameters' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Global Parameters (Technical Specs)</h3>
                    <button
                      onClick={() => addParameterToTemplate('global')}
                      className="btn-primary text-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Parameter
                    </button>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(currentTemplate?.parameters || {}).map(([paramName, param], idx) => (
                      <div key={idx} className="flex items-center space-x-2 bg-gray-50 p-3 rounded">
                        <input
                          className="border rounded px-2 py-1 w-32"
                          placeholder="Name"
                          value={paramName}
                          onChange={(e) => {
                            const newName = e.target.value;
                            setCurrentTemplate(prev => {
                              const params = prev.parameters || {};
                              const { [paramName]: oldParam, ...rest } = params;
                              return {
                                ...prev,
                                parameters: { ...rest, [newName]: oldParam || {} }
                              };
                            });
                          }}
                        />
                        <select
                          className="border rounded px-2 py-1 w-24"
                          value={param?.type || 'number'}
                          onChange={(e) => updateTemplateParameter('global', idx, 'type', e.target.value)}
                        >
                          <option value="number">Number</option>
                          <option value="text">Text</option>
                        </select>
                        {(param?.type || 'number') === 'number' && (
                          <>
                            <input
                              type="number"
                              className="border rounded px-2 py-1 w-20"
                              placeholder="Min"
                              value={param?.min || ''}
                              onChange={(e) => updateTemplateParameter('global', idx, 'min', parseFloat(e.target.value))}
                            />
                            <input
                              type="number"
                              className="border rounded px-2 py-1 w-20"
                              placeholder="Max"
                              value={param?.max || ''}
                              onChange={(e) => updateTemplateParameter('global', idx, 'max', parseFloat(e.target.value))}
                            />
                            <input
                              type="number"
                              className="border rounded px-2 py-1 w-20"
                              placeholder="Default"
                              value={param?.defaultValue || ''}
                              onChange={(e) => updateTemplateParameter('global', idx, 'defaultValue', parseFloat(e.target.value))}
                            />
                            <input
                              className="border rounded px-2 py-1 w-20"
                              placeholder="Unit"
                              value={param?.unit || ''}
                              onChange={(e) => updateTemplateParameter('global', idx, 'unit', e.target.value)}
                            />
                          </>
                        )}
                        {(param?.type === 'text') && (
                          <input
                            className="border rounded px-2 py-1 flex-1"
                            placeholder="Default text..."
                            value={param?.defaultValue || ''}
                            onChange={(e) => updateTemplateParameter('global', idx, 'defaultValue', e.target.value)}
                          />
                        )}
                        {(param?.type === 'select') && (
                          <>
                            <input
                              className="border rounded px-2 py-1 flex-1"
                              placeholder="Options (comma-separated)"
                              value={param?.options?.join(', ') || ''}
                              onChange={(e) => updateTemplateParameter('global', idx, 'options', e.target.value.split(',').map(s => s.trim()))}
                            />
                            <select
                              className="border rounded px-2 py-1 w-32"
                              value={param?.defaultValue || ''}
                              onChange={(e) => updateTemplateParameter('global', idx, 'defaultValue', e.target.value)}
                            >
                              <option value="">Default...</option>
                              {(param?.options || []).map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </>
                        )}
                        <button
                          onClick={() => removeTemplateParameter('global', idx)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {Object.keys(currentTemplate?.parameters || {}).length === 0 && (
                      <p className="text-gray-500 text-sm">No global parameters yet. Add technical specifications.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Parameters Tab */}
              {activeTab === 'custom' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Custom Parameters (User Fields)</h3>
                    <button
                      onClick={() => addParameterToTemplate('custom')}
                      className="btn-primary text-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Field
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(currentTemplate?.customParameters || []).map((param, idx) => (
                      <div key={idx} className="flex items-center space-x-2 bg-blue-50 p-3 rounded">
                        <input
                          className="border rounded px-2 py-1 flex-1"
                          placeholder="Field Name"
                          value={param?.name || ''}
                          onChange={(e) => updateTemplateParameter('custom', idx, 'name', e.target.value)}
                        />
                        <select
                          className="border rounded px-2 py-1 w-32"
                          value={param?.type || 'text'}
                          onChange={(e) => updateTemplateParameter('custom', idx, 'type', e.target.value)}
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="boolean">Boolean</option>
                          <option value="select">Select</option>
                        </select>
                        {param?.type === 'select' && (
                          <input
                            className="border rounded px-2 py-1 flex-1"
                            placeholder="Options (comma-separated)"
                            value={param?.options?.join(', ') || ''}
                            onChange={(e) => updateTemplateParameter('custom', idx, 'options', e.target.value.split(',').map(s => s.trim()))}
                          />
                        )}
                        <input
                          className="border rounded px-2 py-1 w-32"
                          placeholder="Default Value"
                          value={param?.defaultValue || ''}
                          onChange={(e) => updateTemplateParameter('custom', idx, 'defaultValue', e.target.value)}
                        />
                        <label className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            checked={param?.required || false}
                            onChange={(e) => updateTemplateParameter('custom', idx, 'required', e.target.checked)}
                          />
                          <span className="text-sm">Required</span>
                        </label>
                        <button
                          onClick={() => removeTemplateParameter('custom', idx)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {(currentTemplate?.customParameters || []).length === 0 && (
                      <p className="text-gray-500 text-sm">No custom fields yet. Add user-defined parameters.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Pharma Properties Tab */}
              {activeTab === 'pharma' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Pharma/GMP Properties</h3>
                  <p className="text-sm text-gray-600">Enable properties needed for pharmaceutical manufacturing compliance.</p>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(currentTemplate?.pharmaProperties || {}).map(([propName, prop]) => (
                      <div key={propName} className="border rounded p-3 bg-green-50">
                        <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={prop?.enabled || false}
                              onChange={(e) => updatePharmaProperty(propName, 'enabled', e.target.checked)}
                            />
                            <span className="font-semibold text-sm">{propName.replace(/([A-Z])/g, ' $1').trim()}</span>
                          </label>
                          <span className="text-xs text-gray-500">{prop?.type || 'text'}</span>
                        </div>
                        {prop?.enabled && prop?.type === 'select' && (
                          <input
                            className="border rounded px-2 py-1 w-full text-xs"
                            placeholder="Options (comma-separated)"
                            value={prop?.options?.join(', ') || ''}
                            onChange={(e) => updatePharmaProperty(propName, 'options', e.target.value.split(',').map(s => s.trim()))}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Calibration & Qualification Tab */}
              {activeTab === 'calibration' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Calibration & Qualification Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Calibration Interval (days)</label>
                      <input
                        type="number"
                        className="border rounded px-3 py-2 w-full"
                        value={currentTemplate?.calibrationIntervalDays || 365}
                        onChange={(e) => setCurrentTemplate(prev => ({ ...prev, calibrationIntervalDays: parseInt(e.target.value) || 365 }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Default Calibration Status</label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={currentTemplate?.defaultCalibrationStatus || 'valid'}
                        onChange={(e) => setCurrentTemplate(prev => ({ ...prev, defaultCalibrationStatus: e.target.value }))}
                      >
                        <option value="valid">Valid</option>
                        <option value="due">Due</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex space-x-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={currentTemplate?.requiresCleaning || false}
                        onChange={(e) => setCurrentTemplate(prev => ({ ...prev, requiresCleaning: e.target.checked }))}
                      />
                      <span className="text-sm font-semibold">Requires Cleaning After Use</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={currentTemplate?.requiresQualification || false}
                        onChange={(e) => setCurrentTemplate(prev => ({ ...prev, requiresQualification: e.target.checked }))}
                      />
                      <span className="text-sm font-semibold">Requires Qualification</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={closeTemplateModal}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={saveTemplate}
                className="btn-primary"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Classes */}
      <div className="glass-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Equipment Classes</h2>
          <div className="flex space-x-2">
            <input
              className="border rounded px-3 py-2 text-sm"
              placeholder="New class name..."
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
            <button onClick={addClass} className="btn-primary">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs">Class Name</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Subclasses</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Templates</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Equipment Count</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {equipmentClasses && Object.keys(equipmentClasses).map((className, idx) => {
              const classData = equipmentClasses[className] || { subclasses: [], templates: [] };
              return (
              <React.Fragment key={className}>
                <tr className={`border-b hover:bg-white/40 transition-colors ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                  <td className="py-2 px-2 font-semibold text-xs">{className}</td>
                  <td className="py-2 px-2 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        const classData = equipmentClasses[className] || { subclasses: [], templates: [] };
                        const subclasses = Array.isArray(classData) ? classData : (classData.subclasses || []);
                        return (
                          <>
                            {subclasses.slice(0, 3).map(subclass => (
                              <span key={subclass} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                                {subclass}
                              </span>
                            ))}
                            {subclasses.length > 3 && (
                              <span className="text-gray-500 text-xs">
                                +{subclasses.length - 3} more
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-xs">
                    {(() => {
                      const classData = equipmentClasses[className] || { subclasses: [], templates: [] };
                      return (classData.templates || []).length;
                    })()} templates
                  </td>
                  <td className="py-2 px-2 text-xs">
                    {equipment.filter(eq => eq.class === className).length} units
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setExpandedClass(expandedClass === className ? null : className)}
                        className="p-1 hover:bg-blue-100 rounded text-blue-600"
                      >
                        {expandedClass === className ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingClass(editingClass === className ? null : className)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeClass(className)}
                        className="p-1 hover:bg-red-100 text-red-600 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>

                {(expandedClass === className || editingClass === className) && (
                  <tr>
                    <td colSpan="5" className="py-3 px-3 bg-white/60">
                      {editingClass === className ? (
                        <div className="space-y-3">
                          <div className="flex space-x-2 mb-2">
                            <input
                              className="border rounded px-2 py-1 flex-1 text-sm"
                              placeholder="Add new subclass..."
                              value={newSubclass}
                              onChange={(e) => setNewSubclass(e.target.value)}
                            />
                            <button
                              onClick={() => addSubclass(className)}
                              className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                            >
                              Add
                            </button>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            {(() => {
                              const classData = equipmentClasses[className] || { subclasses: [], templates: [] };
                              const subclasses = Array.isArray(classData) ? classData : (classData.subclasses || []);
                              return subclasses.map(subclass => (
                                <div
                                  key={subclass}
                                  className="flex items-center justify-between bg-blue-50 px-2 py-1 rounded text-sm"
                                >
                                  <span>{subclass}</span>
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() => removeSubclass(className, subclass)}
                                      className="text-red-600 hover:bg-red-100 rounded p-0.5"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => addEquipmentInstance(className, subclass)}
                                      className="text-green-600 hover:bg-green-100 rounded p-0.5"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>

                          {/* Templates Section */}
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-semibold text-sm">Equipment Templates</h4>
                              <button
                                onClick={() => openTemplateModal(className)}
                                className="text-xs bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 flex items-center"
                              >
                                <Plus className="w-3 h-3 mr-1" /> Create Template
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {(() => {
                                const classData = equipmentClasses[className] || { subclasses: [], templates: [] };
                                const templates = classData.templates || [];
                                
                                if (templates.length === 0) {
                                  return <p className="text-xs text-gray-500 col-span-2">No templates yet. Create one to speed up equipment setup.</p>;
                                }
                                
                                return templates.map(template => (
                                  <div key={template.id} className="bg-purple-50 border border-purple-200 rounded p-2">
                                    <div className="flex items-start justify-between mb-1">
                                      <div className="flex-1">
                                        <div className="font-semibold text-xs">{template.name}</div>
                                        <div className="text-xs text-gray-600">{template.description}</div>
                                      </div>
                                      <div className="flex space-x-1">
                                        <button
                                          onClick={() => openTemplateModal(className, template)}
                                          className="p-1 hover:bg-purple-200 rounded"
                                          title="Edit template"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => deleteTemplate(className, template.id)}
                                          className="p-1 hover:bg-red-200 text-red-600 rounded"
                                          title="Delete template"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-600 space-y-0.5">
                                      <div>Parameters: {Object.keys(template.parameters || {}).length}</div>
                                      <div>Custom Fields: {(template.customParameters || []).length}</div>
                                      <div>Calibration: {template.calibrationIntervalDays} days</div>
                                      {template.baseTemplateId && (
                                        <div className="text-blue-600">
                                          Inherits from: {templates.find(t => t.id === template.baseTemplateId)?.name || 'Unknown'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>

                          <button
                            onClick={() => setEditingClass(null)}
                            className="text-xs bg-gray-500 text-white px-3 py-1 rounded"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs space-y-2">
                          <div className="grid grid-cols-4 gap-2">
                            {(() => {
                              const classData = equipmentClasses[className] || { subclasses: [], templates: [] };
                              const subclasses = Array.isArray(classData) ? classData : (classData.subclasses || []);
                              return subclasses.map(subclass => (
                                <div
                                  key={subclass}
                                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-center"
                                >
                                  {subclass}
                                </div>
                              ));
                            })()}
                          </div>
                          <div className="text-gray-600">
                            Equipment instances:{' '}
                            {equipment
                              .filter(eq => eq.class === className)
                              .map(eq => eq.name)
                              .join(', ') || 'None'}
                          </div>
                          {(() => {
                            const classData = equipmentClasses[className] || { subclasses: [], templates: [] };
                            const templates = classData.templates || [];
                            return templates.length > 0 && (
                              <div className="text-gray-600">
                                Templates: {templates.map(t => t.name).join(', ')}
                              </div>
                            );
                          })()}
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

      {/* Equipment Instances */}
      <div className="glass-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Equipment Instances</h2>
          <button
            onClick={() => setShowCreateInstanceForm(!showCreateInstanceForm)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Instance</span>
          </button>
        </div>

        {/* Create Instance Form */}
        {showCreateInstanceForm && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-semibold mb-3">Create New Equipment Instance</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Instance Name *</label>
                <input
                  className="border rounded px-2 py-1 w-full text-sm"
                  placeholder="e.g., BAL-001"
                  value={newInstance.name}
                  onChange={(e) => setNewInstance(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Location</label>
                <input
                  className="border rounded px-2 py-1 w-full text-sm"
                  placeholder="e.g., Room 101"
                  value={newInstance.location}
                  onChange={(e) => setNewInstance(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Equipment Class *</label>
                <select
                  className="border rounded px-2 py-1 w-full text-sm"
                  value={newInstance.className}
                  onChange={(e) => setNewInstance(prev => ({ 
                    ...prev, 
                    className: e.target.value, 
                    subclass: '', 
                    templateId: '' 
                  }))}
                >
                  <option value="">Select Class...</option>
                  {Object.keys(equipmentClasses || {}).map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Subclass *</label>
                <select
                  className="border rounded px-2 py-1 w-full text-sm"
                  value={newInstance.subclass}
                  onChange={(e) => setNewInstance(prev => ({ ...prev, subclass: e.target.value }))}
                  disabled={!newInstance.className}
                >
                  <option value="">Select Subclass...</option>
                  {newInstance.className && (() => {
                    const classData = equipmentClasses[newInstance.className] || { subclasses: [], templates: [] };
                    const subclasses = Array.isArray(classData) ? classData : (classData.subclasses || []);
                    return subclasses.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ));
                  })()}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1">Template (Optional)</label>
                <select
                  className="border rounded px-2 py-1 w-full text-sm"
                  value={newInstance.templateId}
                  onChange={(e) => setNewInstance(prev => ({ ...prev, templateId: e.target.value }))}
                  disabled={!newInstance.className}
                >
                  <option value="">No Template - Basic Equipment</option>
                  {newInstance.className && (() => {
                    const classData = equipmentClasses[newInstance.className] || { subclasses: [], templates: [] };
                    return (classData.templates || []).map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.description}
                      </option>
                    ));
                  })()}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea
                  className="border rounded px-2 py-1 w-full text-sm"
                  rows="2"
                  placeholder="Equipment description..."
                  value={newInstance.description}
                  onChange={(e) => setNewInstance(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            {/* Template Preview */}
            {newInstance.templateId && newInstance.className && (() => {
              const classData = equipmentClasses[newInstance.className] || { subclasses: [], templates: [] };
              const template = (classData.templates || []).find(t => t.id.toString() === newInstance.templateId.toString());
              if (!template) return null;
              
              return (
                <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded">
                  <h4 className="font-semibold text-xs mb-2">Template Configuration Preview:</h4>
                  <div className="text-xs space-y-1">
                    <div><strong>Global Parameters:</strong> {Object.keys(template.parameters || {}).length}</div>
                    <div><strong>Custom Parameters:</strong> {(template.customParameters || []).length}</div>
                    <div><strong>Calibration:</strong> Every {template.calibrationIntervalDays} days</div>
                    <div><strong>Requires Cleaning:</strong> {template.requiresCleaning ? 'Yes' : 'No'}</div>
                    <div><strong>Requires Qualification:</strong> {template.requiresQualification ? 'Yes' : 'No'}</div>
                    <div className="mt-2">
                      <strong>Enabled Pharma Properties:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(template.pharmaProperties || {})
                          .filter(([_, prop]) => prop.enabled)
                          .map(([key]) => (
                            <span key={key} className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs">
                              {key}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex space-x-2 mt-3">
              <button
                onClick={createEquipmentInstance}
                className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                Create Instance
              </button>
              <button
                onClick={() => {
                  setShowCreateInstanceForm(false);
                  setNewInstance({
                    name: '',
                    description: '',
                    className: '',
                    subclass: '',
                    templateId: '',
                    location: 'TBD'
                  });
                }}
                className="text-sm bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs">Name</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Class</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Subclass</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Status</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Location</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Calibration</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Parameters</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map((eq, idx) => (
              <React.Fragment key={eq.id}>
                <tr className={`border-b hover:bg-white/40 transition-colors ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                  <td className="py-2 px-2 font-semibold text-xs">{eq.name}</td>
                  <td className="py-2 px-2 text-xs">{eq.class}</td>
                  <td className="py-2 px-2 text-xs">{eq.subclass}</td>
                  <td className="py-2 px-2 text-xs">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        eq.status === 'operational'
                          ? 'bg-green-100 text-green-800'
                          : eq.status === 'maintenance'
                          ? 'bg-yellow-100 text-yellow-800'
                          : eq.status === 'calibration'
                          ? 'bg-blue-100 text-blue-800'
                          : eq.status === 'cleaning'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {eq.status}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-xs">{eq.location}</td>
                  <td className="py-2 px-2 text-xs">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        eq.calibrationStatus === 'valid'
                          ? 'bg-green-100 text-green-800'
                          : eq.calibrationStatus === 'due'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {eq.calibrationStatus || 'valid'}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-xs">
                    {(Object.keys(eq.globalParameters || {}).length) + (eq.customParameters?.length || 0)} params
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setEditingEquipment(editingEquipment === eq.id ? null : eq.id)}
                        className="p-1 hover:bg-blue-100 rounded"
                        title={editingEquipment === eq.id ? 'Save mode off' : 'Edit equipment'}
                      >
                        {editingEquipment === eq.id ? <Save className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => setExpandedEquipment(expandedEquipment === eq.id ? null : eq.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title={expandedEquipment === eq.id ? 'Collapse' : 'Expand'}
                      >
                        {expandedEquipment === eq.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete equipment ${eq.name}?`)) {
                            setEquipment(prev => prev.filter(e => e.id !== eq.id));
                            addAuditEntry("Equipment Deleted", `${eq.name} removed`);
                          }
                        }}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>

                {(expandedEquipment === eq.id || editingEquipment === eq.id) && (
                  <tr>
                    <td colSpan="8" className="py-3 px-3 bg-white/60">
                      <div className="space-y-3">
                        {eq.templateName && (
                          <div className="bg-purple-50 border border-purple-200 rounded p-2 text-xs">
                            <strong>Created from template:</strong> {eq.templateName}
                          </div>
                        )}
                        
                        {eq.description && (
                          <div className="text-xs text-gray-600 mb-2">
                            <strong>Description:</strong> {eq.description}
                          </div>
                        )}
                        
                        {/* Editable top fields */}
                        {editingEquipment === eq.id && (
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <label className="block text-xs font-semibold mb-1">Name</label>
                              <input
                                className="border rounded px-2 py-1 w-full text-xs"
                                value={eq.name}
                                onChange={(e) => updateEquipmentField(eq.id, 'name', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1">Status</label>
                              <select
                                className="border rounded px-2 py-1 w-full text-xs"
                                value={eq.status}
                                onChange={(e) => updateEquipmentField(eq.id, 'status', e.target.value)}
                              >
                                <option value="operational">Operational</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="calibration">Calibration</option>
                                <option value="cleaning">Cleaning</option>
                                <option value="out_of_order">Out of Order</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1">Location</label>
                              <input
                                className="border rounded px-2 py-1 w-full text-xs"
                                value={eq.location}
                                onChange={(e) => updateEquipmentField(eq.id, 'location', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1">Calibration</label>
                              <select
                                className="border rounded px-2 py-1 w-full text-xs"
                                value={eq.calibrationStatus || 'valid'}
                                onChange={(e) => updateEquipmentField(eq.id, 'calibrationStatus', e.target.value)}
                              >
                                <option value="valid">Valid</option>
                                <option value="due">Due</option>
                                <option value="expired">Expired</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Parameters section */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-semibold">Parameters & Limits:</p>
                            {editingEquipment === eq.id && (
                              <button
                                onClick={() => addCustomParameter(eq.id)}
                                className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                              >
                                + Add Parameter
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {/* Global parameters (read-only for now) */}
                            {Object.entries(eq.globalParameters || {}).map(([key, value]) => (
                              <div key={key} className="bg-gray-50 px-2 py-1 rounded">
                                <span className="font-semibold">{key}:</span>{' '}
                                {Array.isArray(value) ? value.join(' - ') : String(value)}
                              </div>
                            ))}

                            {/* Custom parameters (editable) */}
                            {(eq.customParameters || []).map((param, pidx) => (
                              <div key={pidx} className="bg-blue-50 px-2 py-2 rounded">
                                {editingEquipment === eq.id ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-1">
                                      <input
                                        className="border rounded px-1 py-0.5 w-1/3"
                                        placeholder="Name"
                                        value={param.name}
                                        onChange={(e) =>
                                          setEquipment(prev =>
                                            prev.map(eqi => {
                                              if (eqi.id !== eq.id) return eqi;
                                              const cp = [...(eqi.customParameters || [])];
                                              cp[pidx] = { ...cp[pidx], name: e.target.value };
                                              return { ...eqi, customParameters: cp };
                                            })
                                          )
                                        }
                                      />
                                      <input
                                        className="border rounded px-1 py-0.5 w-1/4"
                                        placeholder="Value"
                                        value={param.value}
                                        onChange={(e) =>
                                          setEquipment(prev =>
                                            prev.map(eqi => {
                                              if (eqi.id !== eq.id) return eqi;
                                              const cp = [...(eqi.customParameters || [])];
                                              cp[pidx] = { ...cp[pidx], value: e.target.value };
                                              return { ...eqi, customParameters: cp };
                                            })
                                          )
                                        }
                                      />
                                      <input
                                        className="border rounded px-1 py-0.5 w-1/5"
                                        placeholder="Unit"
                                        value={param.unit || ''}
                                        onChange={(e) =>
                                          setEquipment(prev =>
                                            prev.map(eqi => {
                                              if (eqi.id !== eq.id) return eqi;
                                              const cp = [...(eqi.customParameters || [])];
                                              cp[pidx] = { ...cp[pidx], unit: e.target.value };
                                              return { ...eqi, customParameters: cp };
                                            })
                                          )
                                        }
                                      />
                                      <button
                                        className="ml-1 text-red-600 hover:bg-red-100 rounded p-0.5"
                                        onClick={() =>
                                          setEquipment(prev =>
                                            prev.map(eqi => {
                                              if (eqi.id !== eq.id) return eqi;
                                              const cp = [...(eqi.customParameters || [])];
                                              cp.splice(pidx, 1);
                                              return { ...eqi, customParameters: cp };
                                            })
                                          )
                                        }
                                        title="Remove parameter"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        className="border rounded px-1 py-0.5 w-1/3"
                                        placeholder="Min"
                                        value={param.minValue ?? ''}
                                        onChange={(e) =>
                                          setEquipment(prev =>
                                            prev.map(eqi => {
                                              if (eqi.id !== eq.id) return eqi;
                                              const cp = [...(eqi.customParameters || [])];
                                              cp[pidx] = { ...cp[pidx], minValue: e.target.value === '' ? null : Number(e.target.value) };
                                              return { ...eqi, customParameters: cp };
                                            })
                                          )
                                        }
                                      />
                                      <input
                                        type="number"
                                        className="border rounded px-1 py-0.5 w-1/3"
                                        placeholder="Max"
                                        value={param.maxValue ?? ''}
                                        onChange={(e) =>
                                          setEquipment(prev =>
                                            prev.map(eqi => {
                                              if (eqi.id !== eq.id) return eqi;
                                              const cp = [...(eqi.customParameters || [])];
                                              cp[pidx] = { ...cp[pidx], maxValue: e.target.value === '' ? null : Number(e.target.value) };
                                              return { ...eqi, customParameters: cp };
                                            })
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="font-semibold">{param.name}:</span>{' '}
                                    {param.value}{param.unit ? ` ${param.unit}` : ''}
                                    {(param.minValue != null && param.maxValue != null) && (
                                      <div className="text-[11px] text-gray-600">
                                        Range: {param.minValue} - {param.maxValue}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Current batch info */}
                        {eq.currentBatch && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <p className="text-xs font-semibold">Currently Processing: Batch {eq.currentBatch}</p>
                          </div>
                        )}

                        {/* Save / Cancel when editing */}
                        {editingEquipment === eq.id && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => saveEquipmentChanges(eq.id)}
                              className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingEquipment(null)}
                              className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}