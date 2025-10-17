import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function CompletedStepDisplay({ completed, bomItem }) {
  return (
    <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
      {completed.hasDeviation && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded">
          <div className="flex items-center space-x-1 mb-1">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <span className="font-semibold text-red-800 text-xs">Deviation Detected</span>
          </div>
          <div className="text-xs text-red-700">
            {completed.deviationDescription}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="font-semibold">Value:</span> {completed.value}
        </div>
        <div>
          <span className="font-semibold">By:</span> {completed.completedBy}
        </div>
        <div className="col-span-2">
          <span className="font-semibold">Time:</span> {new Date(completed.timestamp).toLocaleString()}
        </div>
        {completed.lotNumber && (
          <div className="col-span-2">
            <span className="font-semibold">Lot:</span> {completed.lotNumber}
          </div>
        )}
        {bomItem && (
          <div className="col-span-2">
            <span className="font-semibold">Material:</span> {bomItem.material_article}
          </div>
        )}
        {completed.signature && (
          <div className="col-span-2 mt-2 p-2 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center space-x-1 mb-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="font-semibold text-green-800 text-xs">Electronic Signature</span>
            </div>
            <div className="text-xs text-green-700">
              <div>Signed by: {completed.signature.user}</div>
              <div>Time: {new Date(completed.signature.timestamp).toLocaleString()}</div>
              {completed.signature.reason && (
                <div>Reason: {completed.signature.reason}</div>
              )}
            </div>
          </div>
        )}
        {completed.calculatedQuantity && (
          <div className="col-span-2 text-xs text-blue-600">
            Target: {completed.calculatedQuantity.toFixed(2)} {bomItem?.unit}
          </div>
        )}
      </div>
    </div>
  );
}