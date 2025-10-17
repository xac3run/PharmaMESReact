import React from 'react';
import { CheckCircle } from 'lucide-react';
import StepInformationDisplay from './StepInformationDisplay';
import BatchStepExecutor from './BatchStepExecutor';
import CompletedStepDisplay from './CompletedStepDisplay';

export default function WorkflowStepCard({ 
  step, 
  idx, 
  completed, 
  isCurrent, 
  canExecute, 
  batch,
  bomItem,
  calculatedQuantity,
  equipment,
  workStations,
  currentUser,
  executeStepWithSignature
}) {
  return (
    <div 
      className={`p-4 rounded-lg border-2 mb-3 ${
        completed ? "bg-green-50 border-green-300" :
        isCurrent ? "bg-blue-50 border-blue-400" :
        "bg-gray-50 border-gray-200 opacity-50"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2 mb-2">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
            completed ? "bg-green-500 text-white" :
            isCurrent ? "bg-blue-500 text-white" :
            "bg-gray-300 text-gray-600"
          }`}>
            {idx + 1}
          </span>
          <StepInformationDisplay
            step={step}
            bomItem={bomItem}
            calculatedQuantity={calculatedQuantity}
            equipment={equipment}
            workStations={workStations}
          />
        </div>
        {completed && (
          <CheckCircle className="w-6 h-6 text-green-600" />
        )}
      </div>
      
      {/* Interactive Execution Area */}
      {isCurrent && canExecute && (
        <BatchStepExecutor
          step={step}
          batch={batch}
          bomItem={bomItem}
          calculatedQuantity={calculatedQuantity}
          currentUser={currentUser}
          canExecute={canExecute}
          executeStepWithSignature={executeStepWithSignature}
        />
      )}
      
      {isCurrent && !canExecute && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
          <p className="text-sm text-yellow-800">
            You don't have access to this work station. Please contact supervisor.
          </p>
        </div>
      )}
      
      {/* Completed Step Display */}
      {completed && (
        <CompletedStepDisplay 
          completed={completed}
          bomItem={bomItem}
        />
      )}
    </div>
  );
}