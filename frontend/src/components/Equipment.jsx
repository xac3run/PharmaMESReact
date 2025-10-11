import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Edit3, Save, Trash2 } from 'lucide-react';
//import { equipmentClasses } from '../data/demoData';

export default function Equipment({ 
  equipment,
  setEquipment,
  selectedEquipmentClass,
  setSelectedEquipmentClass,
  equipmentClasses,  // ← ДОБАВЬ В PROPS
  addAuditEntry,
  language = 'en'
}) {
  const [expandedEquipment, setExpandedEquipment] = useState(null);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    class: '',
    subclass: '',
    location: '',
    status: 'operational'
  });

  // ✅ Добавлена функция для безопасного получения подклассов
  const getSubclassesForClass = (className) => {
    if (!equipmentClasses || !equipmentClasses[className]) return [];
    const classData = equipmentClasses[className];
    return Array.isArray(classData) ? classData : (classData.subclasses || []);
  };
  
  const t = (key) => {
    const translations = {
      en: {
        equipmentManagement: "Equipment Management",
        newEquipment: "New Equipment",
        name: "Name",
        class: "Class",
        subclass: "Subclass",
        status: "Status",
        location: "Location",
        details: "Details",
        globalParameters: "Global Parameters",
        currentBatch: "Current Batch",
        lastBatch: "Last Batch",
        calibration: "Calibration",
        save: "Save",
        cancel: "Cancel",
        create: "Create"
      },
      ru: {
        equipmentManagement: "Управление оборудованием",
        newEquipment: "Новое оборудование",
        name: "Название",
        class: "Класс",
        subclass: "Подкласс",
        status: "Статус",
        location: "Местоположение",
        details: "Подробности",
        globalParameters: "Глобальные параметры",
        currentBatch: "Текущая партия",
        lastBatch: "Последняя партия",
        calibration: "Калибровка",
        save: "Сохранить",
        cancel: "Отмена",
        create: "Создать"
      }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  const filteredEquipment = equipment.filter(eq => eq.class === selectedEquipmentClass);

  const createEquipment = () => {
    if (!newEquipment.name || !newEquipment.class || !newEquipment.subclass) {
      alert('Please fill all required fields');
      return;
    }

    const equipmentInstance = {
      id: Date.now(),
      name: newEquipment.name,
      class: newEquipment.class,
      subclass: newEquipment.subclass,
      status: newEquipment.status,
      location: newEquipment.location || 'TBD',
      currentBatch: null,
      lastBatch: null,
      globalParameters: {},
      customParameters: [],
      calibrationStatus: "valid",
      nextCalibrationDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
    };
    
    setEquipment(prev => [...prev, equipmentInstance]);
    addAuditEntry("Equipment Created", `Equipment ${equipmentInstance.name} created`);
    
    setNewEquipment({ name: '', class: '', subclass: '', location: '', status: 'operational' });
    setShowCreateForm(false);
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

  const deleteEquipment = (equipmentId) => {
    if (confirm('Are you sure you want to delete this equipment?')) {
      setEquipment(prev => prev.filter(eq => eq.id !== equipmentId));
      addAuditEntry("Equipment Deleted", `Equipment deleted`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('equipmentManagement')}</h2>
        <div className="flex space-x-2">
          <select
            className="border rounded px-4 py-2"
            value={selectedEquipmentClass}
            onChange={(e) => setSelectedEquipmentClass(e.target.value)}
          >
            {Object.keys(equipmentClasses).map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)} 
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newEquipment')}</span>
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="glass-card">
          <h3 className="font-semibold text-lg mb-3">Create New Equipment</h3>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Equipment Name</label>
              <input
                className="border rounded px-3 py-2 w-full"
                value={newEquipment.name}
                onChange={(e) => setNewEquipment(prev => ({...prev, name: e.target.value}))}
                placeholder="e.g. Mixer-001"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Class</label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={newEquipment.class}
                onChange={(e) => setNewEquipment(prev => ({...prev, class: e.target.value, subclass: ''}))}
              >
                <option value="">Select Class</option>
                {Object.keys(equipmentClasses).map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Subclass</label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={newEquipment.subclass}
                onChange={(e) => setNewEquipment(prev => ({...prev, subclass: e.target.value}))}
                disabled={!newEquipment.class}
              >
                <option value="">Select Subclass</option>
                {newEquipment.class && equipmentClasses[newEquipment.class]?.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Location</label>
              <input
                className="border rounded px-3 py-2 w-full"
                value={newEquipment.location}
                onChange={(e) => setNewEquipment(prev => ({...prev, location: e.target.value}))}
                placeholder="e.g. Room A-101"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button onClick={createEquipment} className="btn-primary">
              {t('create')}
            </button>
            <button 
              onClick={() => setShowCreateForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
      
      <div className="glass-card">
        <h3 className="font-semibold text-lg mb-3">{t('class')}: {selectedEquipmentClass}</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {/* ✅ Исправлено: безопасный вызов подклассов */}
          {getSubclassesForClass(selectedEquipmentClass).map(subclass => (
            <span key={subclass} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {subclass}
            </span>
          ))}
        </div>
        
        {filteredEquipment.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-white/40">
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-semibold text-xs">{t('name')}</th>
                <th className="text-left py-2 px-2 font-semibold text-xs">{t('subclass')}</th>
                <th className="text-left py-2 px-2 font-semibold text-xs">{t('status')}</th>
                <th className="text-left py-2 px-2 font-semibold text-xs">{t('location')}</th>
                <th className="text-left py-2 px-2 font-semibold text-xs">{t('calibration')}</th>
                <th className="text-left py-2 px-2 font-semibold text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.map((eq, idx) => (
                <React.Fragment key={eq.id}>
                  <tr className={`border-b hover:bg-white/40 transition-colors ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                    <td className="py-2 px-2 font-semibold text-xs">{eq.name}</td>
                    <td className="py-2 px-2 text-xs">{eq.subclass}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        eq.status === "operational" ? "bg-green-100 text-green-800" :
                        eq.status === "maintenance" ? "bg-yellow-100 text-yellow-800" :
                        eq.status === "calibration" ? "bg-blue-100 text-blue-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {eq.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-xs">{eq.location}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        eq.calibrationStatus === 'valid' ? 'bg-green-100 text-green-800' :
                        eq.calibrationStatus === 'due' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {eq.calibrationStatus || 'valid'}
                      </span>
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
                        <button
                          onClick={() => deleteEquipment(eq.id)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {(expandedEquipment === eq.id || editingEquipment === eq.id) && (
                    <tr>
                      <td colSpan="6" className="py-3 px-3 bg-white/60">
                        {editingEquipment === eq.id ? (
                          <div className="space-y-3">
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
                            <button
                              onClick={() => saveEquipmentChanges(eq.id)}
                              className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                            >
                              {t('save')}
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div><span className="font-semibold">Class:</span> {eq.class}</div>
                              <div><span className="font-semibold">Subclass:</span> {eq.subclass}</div>
                              <div><span className="font-semibold">Location:</span> {eq.location}</div>
                            </div>
                            
                            <div>
                              <p className="font-semibold text-sm text-gray-600 mb-2">{t('globalParameters')}:</p>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {Object.entries(eq.globalParameters || {}).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="text-gray-600">{key}:</span>
                                    <span className="ml-2 font-semibold">
                                      {Array.isArray(value) ? value.join("-") : value}
                                    </span>
                                  </div>
                                ))}
                                {eq.customParameters?.map((param, pidx) => (
                                  <div key={pidx}>
                                    <span className="text-gray-600">{param.name}:</span>
                                    <span className="ml-2 font-semibold">{param.value}</span>
                                    {param.unit && <span className="text-gray-500"> {param.unit}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {eq.currentBatch && (
                              <div className="p-2 bg-blue-50 rounded">
                                <p className="text-sm font-semibold">{t('currentBatch')}: {eq.currentBatch}</p>
                              </div>
                            )}
                            
                            {eq.lastBatch && !eq.currentBatch && (
                              <div className="text-sm text-gray-500">
                                {t('lastBatch')}: {eq.lastBatch}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-center py-8">No equipment in this class</p>
        )}
      </div>
    </div>
  );
}
