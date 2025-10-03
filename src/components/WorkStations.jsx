import React, { useState } from 'react';
import { Plus, Monitor, ChevronDown, ChevronUp } from 'lucide-react';

export default function WorkStations({ 
  workStations, 
  setWorkStations,
  equipment,
  language = 'en'
}) {
  const [expandedStation, setExpandedStation] = useState(null);
  
  const t = (key) => {
    const translations = {
      en: {
        workStations: "Work Stations",
        newStation: "New Station",
        name: "Name",
        location: "Location",
        processes: "Processes",
        equipment: "Equipment",
        details: "Details",
        allowedProcesses: "Allowed Processes",
        assignedEquipment: "Assigned Equipment"
      },
      ru: {
        workStations: "Рабочие станции",
        newStation: "Новая станция",
        name: "Название",
        location: "Местоположение",
        processes: "Процессы",
        equipment: "Оборудование",
        details: "Подробности",
        allowedProcesses: "Разрешенные процессы",
        assignedEquipment: "Назначенное оборудование"
      }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('workStations')}</h2>
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={() => {
            const newStation = {
              id: Date.now(),
              name: "New Station",
              processes: [],
              equipmentIds: [],
              location: "TBD"
            };
            setWorkStations(prev => [...prev, newStation]);
          }}
        >
          <Plus className="w-4 h-4" />
          <span>{t('newStation')}</span>
        </button>
      </div>
      
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold">{t('name')}</th>
              <th className="text-left py-3 px-4 font-semibold">{t('location')}</th>
              <th className="text-left py-3 px-4 font-semibold">{t('processes')}</th>
              <th className="text-left py-3 px-4 font-semibold">{t('equipment')}</th>
              <th className="text-left py-3 px-4 font-semibold">{t('details')}</th>
            </tr>
          </thead>
          <tbody>
            {workStations.map((ws, idx) => (
              <React.Fragment key={ws.id}>
                <tr className={`border-b hover:bg-white/40 transition-colors ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Monitor className="w-4 h-4 text-teal-600" />
                      <span className="font-semibold">{ws.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{ws.location}</td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{ws.processes.length} processes</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{ws.equipmentIds.length} items</span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setExpandedStation(expandedStation === ws.id ? null : ws.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {expandedStation === ws.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
                {expandedStation === ws.id && (
                  <tr>
                    <td colSpan="5" className="py-4 px-4 bg-white/60">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">{t('allowedProcesses')}</label>
                          <div className="space-y-2">
                            {["dispensing", "weighing", "mixing", "granulation", "coating", "packaging"].map(process => (
                              <label key={process} className="flex items-center space-x-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={ws.processes.includes(process)}
                                  onChange={(e) => {
                                    setWorkStations(prev => prev.map(s => {
                                      if (s.id === ws.id) {
                                        return {
                                          ...s,
                                          processes: e.target.checked 
                                            ? [...s.processes, process]
                                            : s.processes.filter(p => p !== process)
                                        };
                                      }
                                      return s;
                                    }));
                                  }}
                                  className="rounded"
                                />
                                <span>{process}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold mb-2">{t('assignedEquipment')}</label>
                          <div className="space-y-2">
                            {equipment.map(eq => (
                              <label key={eq.id} className="flex items-center space-x-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={ws.equipmentIds.includes(eq.id)}
                                  onChange={(e) => {
                                    setWorkStations(prev => prev.map(s => {
                                      if (s.id === ws.id) {
                                        return {
                                          ...s,
                                          equipmentIds: e.target.checked 
                                            ? [...s.equipmentIds, eq.id]
                                            : s.equipmentIds.filter(id => id !== eq.id)
                                        };
                                      }
                                      return s;
                                    }));
                                  }}
                                  className="rounded"
                                />
                                <span>{eq.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
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