import React from 'react';
import { Plus, Monitor } from 'lucide-react';

export default function WorkStations({ 
  workStations, 
  setWorkStations,
  equipment
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Work Stations</h2>
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
          <span>New Station</span>
        </button>
      </div>
      
      {workStations.map(ws => (
        <div key={ws.id} className="glass-card">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <input
                className="text-xl font-bold bg-transparent border-b border-gray-300 focus:border-blue-600 px-2 py-1"
                value={ws.name}
                onChange={(e) => setWorkStations(prev => prev.map(s => 
                  s.id === ws.id ? {...s, name: e.target.value} : s
                ))}
              />
              <input
                className="text-sm text-gray-600 bg-transparent border-b border-gray-300 focus:border-blue-600 px-2 py-1 mt-2"
                placeholder="Location"
                value={ws.location}
                onChange={(e) => setWorkStations(prev => prev.map(s => 
                  s.id === ws.id ? {...s, location: e.target.value} : s
                ))}
              />
            </div>
            <Monitor className="w-8 h-8 text-teal-600" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Allowed Processes</label>
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
              <label className="block text-sm font-semibold mb-2">Assigned Equipment</label>
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
        </div>
      ))}
    </div>
  );
}
