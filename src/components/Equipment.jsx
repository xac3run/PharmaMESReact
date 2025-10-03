import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { equipmentClasses } from '../data/demoData';

export default function Equipment({ 
  equipment,
  selectedEquipmentClass,
  setSelectedEquipmentClass,
  language = 'en'
}) {
  const [expandedEquipment, setExpandedEquipment] = useState(null);
  
  const t = (key) => {
    const translations = {
      en: {
        equipmentManagement: "Equipment Management",
        name: "Name",
        class: "Class",
        subclass: "Subclass",
        status: "Status",
        location: "Location",
        details: "Details",
        globalParameters: "Global Parameters",
        currentBatch: "Current Batch",
        lastBatch: "Last Batch"
      },
      ru: {
        equipmentManagement: "Управление оборудованием",
        name: "Название",
        class: "Класс",
        subclass: "Подкласс",
        status: "Статус",
        location: "Местоположение",
        details: "Подробности",
        globalParameters: "Глобальные параметры",
        currentBatch: "Текущая партия",
        lastBatch: "Последняя партия"
      }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  const filteredEquipment = equipment.filter(eq => eq.class === selectedEquipmentClass);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('equipmentManagement')}</h2>
        <select
          className="border rounded px-4 py-2"
          value={selectedEquipmentClass}
          onChange={(e) => setSelectedEquipmentClass(e.target.value)}
        >
          {Object.keys(equipmentClasses).map(cls => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
      </div>
      
      <div className="glass-card">
        <h3 className="font-semibold text-lg mb-3">{t('class')}: {selectedEquipmentClass}</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {equipmentClasses[selectedEquipmentClass].map(subclass => (
            <span key={subclass} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {subclass}
            </span>
          ))}
        </div>
        
        {filteredEquipment.length > 0 ? (
          <table className="w-full">
            <thead className="bg-white/40">
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">{t('name')}</th>
                <th className="text-left py-3 px-4 font-semibold">{t('subclass')}</th>
                <th className="text-left py-3 px-4 font-semibold">{t('status')}</th>
                <th className="text-left py-3 px-4 font-semibold">{t('location')}</th>
                <th className="text-left py-3 px-4 font-semibold">{t('details')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.map((eq, idx) => (
                <React.Fragment key={eq.id}>
                  <tr className={`border-b hover:bg-white/40 transition-colors ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                    <td className="py-3 px-4 font-semibold">{eq.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{eq.subclass}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${
                        eq.status === "operational" ? "bg-green-100 text-green-800" :
                        eq.status === "maintenance" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {eq.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{eq.location}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setExpandedEquipment(expandedEquipment === eq.id ? null : eq.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {expandedEquipment === eq.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                  {expandedEquipment === eq.id && (
                    <tr>
                      <td colSpan="5" className="py-4 px-4 bg-white/60">
                        <div className="space-y-3">
                          <div>
                            <p className="font-semibold text-sm text-gray-600 mb-2">{t('globalParameters')}:</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {Object.entries(eq.globalParameters).map(([key, value]) => (
                                <div key={key}>
                                  <span className="text-gray-600">{key}:</span>
                                  <span className="ml-2 font-semibold">
                                    {Array.isArray(value) ? value.join("-") : value}
                                  </span>
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