import React from 'react';
import { Plus, AlertCircle } from 'lucide-react';

export default function Materials({ 
  materials, 
  setMaterials,
  addNewMaterial,
  updateMaterialStatus
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Materials Management</h2>
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={addNewMaterial}
        >
          <Plus className="w-4 h-4" />
          <span>New Material</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {materials.map(m => (
          <div key={m.id} className="glass-card">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-lg">{m.name}</h3>
                <p className="text-sm text-gray-600">{m.articleNumber}</p>
                <p className="text-xs text-gray-500">Lot: {m.lotNumber}</p>
              </div>
              <select
                className={`px-3 py-1 rounded text-sm font-semibold ${
                  m.status === "validated" ? "bg-green-100 text-green-800" :
                  m.status === "quarantine" ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                }`}
                value={m.status}
                onChange={(e) => updateMaterialStatus(m.id, e.target.value)}
              >
                <option value="quarantine">Quarantine</option>
                <option value="validated">Validated</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Stock:</span>
                <span className="font-semibold">{m.quantity} {m.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span>{m.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Supplier:</span>
                <span>{m.supplier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Received:</span>
                <span>{m.receivedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expiry:</span>
                <span className={new Date(m.expiryDate) < new Date() ? "text-red-600 font-semibold" : ""}>
                  {m.expiryDate}
                </span>
              </div>
            </div>
            {new Date(m.expiryDate) < new Date() && (
              <div className="mt-3 p-2 bg-red-50 border border-red-300 rounded">
                <p className="text-xs text-red-800 font-semibold flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Material expired!
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
