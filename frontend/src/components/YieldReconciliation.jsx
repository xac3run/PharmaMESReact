import React, { useState } from 'react';
import { Calculator, AlertTriangle, CheckCircle } from 'lucide-react';

export default function YieldReconciliation({ 
  batch,
  formula,
  updateBatchYield,
  addAuditEntry,
  showESignature,
  currentUser 
}) {
  // useState ВСЕГДА должны быть вверху, используйте опциональную цепочку
  const [actualYield, setActualYield] = useState(batch?.actualYield || 0);
  const [lossReason, setLossReason] = useState('');
  const [wasteAmount, setWasteAmount] = useState(0);

  // Проверка ПОСЛЕ useState
  if (!batch || batch.status !== 'completed') {
    return (
      <div className="glass-card text-center py-8">
        <p className="text-gray-600">Yield reconciliation only available for completed batches</p>
      </div>
    );
  }


  const theoreticalYield = batch.targetQuantity;
  const yieldPercentage = (actualYield / theoreticalYield) * 100;
  const deviation = Math.abs(100 - yieldPercentage);
  const isOutOfSpec = deviation > 2; // ±2% is typical limit

  const calculateMaterialBalance = () => {
    const totalInput = batch.materialConsumption.reduce((sum, mc) => sum + mc.quantity, 0);
    const expectedOutput = theoreticalYield * (formula.weightPerUnit / 1000); // Convert to grams
    const actualOutput = actualYield * (formula.weightPerUnit / 1000);
    const loss = totalInput - actualOutput - wasteAmount;

    return {
      totalInput,
      expectedOutput,
      actualOutput,
      loss,
      lossPercentage: (loss / totalInput) * 100
    };
  };

  const performYieldReconciliation = () => {
    if (!actualYield) {
      alert('Please enter actual yield');
      return;
    }

    if (isOutOfSpec && !lossReason) {
      alert('Deviation >2% requires explanation');
      return;
    }

    showESignature(
      'Yield Reconciliation',
      `Batch ${batch.id} - Actual: ${actualYield} units (${yieldPercentage.toFixed(2)}%)`,
      (signature) => {
        const balance = calculateMaterialBalance();
        
        updateBatchYield(batch.id, {
          actualYield,
          yieldPercentage,
          deviation,
          materialBalance: balance,
          lossReason: isOutOfSpec ? lossReason : null,
          wasteAmount,
          reconciledBy: signature.signedBy,
          reconciledAt: signature.timestamp,
          signature: signature,
          status: isOutOfSpec ? 'investigation_required' : 'reconciled'
        });

        addAuditEntry(
          "Yield Reconciliation", 
          `Batch ${batch.id} - Yield: ${yieldPercentage.toFixed(2)}%`,
          batch.id
        );
      }
    );
  };

  const balance = calculateMaterialBalance();

  return (
    <div className="space-y-4">
      <div className="glass-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Calculator className="w-5 h-5 mr-2" />
          Yield Reconciliation - Batch {batch.id}
        </h3>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Theoretical Yield</label>
              <div className="bg-gray-100 rounded p-3">
                <p className="text-2xl font-bold">{theoreticalYield} units</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Actual Yield *</label>
              <input
                type="number"
                className="border rounded px-3 py-2 w-full text-lg"
                value={actualYield}
                onChange={(e) => setActualYield(parseFloat(e.target.value) || 0)}
                placeholder="Enter actual yield"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Waste Amount (g)</label>
              <input
                type="number"
                className="border rounded px-3 py-2 w-full"
                value={wasteAmount}
                onChange={(e) => setWasteAmount(parseFloat(e.target.value) || 0)}
                placeholder="Documented waste"
              />
            </div>

            {isOutOfSpec && (
              <div>
                <label className="block text-sm font-semibold mb-2 text-red-600">
                  Loss Reason (Required for deviation &gt;2%)
                </label>
                <textarea
                  className="border border-red-300 rounded px-3 py-2 w-full"
                  rows="3"
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  placeholder="Explain reason for yield deviation..."
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className={`rounded-lg p-4 ${
              yieldPercentage >= 98 && yieldPercentage <= 102 ? 'bg-green-50 border border-green-300' :
              'bg-red-50 border border-red-300'
            }`}>
              <p className="text-sm font-semibold mb-2">Yield %</p>
              <p className={`text-3xl font-bold ${
                yieldPercentage >= 98 && yieldPercentage <= 102 ? 'text-green-700' : 'text-red-700'
              }`}>
                {yieldPercentage.toFixed(2)}%
              </p>
              <p className="text-xs mt-1">
                Deviation: {deviation.toFixed(2)}% {isOutOfSpec && '(Out of Spec)'}
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-white">
              <p className="text-sm font-semibold mb-3">Material Balance</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Input:</span>
                  <span className="font-semibold">{balance.totalInput.toFixed(2)} g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected Output:</span>
                  <span>{balance.expectedOutput.toFixed(2)} g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Actual Output:</span>
                  <span className="font-semibold">{balance.actualOutput.toFixed(2)} g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Documented Waste:</span>
                  <span>{wasteAmount.toFixed(2)} g</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Loss/Unaccounted:</span>
                  <span className={`font-semibold ${
                    Math.abs(balance.lossPercentage) > 2 ? 'text-red-700' : 'text-gray-900'
                  }`}>
                    {balance.loss.toFixed(2)} g ({balance.lossPercentage.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>

            {isOutOfSpec && (
              <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-900">Investigation Required</p>
                    <p className="text-yellow-800">Yield deviation exceeds ±2% acceptance criteria</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="text-sm text-gray-600">
            {batch.yieldReconciliation ? (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Reconciled by {batch.yieldReconciliation.reconciledBy} on {new Date(batch.yieldReconciliation.reconciledAt).toLocaleString()}</span>
              </div>
            ) : (
              <span>Not yet reconciled</span>
            )}
          </div>
          <button
            onClick={performYieldReconciliation}
            className="btn-primary"
            disabled={!actualYield || (isOutOfSpec && !lossReason)}
          >
            Sign & Reconcile Yield
          </button>
        </div>
      </div>
    </div>
  );
}
