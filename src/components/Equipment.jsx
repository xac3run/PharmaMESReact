import React from 'react';
import { equipmentClasses } from '../data/demoData';

export default function Equipment({ 
  equipment,
  selectedEquipmentClass,
  setSelectedEquipmentClass
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Equipment Management</h2>
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
        <h3 className="font-semibold text-lg mb-3">Class: {selectedEquipmentClass}</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {equipmentClasses[selectedEquipmentClass].map(subclass => (
            <span key={subclass} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {subclass}
            </span>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {equipment.filter(eq => eq.class === selectedEquipmentClass).map(eq => (
            <div key={eq.id} className="border rounded-lg p-4 bg-white/60">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-lg">{eq.name}</h4>
                  <p className="text-sm text-gray-600">{eq.subclass}</p>
                  <p className="text-xs text-gray-500">{eq.location}</p>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-semibold ${
                  eq.status === "operational" ? "bg-green-100 text-green-800" :
                  eq.status === "maintenance" ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {eq.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-semibold text-xs text-gray-600 mb-1">Global Parameters:</p>
                  {Object.entries(eq.globalParameters).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-gray-600">{key}:</span>
                      <span>{Array.isArray(value) ? value.join("-") : value}</span>
                    </div>
                  ))}
                </div>
                
                {eq.currentBatch && (
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="text-xs font-semibold">Current Batch: {eq.currentBatch}</p>
                  </div>
                )}
                
                {eq.lastBatch && !eq.currentBatch && (
                  <div className="text-xs text-gray-500">
                    Last Batch: {eq.lastBatch}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {equipment.filter(eq => eq.class === selectedEquipmentClass).length === 0 && (
          <p className="text-gray-500 text-center py-8">No equipment in this class</p>
        )}
      </div>
    </div>
  );
}