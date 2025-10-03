import { Package, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

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
    <div className="space-y-8">
      <div className="text-center mb-8 animate-fade-in">
        <h2 className="text-4xl font-bold mb-2 glow-text" style={{
          background: 'linear-gradient(135deg, rgb(49,85,77) 0%, rgb(122,154,145) 50%, rgb(195,224,218) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Batch Records
        </h2>
        <p className="text-gray-600 animate-fade-in-delay">Manufacturing batch tracking and management</p>
      </div>
      
      <div className="glass-card animate-slide-up">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Batch ID</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Product</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Progress</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b, index) => (
                <tr 
                  key={b.id} 
                  className="border-b border-gray-100 hover:bg-white/50 transition-colors animate-slide-up"
                  style={{animationDelay: `${0.1 + index * 0.05}s`}}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-teal-600" />
                      <span className="font-semibold text-gray-900">{b.id}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-700">{b.product}</td>
                  <td className="py-4 px-4">
                    <span className={`status-badge flex items-center space-x-1 w-fit ${
                      b.status === "completed" ? "status-completed" :
                      b.status === "deviation" ? "status-deviation" :
                      "status-progress"
                    }`}>
                      {b.status === "completed" && <CheckCircle2 className="w-3 h-3" />}
                      {b.status === "deviation" && <AlertCircle className="w-3 h-3" />}
                      {b.status === "in_progress" && <Clock className="w-3 h-3" />}
                      <span>{b.status}</span>
                    </span>
                    {b.deviation && (
                      <div className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{b.deviation}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${b.progress}%`,
                            background: b.status === "completed" ? 'linear-gradient(90deg, #10b981, #059669)' :
                                       b.status === "deviation" ? 'linear-gradient(90deg, #ef4444, #dc2626)' :
                                       'linear-gradient(90deg, rgb(49,85,77), rgb(122,154,145))'
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">{b.progress}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {b.status === "in_progress" && (
                      <div className="flex space-x-2">
                        <button 
                          className="px-3 py-1 rounded-lg font-semibold text-xs text-white transition-all hover-lift"
                          style={{background: 'linear-gradient(135deg, rgb(16,185,129), rgb(5,150,105))'}}
                          onClick={() => completeStep(b.id)}
                        >
                          ✓ Complete Step
                        </button>
                        <button 
                          className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-600 transition-all"
                          onClick={() => reportDeviation(b.id)}
                        >
                          Report Deviation
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card animate-slide-up" style={{animationDelay: '0.3s'}}>
        <div className="flex items-center space-x-3 mb-6">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <h3 className="text-2xl font-semibold text-gray-900">Deviation Management</h3>
        </div>
        
        {deviations.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">No deviations reported</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deviations.map((deviation, index) => (
              <div 
                key={deviation.id} 
                className="deviation-card group"
                style={{animationDelay: `${0.4 + index * 0.05}s`}}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-lg text-gray-900">Batch: {deviation.batchId}</h4>
                      <span className={`status-badge ${
                        deviation.status === 'approved' ? 'status-completed' :
                        deviation.status === 'rejected' ? 'status-deviation' :
                        'bg-yellow-100 text-yellow-800 border border-yellow-300'
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
                    
                    <div className="text-sm text-gray-500 space-y-1">
                      <div><strong>Reported by:</strong> {deviation.reportedBy}</div>
                      <div><strong>Date:</strong> {deviation.reportedDate}</div>
                      {deviation.investigator && (
                        <div><strong>Investigator:</strong> {deviation.investigator}</div>
                      )}
                    </div>
                  </div>
                </div>
                
                {deviation.status === 'pending' && (
                  <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => approveDeviation(deviation.id)}
                      className="px-4 py-2 rounded-lg font-semibold text-sm text-white transition-all hover-lift flex items-center space-x-1"
                      style={{background: 'linear-gradient(135deg, rgb(16,185,129), rgb(5,150,105))'}}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => rejectDeviation(deviation.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition-all flex items-center space-x-1"
                    >
                      <AlertCircle className="w-4 h-4" />
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