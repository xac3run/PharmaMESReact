const Icons = {
  Plus: () => <span>➕</span>,
};

export default function Personnel({ personnel, setPersonnel }) {
  
  const addPersonnel = () => {
    setPersonnel(prev => [...prev, {
      id: Date.now(),
      name: "New Employee",
      role: "Operator",
      department: "Production",
      status: "training",
      lastTraining: new Date().toISOString().split('T')[0],
      certifications: []
    }]);
  };

  const removePersonnel = (personnelId) => {
    if (confirm('Are you sure you want to remove this person?')) {
      setPersonnel(prev => prev.filter(p => p.id !== personnelId));
    }
  };

  const updatePersonnel = (personnelId, field, value) => {
    setPersonnel(prev => prev.map(p => 
      p.id === personnelId ? {...p, [field]: value} : p
    ));
  };

  const addCertification = (personnelId) => {
    const cert = prompt("Enter certification name:");
    if (cert) {
      setPersonnel(prev => prev.map(p => 
        p.id === personnelId 
          ? {...p, certifications: [...(p.certifications || []), cert]} 
          : p
      ));
    }
  };

  const removeCertification = (personnelId, certIndex) => {
    setPersonnel(prev => prev.map(p => 
      p.id === personnelId 
        ? {...p, certifications: p.certifications.filter((_, i) => i !== certIndex)} 
        : p
    ));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Personnel Management 👤</h2>
        <button 
          onClick={addPersonnel}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center space-x-2"
        >
          <Icons.Plus />
          <span>Add Personnel</span>
        </button>
      </div>

      {/* Personnel Table */}
      <div className="bg-white border rounded-lg overflow-hidden shadow mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Department</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Last Training</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {personnel.map((person, index) => (
              <tr key={person.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-4 py-3">
                  <input 
                    className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none font-medium"
                    value={person.name}
                    onChange={(e) => updatePersonnel(person.id, 'name', e.target.value)}
                  />
                </td>
                <td className="px-4 py-3">
                  <select 
                    value={person.role}
                    onChange={(e) => updatePersonnel(person.id, 'role', e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="Operator">Operator</option>
                    <option value="QA">QA Analyst</option>
                    <option value="QC Analyst">QC Analyst</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Manager">Manager</option>
                    <option value="Master">Master</option>
                    <option value="Planner">Planner</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select 
                    value={person.department}
                    onChange={(e) => updatePersonnel(person.id, 'department', e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="Production">Production</option>
                    <option value="Quality">Quality</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="R&D">R&D</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select 
                    value={person.status}
                    onChange={(e) => updatePersonnel(person.id, 'status', e.target.value)}
                    className={`px-3 py-1 rounded text-sm ${
                      person.status === 'active' ? 'bg-green-100 text-green-800' :
                      person.status === 'training' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="training">Training</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="date"
                    value={person.lastTraining}
                    onChange={(e) => updatePersonnel(person.id, 'lastTraining', e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-3">
                  <button 
                    onClick={() => removePersonnel(person.id)}
                    className="text-red-600 hover:bg-red-100 px-3 py-1 rounded text-sm"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Certifications Overview */}
      <div className="bg-white border rounded-lg p-6 shadow">
        <h3 className="text-xl font-semibold mb-4">Training & Certifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personnel.map(person => (
            <div key={person.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{person.name}</h4>
                  <p className="text-sm text-gray-600">{person.role} - {person.department}</p>
                </div>
                <button
                  onClick={() => addCertification(person.id)}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                >
                  + Cert
                </button>
              </div>
              
              <div className="space-y-2">
                {person.certifications && person.certifications.length > 0 ? (
                  person.certifications.map((cert, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-2 rounded text-sm">
                      <span>✓ {cert}</span>
                      <button
                        onClick={() => removeCertification(person.id, i)}
                        className="text-red-600 hover:bg-red-100 px-2 py-1 rounded text-xs"
                      >
                        ✗
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">No certifications</p>
                )}
              </div>

              <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                Last training: {person.lastTraining}
              </div>
            </div>
          ))}
        </div>
      </div>

      {personnel.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">👤</div>
          <p className="text-xl text-gray-600 mb-2">No personnel registered</p>
          <p className="text-gray-500">Click "Add Personnel" to register new employees</p>
        </div>
      )}
    </div>
  );
}