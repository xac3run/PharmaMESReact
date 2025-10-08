import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Save, ChevronDown, ChevronUp, X } from 'lucide-react';

export default function EquipmentConfigurator({ 
  equipmentClasses,
  setEquipmentClasses,
  equipment,
  setEquipment,
  addAuditEntry,
  language = 'en'
}) {
  const [editingClass, setEditingClass] = useState(null);
  const [newClassName, setNewClassName] = useState('');
  const [newSubclass, setNewSubclass] = useState('');
  const [expandedEquipment, setExpandedEquipment] = useState(null);
  const [editingEquipment, setEditingEquipment] = useState(null);

  const addClass = () => {
    if (!newClassName) return;
    setEquipmentClasses(prev => ({
      ...prev,
      [newClassName]: []
    }));
    setNewClassName('');
    addAuditEntry("Equipment Class Created", `New class ${newClassName} created`);
  };

  const addSubclass = (className) => {
    if (!newSubclass) return;
    setEquipmentClasses(prev => ({
      ...prev,
      [className]: [...prev[className], newSubclass]
    }));
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
    setEquipmentClasses(prev => ({
      ...prev,
      [className]: prev[className].filter(s => s !== subclass)
    }));
    addAuditEntry("Equipment Subclass Deleted", `${subclass} removed from ${className}`);
  };

  const addEquipmentInstance = (className, subclass) => {
    const newEquipment = {
      id: Date.now(),
      name: `${className}-${equipment.filter(e => e.class === className).length + 1}`,
      class: className,
      subclass: subclass,
      status: "operational",
      currentBatch: null,
      lastBatch: null,
      location: "TBD",
      globalParameters: {},
      customParameters: [],
      calibrationStatus: "valid",
      nextCalibrationDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
      operationalLimits: {}
    };
    setEquipment(prev => [...prev, newEquipment]);
    addAuditEntry("Equipment Created", `${newEquipment.name} created`);
  };

  const addCustomParameter = (equipmentId) => {
    const paramName = prompt("Enter parameter name:");
    if (!paramName) return;
    
    const paramType = prompt("Enter parameter type (text/number/date/select):");
    const paramValue = prompt("Enter parameter value:");
    
    setEquipment(prev => prev.map(eq => {
      if (eq.id === equipmentId) {
        return {
          ...eq,
          customParameters: [
            ...(eq.customParameters || []),
            { 
              name: paramName, 
              type: paramType || 'text', 
              value: paramValue || '',
              unit: paramType === 'number' ? prompt("Enter unit (optional):") || '' : '',
              minValue: paramType === 'number' ? parseFloat(prompt("Enter min value (optional):") || '0') : null,
              maxValue: paramType === 'number' ? parseFloat(prompt("Enter max value (optional):") || '100') : null
            }
          ]
        };
      }
      return eq;
    }));
    addAuditEntry("Equipment Parameter Added", `Parameter ${paramName} added to equipment`);
  };

  const updateEquipmentField = (equipmentId, field, value) => {
    setEquipment(prev => prev.map(eq => 
      eq.id === equipmentId ? { ...eq, [field]: value } : eq
    ));
  };

  const saveEquipmentChanges = (equipmentId) => {
    setEditingEquipment(null);
    addAuditEntry("Equipment Updated", `Equipment configuration updated`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Equipment Configurator</h2>
      </div>

      {/* Class Management */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold mb-4">Equipment Classes</h3>
        
        <div className="flex space-x-2 mb-4">
          <input
            className="border rounded px-3 py-2 flex-1"
            placeholder="New class name..."
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
          />
          <button onClick={addClass} className="btn-primary">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {Object.keys(equipmentClasses).map(className => (
            <div key={className} className="border rounded-lg p-3 bg-white/40">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-lg">{className}</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingClass(editingClass === className ? null : className)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {editingClass === className ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => removeClass(className)}
                    className="p-1 hover:bg-red-100 text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {editingClass === className && (
                <div className="mb-2">
                  <div className="flex space-x-2">
                    <input
                      className="border rounded px-2 py-1 flex-1 text-sm"
                      placeholder="New subclass..."
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
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {equipmentClasses[className].map(subclass => (
                  <div key={subclass} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    <span>{subclass}</span>
                    {editingClass === className && (
                      <>
                        <button
                          onClick={() => removeSubclass(className, subclass)}
                          className="hover:bg-blue-200 rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => addEquipmentInstance(className, subclass)}
                          className="hover:bg-blue-200 rounded p-0.5"
                          title="Add equipment instance"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment Instances */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold mb-4">Equipment Instances</h3>
        
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
                <tr className={`border-b hover:bg-white/40 ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                  <td className="py-2 px-2 font-semibold text-xs">{eq.name}</td>
                  <td className="py-2 px-2 text-xs">{eq.class}</td>
                  <td className="py-2 px-2 text-xs">{eq.subclass}</td>
                  <td className="py-2 px-2 text-xs">
                    <span className={`px-2 py-1 rounded text-xs ${
                      eq.status === 'operational' ? 'bg-green-100 text-green-800' :
                      eq.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      eq.status === 'calibration' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {eq.status}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-xs">{eq.location}</td>
                  <td className="py-2 px-2 text-xs">
                    <span className={`px-2 py-1 rounded text-xs ${
                      eq.calibrationStatus === 'valid' ? 'bg-green-100 text-green-800' :
                      eq.calibrationStatus === 'due' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {eq.calibrationStatus}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-xs">
                    {Object.keys(eq.globalParameters).length + (eq.customParameters?.length || 0)} params
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setEditingEquipment(editingEquipment === eq.id ? null : eq.id)}
                        className="p-1 hover:bg-blue-100 rounded"
                      >
                        {editingEquipment === eq.id ? <Save className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => setExpandedEquipment(expandedEquipment === eq.id ? null : eq.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {expandedEquipment === eq.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>
                </tr>

                {(expandedEquipment === eq.id || editingEquipment === eq.id) && (
                  <tr>
                    <td colSpan="8" className="py-3 px-3 bg-white/60">
                      <div className="space-y-3">
                        {editingEquipment === eq.id && (
                          <div className="grid grid-cols-4 gap-2 mb-4">
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
                              <label className="block text-xs font-semibold mb-1">Calibration Status</label>
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
                            {Object.entries(eq.globalParameters).map(([key, value]) => (
                              <div key={key} className="bg-gray-50 px-2 py-1 rounded">
                                <span className="font-semibold">{key}:</span> {Array.isArray(value) ? value.join('-') : value}
                              </div>
                            ))}
                            {eq.customParameters?.map((param, pidx) => (
                              <div key={pidx} className="bg-blue-50 px-2 py-1 rounded">
                                <span className="font-semibold">{param.name}:</span> {param.value}
                                {param.unit && <span className="text-gray-500"> {param.unit}</span>}
                                {param.minValue !== null && param.maxValue !== null && (
                                  <div className="text-xs text-gray-500">
                                    Range: {param.minValue} - {param.maxValue}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {eq.currentBatch && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <p className="text-xs font-semibold">Currently Processing: Batch {eq.currentBatch}</p>
                          </div>
                        )}

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