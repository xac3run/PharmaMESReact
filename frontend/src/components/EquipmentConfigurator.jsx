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
  const [expandedClass, setExpandedClass] = useState(null);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [expandedEquipment, setExpandedEquipment] = useState(null);

  const addClass = () => {
    if (!newClassName.trim()) return;
    setEquipmentClasses(prev => ({
      ...prev,
      [newClassName]: []
    }));
    setNewClassName('');
    addAuditEntry("Equipment Class Created", `New class ${newClassName} created`);
  };

  const addSubclass = (className) => {
    if (!newSubclass.trim()) return;
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

  return (
    <div className="space-y-6">
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
              <th className="text-left py-2 px-2 font-semibold text-xs">Equipment Count</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(equipmentClasses).map((className, idx) => (
              <React.Fragment key={className}>
                <tr className={`border-b hover:bg-white/40 transition-colors ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                  <td className="py-2 px-2 font-semibold text-xs">{className}</td>
                  <td className="py-2 px-2 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {equipmentClasses[className].slice(0, 3).map(subclass => (
                        <span key={subclass} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                          {subclass}
                        </span>
                      ))}
                      {equipmentClasses[className].length > 3 && (
                        <span className="text-gray-500 text-xs">
                          +{equipmentClasses[className].length - 3} more
                        </span>
                      )}
                    </div>
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
                    <td colSpan="4" className="py-3 px-3 bg-white/60">
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
                            {equipmentClasses[className].map(subclass => (
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
                            ))}
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
                            {equipmentClasses[className].map(subclass => (
                              <div
                                key={subclass}
                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-center"
                              >
                                {subclass}
                              </div>
                            ))}
                          </div>
                          <div className="text-gray-600">
                            Equipment instances:{' '}
                            {equipment
                              .filter(eq => eq.class === className)
                              .map(eq => eq.name)
                              .join(', ') || 'None'}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {/* Equipment Instances */}
      <div className="glass-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Equipment Instances</h2>
        </div>

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
