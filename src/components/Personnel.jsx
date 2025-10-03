import React from 'react';
import { Plus, Calendar } from 'lucide-react';

export default function Personnel({ 
  personnel,
  workStations,
  shifts,
  setShifts
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Personnel & Shift Management</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Personnel</h3>
          {personnel.map(p => (
            <div key={p.id} className="border rounded-lg p-4 bg-white/60 mb-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold">{p.name}</h4>
                  <p className="text-sm text-gray-600">{p.role} - {p.department}</p>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-semibold ${
                  p.status === "active" ? "bg-green-100 text-green-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {p.status}
                </span>
              </div>
              
              <div className="text-xs text-gray-600 mb-2">
                <p className="font-semibold">Certifications:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {p.certifications.map((cert, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="text-xs">
                <p className="font-semibold text-gray-600 mb-1">Allowed Work Stations:</p>
                <div className="flex flex-wrap gap-1">
                  {p.allowedWorkStations?.map(wsId => {
                    const ws = workStations.find(w => w.id === wsId);
                    return ws ? (
                      <span key={wsId} className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {ws.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Shift Planning
          </h3>
          
          <button
            className="btn-secondary w-full mb-4 flex items-center justify-center space-x-2"
            onClick={() => {
              const newShift = {
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                shiftType: "Day Shift",
                startTime: "08:00",
                endTime: "16:00",
                assignedPersonnel: [],
                workStationId: null
              };
              setShifts(prev => [...prev, newShift]);
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Shift</span>
          </button>
          
          <div className="space-y-3">
            {shifts.map(shift => (
              <div key={shift.id} className="border rounded-lg p-3 bg-white/60">
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Date</label>
                    <input
                      type="date"
                      className="border rounded px-2 py-1 w-full text-xs"
                      value={shift.date}
                      onChange={(e) => setShifts(prev => prev.map(s => 
                        s.id === shift.id ? {...s, date: e.target.value} : s
                      ))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Shift Type</label>
                    <select
                      className="border rounded px-2 py-1 w-full text-xs"
                      value={shift.shiftType}
                      onChange={(e) => setShifts(prev => prev.map(s => 
                        s.id === shift.id ? {...s, shiftType: e.target.value} : s
                      ))}
                    >
                      <option value="Day Shift">Day Shift</option>
                      <option value="Night Shift">Night Shift</option>
                      <option value="Afternoon Shift">Afternoon Shift</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Start Time</label>
                    <input
                      type="time"
                      className="border rounded px-2 py-1 w-full text-xs"
                      value={shift.startTime}
                      onChange={(e) => setShifts(prev => prev.map(s => 
                        s.id === shift.id ? {...s, startTime: e.target.value} : s
                      ))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">End Time</label>
                    <input
                      type="time"
                      className="border rounded px-2 py-1 w-full text-xs"
                      value={shift.endTime}
                      onChange={(e) => setShifts(prev => prev.map(s => 
                        s.id === shift.id ? {...s, endTime: e.target.value} : s
                      ))}
                    />
                  </div>
                </div>
                
                <div className="mb-2">
                  <label className="block text-xs font-semibold mb-1">Work Station</label>
                  <select
                    className="border rounded px-2 py-1 w-full text-xs"
                    value={shift.workStationId || ""}
                    onChange={(e) => setShifts(prev => prev.map(s => 
                      s.id === shift.id ? {...s, workStationId: parseInt(e.target.value) || null} : s
                    ))}
                  >
                    <option value="">Select Station</option>
                    {workStations.map(ws => (
                      <option key={ws.id} value={ws.id}>{ws.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold mb-1">Assigned Personnel</label>
                  <div className="space-y-1">
                    {personnel.filter(p => 
                      !shift.workStationId || p.allowedWorkStations?.includes(shift.workStationId)
                    ).map(p => (
                      <label key={p.id} className="flex items-center space-x-2 text-xs">
                        <input
                          type="checkbox"
                          checked={shift.assignedPersonnel.includes(p.id)}
                          onChange={(e) => {
                            setShifts(prev => prev.map(s => {
                              if (s.id === shift.id) {
                                return {
                                  ...s,
                                  assignedPersonnel: e.target.checked 
                                    ? [...s.assignedPersonnel, p.id]
                                    : s.assignedPersonnel.filter(id => id !== p.id)
                                };
                              }
                              return s;
                            }));
                          }}
                          className="rounded"
                        />
                        <span>{p.name} ({p.role})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}