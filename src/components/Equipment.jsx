const Icons = {
  Plus: () => <span>➕</span>,
};

export default function Equipment({ equipment, setEquipment }) {
  
  const addEquipment = () => {
    setEquipment(prev => [...prev, {
      id: Date.now(),
      name: "New Equipment",
      type: "General",
      status: "maintenance",
      location: "TBD",
      lastCalibration: new Date().toISOString().split('T')[0],
      nextCalibration: new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0]
    }]);
  };

  const updateEquipmentStatus = (equipmentId, newStatus) => {
    setEquipment(prev => prev.map(e => 
      e.id === equipmentId ? {...e, status: newStatus} : e
    ));
  };

  const calibrateEquipment = (equipmentId) => {
    setEquipment(prev => prev.map(e => 
      e.id === equipmentId ? {
        ...e, 
        lastCalibration: new Date().toISOString().split('T')[0],
        nextCalibration: new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0]
      } : e
    ));
    alert('Equipment calibrated successfully!');
  };

  const updateEquipment = (equipmentId, field, value) => {
    setEquipment(prev => prev.map(e => 
      e.id === equipmentId ? {...e, [field]: value} : e
    ));
  };

  const removeEquipment = (equipmentId) => {
    if (confirm('Are you sure you want to remove this equipment?')) {
      setEquipment(prev => prev.filter(e => e.id !== equipmentId));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Equipment Management ⚙️</h2>
        <button 
          onClick={addEquipment}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center space-x-2"
        >
          <Icons.Plus />
          <span>Add Equipment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipment.map(eq => (
          <div key={eq.id} className="bg-white border rounded-lg p-6 shadow hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <input
                  className="text-xl font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full mb-2"
                  value={eq.name}
                  onChange={(e) => updateEquipment(eq.id, 'name', e.target.value)}
                />
                <input
                  className="text-sm text-gray-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full"
                  value={eq.type}
                  onChange={(e) => updateEquipment(eq.id, 'type', e.target.value)}
                />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                eq.status === 'in_operation' ? 'bg-green-100 text-green-800' :
                eq.status === 'cleaning' ? 'bg-blue-100 text-blue-800' :
                eq.status === 'calibration' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {eq.status}
              </span>
            </div>
            
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Location</label>
                <input
                  className="w-full border px-3 py-2 rounded"
                  value={eq.location}
                  onChange={(e) => updateEquipment(eq.id, 'location', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Last Calibration</label>
                  <input
                    type="date"
                    className="w-full border px-2 py-1 rounded text-sm"
                    value={eq.lastCalibration}
                    onChange={(e) => updateEquipment(eq.id, 'lastCalibration', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Next Calibration</label>
                  <input
                    type="date"
                    className="w-full border px-2 py-1 rounded text-sm"
                    value={eq.nextCalibration}
                    onChange={(e) => updateEquipment(eq.id, 'nextCalibration', e.target.value)}
                  />
                </div>
              </div>

              {/* Calibration Alert */}
              {new Date(eq.nextCalibration) < new Date() && (
                <div className="bg-red-50 border border-red-300 rounded p-2">
                  <p className="text-xs text-red-800 font-semibold">⚠️ Calibration overdue!</p>
                </div>
              )}
              {new Date(eq.nextCalibration) < new Date(Date.now() + 7*24*60*60*1000) && 
               new Date(eq.nextCalibration) >= new Date() && (
                <div className="bg-yellow-50 border border-yellow-300 rounded p-2">
                  <p className="text-xs text-yellow-800 font-semibold">⚠️ Calibration due soon</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <select 
                value={eq.status}
                onChange={(e) => updateEquipmentStatus(eq.id, e.target.value)}
                className="w-full border px-3 py-2 rounded text-sm"
              >
                <option value="in_operation">In Operation</option>
                <option value="cleaning">Cleaning</option>
                <option value="calibration">Calibration</option>
                <option value="maintenance">Maintenance</option>
              </select>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => calibrateEquipment(eq.id)}
                  className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
                >
                  📅 Calibrate
                </button>
                <button 
                  onClick={() => removeEquipment(eq.id)}
                  className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {equipment.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">⚙️</div>
          <p className="text-xl text-gray-600 mb-2">No equipment registered</p>
          <p className="text-gray-500">Click "Add Equipment" to register new equipment</p>
        </div>
      )}
    </div>
  );
}