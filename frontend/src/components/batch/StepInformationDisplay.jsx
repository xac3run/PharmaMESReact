import React from 'react';
import { Calculator } from 'lucide-react';

export default function StepInformationDisplay({ 
  step, 
  bomItem, 
  calculatedQuantity, 
  equipment, 
  workStations 
}) {
  // Защита от undefined/null
  if (!step) {
    return <div>Step information not available</div>;
  }

  return (
    <div className="flex-1">
      <div className="flex items-center space-x-2 mb-2">
        <h5 className="font-semibold text-lg">{step.name || 'Unnamed Step'}</h5>
        <span className={`px-2 py-1 rounded text-xs ${
          step.type === "qc" ? "bg-purple-100 text-purple-800" :
          step.type === "dispensing" ? "bg-yellow-100 text-yellow-800" :
          step.type === "weighing" ? "bg-orange-100 text-orange-800" :
          step.type === "mixing" ? "bg-cyan-100 text-cyan-800" :
          "bg-blue-100 text-blue-800"
        }`}>
          {(step.type || 'unknown').toUpperCase()}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-2">{step.instruction || 'No instruction provided'}</p>
      
      {equipment && (
        <p className="text-xs text-gray-500">Equipment: {equipment.name}</p>
      )}
      {workStations && (
        <p className="text-xs text-gray-500">Work Station: {workStations.name}</p>
      )}
      
      {/* Material Calculation */}
      {bomItem && calculatedQuantity !== null && calculatedQuantity !== undefined && (
        <div className="mt-2 p-2 bg-blue-50 rounded border">
          <div className="flex items-center space-x-2 mb-1">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Material Calculation</span>
          </div>
          <div className="text-xs space-y-1">
            <p><span className="font-semibold">Material:</span> {bomItem.material_article || 'Unknown'}</p>
            <p><span className="font-semibold">Formula quantity:</span> {bomItem.quantity || 0} {bomItem.unit || 'mg'} per unit</p>
            <p><span className="font-semibold">Calculated for batch:</span> 
              <span className="text-blue-700 font-bold"> {calculatedQuantity.toFixed(2)} {bomItem.unit || 'mg'}</span>
            </p>
            <p><span className="font-semibold">Tolerance:</span> {bomItem.min_quantity || 0} - {bomItem.max_quantity || 0} {bomItem.unit || 'mg'}</p>
          </div>
        </div>
      )}
      
      {/* Step Parameters */}
      {step.stepParameters && typeof step.stepParameters === 'object' && Object.keys(step.stepParameters).length > 0 && (
        <div className="mt-2 p-2 bg-gray-50 rounded">
          <div className="text-xs font-semibold mb-1">Step Parameters:</div>
          <div className="text-xs text-gray-600">
            {Object.entries(step.stepParameters).map(([key, value]) => (
              <span key={key} className="mr-3">{key}: {value}</span>
            ))}
          </div>
        </div>
      )}
      
      {/* QC Parameters */}
      {step.qcParameters && typeof step.qcParameters === 'object' && Object.keys(step.qcParameters).length > 0 && (
        <div className="mt-2 p-2 bg-purple-50 rounded border">
          <div className="text-xs font-semibold mb-1 text-purple-800">QC Specification:</div>
          <div className="text-xs text-purple-700">
            {step.qcParameters.parameter || 'Unknown'}: {step.qcParameters.min || 0} - {step.qcParameters.max || 0} {step.qcParameters.unit || '%'}
          </div>
        </div>
      )}
    </div>
  );
}