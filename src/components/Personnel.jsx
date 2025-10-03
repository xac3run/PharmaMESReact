import React, { useState } from 'react';
import { Plus, Calendar, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

export default function Personnel({ 
  personnel,
  setPersonnel,
  workStations,
  shifts,
  setShifts,
  addAuditEntry,
  language = 'en'
}) {
  const [expandedPerson, setExpandedPerson] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  
  const t = (key) => {
    const translations = {
      en: {
        personnelManagement: "Personnel & Shift Management",
        addUser: "Add User",
        name: "Name",
        role: "Role",
        department: "Department",
        status: "Status",
        details: "Details",
        certifications: "Certifications",
        allowedWorkStations: "Allowed Work Stations",
        shiftPlanning: "Shift Planning",
        addShift: "Add Shift",
        cancel: "Cancel",
        save: "Save"
      },
      ru: {
        personnelManagement: "Управление персоналом и сменами",
        addUser: "Добавить пользователя",
        name: "Имя",
        role: "Роль",
        department: "Отдел",
        status: "Статус",
        details: "Подробности",
        certifications: "Сертификаты",
        allowedWorkStations: "Разрешенные станции",
        shiftPlanning: "Планирование смен",
        addShift: "Добавить смену",
        cancel: "Отменить",
        save: "Сохранить"
      }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  const addNewUser = (userData) => {
    const newUser = {
      id: Date.now(),
      name: userData.name,
      role: userData.role,
      department: userData.department,
      status: "active",
      certifications: [],
      allowedWorkStations: [],
      shifts: []
    };
    setPersonnel(prev => [...prev, newUser]);
    addAuditEntry("User Created", `New user ${userData.name} created with role ${userData.role}`);
    setShowAddUser(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('personnelManagement')}</h2>
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={() => setShowAddUser(true)}
        >
          <Plus className="w-4 h-4" />
          <span>{t('addUser')}</span>
        </button>
      </div>
      
      {showAddUser && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Create New User</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            addNewUser({
              name: formData.get('name'),
              role: formData.get('role'),
              department: formData.get('department')
            });
          }}>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1">{t('name')}</label>
                <input
                  name="name"
                  type="text"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">{t('role')}</label>
                <select name="role" className="border rounded px-3 py-2 w-full" required>
                  <option value="Operator">Operator</option>
                  <option value="QA">QA</option>
                  <option value="Master">Master</option>
                  <option value="Planner">Planner</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">{t('department')}</label>
                <input
                  name="department"
                  type="text"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Department"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">
                {t('save')}
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddUser(false)}
                className="btn-secondary"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card overflow-hidden">
          <h3 className="text-lg font-semibold mb-4 px-4 pt-4">Personnel</h3>
          <table className="w-full">
            <thead className="bg-white/40">
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">{t('name')}</th>
                <th className="text-left py-3 px-4 font-semibold">{t('role')}</th>
                <th className="text-left py-3 px-4 font-semibold">{t('status')}</th>
                <th className="text-left py-3 px-4 font-semibold">{t('details')}</th>
              </tr>
            </thead>
            <tbody>
              {personnel.map((p, idx) => (
                <React.Fragment key={p.id}>
                  <tr className={`border-b hover:bg-white/40 transition-colors ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                    <td className="py-3 px-4 font-semibold">{p.name}</td>
                    <td className="py-3 px-4 text-sm">{p.role}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${
                        p.status === "active" ? "bg-green-100 text-green-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setExpandedPerson(expandedPerson === p.id ? null : p.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {expandedPerson === p.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                  {expandedPerson === p.id && (
                    <tr>
                      <td colSpan="4" className="py-4 px-4 bg-white/60">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold mb-1">{t('department')}:</p>
                            <p className="text-sm">{p.department}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold mb-1">{t('certifications')}:</p>
                            <div className="flex flex-wrap gap-1">
                              {p.certifications.map((cert, idx) => (
                                <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  {cert}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold mb-1">{t('allowedWorkStations')}:</p>
                            <div className="flex flex-wrap gap-1">
                              {p.allowedWorkStations?.map(wsId => {
                                const ws = workStations.find(w => w.id === wsId);
                                return ws ? (
                                  <span key={wsId} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                                    {ws.name}
                                  </span>
                                ) : null;
                              })}
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
        
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            {t('shiftPlanning')}
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
              addAuditEntry("Shift Created", "New shift created");
            }}
          >
            <Plus className="w-4 h-4" />
            <span>{t('addShift')}</span>
          </button>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {shifts.map(shift => (
              <div key={shift.id} className="border rounded-lg p-3 bg-white/60">
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Date</label>
                    <input
                      type="date"
                      className="border rounded px-2 py-1 w-full text-xs"
                      value={shift.date}
                      onChange={(e) => {
                        setShifts(prev => prev.map(s => 
                          s.id === shift.id ? {...s, date: e.target.value} : s
                        ));
                        addAuditEntry("Shift Modified", `Shift date changed to ${e.target.value}`);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Shift Type</label>
                    <select
                      className="border rounded px-2 py-1 w-full text-xs"
                      value={shift.shiftType}
                      onChange={(e) => {
                        setShifts(prev => prev.map(s => 
                          s.id === shift.id ? {...s, shiftType: e.target.value} : s
                        ));
                        addAuditEntry("Shift Modified", `Shift type changed to ${e.target.value}`);
                      }}
                    >
                      <option value="Day Shift">Day Shift</option>
                      <option value="Night Shift">Night Shift</option>
                      <option value="Afternoon Shift">Afternoon Shift</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-2">
                  <label className="block text-xs font-semibold mb-1">Work Station</label>
                  <select
                    className="border rounded px-2 py-1 w-full text-xs"
                    value={shift.workStationId || ""}
                    onChange={(e) => {
                      setShifts(prev => prev.map(s => 
                        s.id === shift.id ? {...s, workStationId: parseInt(e.target.value) || null} : s
                      ));
                      addAuditEntry("Shift Modified", "Work station assigned to shift");
                    }}
                  >
                    <option value="">Select Station</option>
                    {workStations.map(ws => (
                      <option key={ws.id} value={ws.id}>{ws.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-xs text-gray-500">
                    {shift.assignedPersonnel.length} assigned
                  </span>
                  <button
                    onClick={() => {
                      setShifts(prev => prev.filter(s => s.id !== shift.id));
                      addAuditEntry("Shift Deleted", "Shift removed");
                    }}
                    className="text-red-600 hover:bg-red-100 p-1 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}