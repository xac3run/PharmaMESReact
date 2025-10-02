export default function Batches({ 
  batches, 
  setBatches, 
  deviations, 
  setDeviations,
  currentUser,
  workflow,
  activeWorkflow
}) {

  const completeStep = (id) => {
    setBatches(prev => prev.map(b => b.id === id
      ? { ...b, progress: Math.min(b.progress + 30, 100), status: b.progress + 30 >= 100 ? "completed" : "in_progress" }
      : b
    ));
  };

  const reportDeviation = (id) => {
    const deviationText = prompt("Enter deviation description:");
    if (deviationText) {
      const newDeviation = {
        id: Date.now(),
        batchId: id,
        description: deviationText,
        status: "pending",
        reportedBy: currentUser?.name || "Current User",
        reportedDate: new Date().toISOString().split('T')[0],
        investigator: null
      };
      setDeviations(prev => [...prev, newDeviation]);
      setBatches(prev => prev.map(b => b.id === id
        ? { ...b, status: "deviation", deviation: deviationText }
        : b
      ));
    }
  };

  const approveDeviation = (deviationId) => {
    const investigator = prompt("Enter investigator name:");
    if (investigator) {
      setDeviations(prev => prev.map(d => 
        d.id === deviationId ? { ...d, status: "approved", investigator } : d
      ));
      
      const deviation = deviations.find(d => d.id === deviationId);
      if (deviation?.stepId) {
        // Resume workflow if needed
        if (activeWorkflow?.status === "paused") {
          alert("Workflow can now be resumed by Master");
        }
      }
    }
  };

  const rejectDeviation = (deviationId) => {
    const investigator = prompt("Enter investigator name:");
    if (investigator) {
      setDeviations(prev => prev.map(d => 
        d.id === deviationId ? { ...d, status: "rejected", investigator } : d
      ));
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Batch Records 🧪</h2>
      
      {/* Batches Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4">Batch ID</th>
              <th className="text-left py-3 px-4">Product</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Progress</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {batches.map(b => (
              <tr key={b.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-semibold">{b.id}</td>
                <td className="py-3 px-4">{b.product}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded text-sm ${
                    b.status === "completed" ? "bg-green-100 text-green-800" :
                    b.status === "deviation" ? "bg-red-100 text-red-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {b.status}
                  </span>
                  {b.deviation && (
                    <div className="text-xs text-red-600 mt-1">⚠️ {b.deviation}</div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all" 
                        style={{width: `${b.progress}%`}}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{b.progress}%</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {b.status === "in_progress" && (
                    <div className="flex space-x-2">
                      <button 
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        onClick={() => completeStep(b.id)}
                      >
                        ✓ Complete Step
                      </button>
                      <button 
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        onClick={() => reportDeviation(b.id)}
                      >
                        🚨 Report Deviation
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deviations Management */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Deviation Management 🚨</h3>
        
        {deviations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No deviations reported</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deviations.map(deviation => (
              <div key={deviation.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-lg">Batch: {deviation.batchId}</h4>
                      <span className={`px-3 py-1 rounded text-xs ${
                        deviation.status === 'approved' ? 'bg-green-100 text-green-800' :
                        deviation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {deviation.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-2">{deviation.description}</p>
                    
                    {deviation.stepName && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Step:</strong> {deviation.stepName}
                      </p>
                    )}
                    
                    <div className="text-sm text-gray-500">
                      <div><strong>Reported by:</strong> {deviation.reportedBy}</div>
                      <div><strong>Date:</strong> {deviation.reportedDate}</div>
                      {deviation.investigator && (
                        <div><strong>Investigator:</strong> {deviation.investigator}</div>
                      )}
                    </div>
                  </div>
                </div>
                
                {deviation.status === 'pending' && (
                  <div className="flex space-x-2 mt-3 pt-3 border-t">
                    <button
                      onClick={() => approveDeviation(deviation.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center space-x-1"
                    >
                      <span>✓</span>
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => rejectDeviation(deviation.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center space-x-1"
                    >
                      <span>✗</span>
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}