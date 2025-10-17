import React from 'react';
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function BatchStepExecutor({ 
  step, 
  batch, 
  bomItem, 
  calculatedQuantity, 
  currentUser, 
  canExecute, 
  executeStepWithSignature 
}) {
  
  const handleStepExecution = () => {
    let value, lotNumber = null, additionalData = {};
    
    // Валидация и сбор данных в зависимости от типа шага
    if (step.type === "dispensing") {
      value = document.getElementById(`weight-${step.id}`).value;
      lotNumber = document.getElementById(`lot-${step.id}`).value;
      
      if (!value || !lotNumber) {
        alert("Please enter both weight and lot number");
        return;
      }
      
      // Validate against calculated quantity and tolerance
      if (bomItem && calculatedQuantity) {
        const actualWeight = parseFloat(value);
        const tolerance = bomItem.max_quantity - bomItem.min_quantity;
        const minAllowed = calculatedQuantity - tolerance;
        const maxAllowed = calculatedQuantity + tolerance;
        
        if (actualWeight < minAllowed || actualWeight > maxAllowed) {
          if (!confirm(`Weight ${actualWeight} ${bomItem.unit} is outside tolerance (${minAllowed.toFixed(2)}-${maxAllowed.toFixed(2)} ${bomItem.unit}). Continue?`)) {
            return;
          }
        }
      }
    } else if (step.type === "weighing") {
      value = document.getElementById(`weight-${step.id}`).value;
      additionalData.balanceId = document.getElementById(`balance-${step.id}`).value;
      
      if (!value) {
        alert("Please enter weight value");
        return;
      }
    } else if (step.type === "process") {
      value = document.getElementById(`confirm-${step.id}`).value;
      if (value.toUpperCase() !== "CONFIRMED") {
        alert("Please type 'CONFIRMED' to proceed");
        return;
      }
    } else if (step.type === "mixing") {
      const duration = document.getElementById(`duration-${step.id}`).value;
      const rpm = document.getElementById(`rpm-${step.id}`).value;
      const temp = document.getElementById(`temp-${step.id}`).value;
      
      if (!duration || !rpm || !temp) {
        alert("Please enter all mixing parameters");
        return;
      }
      
      value = `Duration: ${duration}min, RPM: ${rpm}, Temp: ${temp}°C`;
      additionalData = { duration, rpm, temperature: temp };
    } else if (step.type === "qc") {
      value = document.getElementById(`qc-${step.id}`).value;
      
      if (!value) {
        alert("Please enter QC measurement");
        return;
      }
      
      const val = parseFloat(value);
      
      // Validate QC parameters
      if (val < step.qcParameters.min || val > step.qcParameters.max) {
        if (!confirm(`QC result ${val} ${step.qcParameters.unit} is out of specification (${step.qcParameters.min}-${step.qcParameters.max}). This will require deviation handling. Continue?`)) {
          return;
        }
      }
    }
    
    // Подготовка данных для выполнения шага с подписью
    const stepData = {
      batchId: batch.id,
      stepId: step.id,
      value,
      lotNumber,
      calculatedQuantity,
      bomItem,
      additionalData,
      step
    };
    
    // Выполняем шаг с обязательной электронной подписью
    executeStepWithSignature(stepData);
  };

  if (!canExecute) {
    return (
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
        <p className="text-sm text-yellow-800">
          You don't have access to this work station. Please contact supervisor.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-300">
      <div className="space-y-3">
        <div className="text-sm font-semibold text-blue-800 mb-2">Execute Step</div>
        
        {step.type === "dispensing" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Actual Weight ({bomItem?.unit || 'g'})
                {calculatedQuantity && (
                  <span className="text-blue-600 ml-1">
                    (Target: {calculatedQuantity.toFixed(2)})
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.01"
                className="border rounded px-3 py-2 w-full"
                placeholder={calculatedQuantity ? calculatedQuantity.toFixed(2) : "Enter weight"}
                id={`weight-${step.id}`}
              />
              {bomItem && calculatedQuantity && (
                <div className="text-xs text-gray-500 mt-1">
                  Tolerance: {bomItem.min_quantity} - {bomItem.max_quantity} {bomItem.unit}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Lot Number</label>
              <input
                type="text"
                className="border rounded px-3 py-2 w-full"
                placeholder="Enter lot"
                id={`lot-${step.id}`}
              />
            </div>
          </div>
        )}
        
        {step.type === "weighing" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Weighed Amount ({bomItem?.unit || 'g'})
                {calculatedQuantity && (
                  <span className="text-blue-600 ml-1">
                    (Target: {calculatedQuantity.toFixed(2)})
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.01"
                className="border rounded px-3 py-2 w-full"
                placeholder={calculatedQuantity ? calculatedQuantity.toFixed(2) : "Enter weight"}
                id={`weight-${step.id}`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Balance ID</label>
              <input
                type="text"
                className="border rounded px-3 py-2 w-full"
                placeholder="Balance identifier"
                id={`balance-${step.id}`}
              />
            </div>
          </div>
        )}
        
        {step.type === "process" && (
          <div>
            <label className="block text-xs font-semibold mb-1">Confirmation</label>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full"
              placeholder="Type 'CONFIRMED'"
              id={`confirm-${step.id}`}
            />
          </div>
        )}
        
        {step.type === "mixing" && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Duration (min)</label>
              <input
                type="number"
                className="border rounded px-3 py-2 w-full"
                placeholder={step.stepParameters?.duration || "30"}
                id={`duration-${step.id}`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">RPM</label>
              <input
                type="number"
                className="border rounded px-3 py-2 w-full"
                placeholder={step.stepParameters?.rpm || "60"}
                id={`rpm-${step.id}`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Temp (°C)</label>
              <input
                type="number"
                className="border rounded px-3 py-2 w-full"
                placeholder={step.stepParameters?.temperature || "20"}
                id={`temp-${step.id}`}
              />
            </div>
          </div>
        )}
        
        {step.type === "qc" && (
          <div>
            <label className="block text-xs font-semibold mb-1">
              {step.qcParameters.parameter} ({step.qcParameters.unit})
            </label>
            <p className="text-xs text-red-600 mb-2">
              Specification: {step.qcParameters.min} - {step.qcParameters.max} {step.qcParameters.unit}
            </p>
            <input
              type="number"
              step="0.01"
              className="border rounded px-3 py-2 w-full"
              placeholder="Enter measurement"
              id={`qc-${step.id}`}
            />
          </div>
        )}
        
        <button
          onClick={handleStepExecution}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold w-full flex items-center justify-center space-x-2"
        >
          <Lock className="w-4 h-4" />
          <CheckCircle className="w-4 h-4" />
          <span>Complete Step & E-Sign</span>
        </button>
      </div>
    </div>
  );
}