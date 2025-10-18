import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Package, Wrench, X, TrendingUp, Calendar } from 'lucide-react';

export default function Dashboard({ batches, formulas, workflows, auditTrail, equipment, materials, deviations, capas }) {
  const [modalContent, setModalContent] = useState(null);
  // Вычисляем метрики
  const releasedBatchesCount = batches.filter(b => b.status === 'released').length;
  const openDeviationsCount = deviations?.filter(d => d.status === 'open').length || 0;
  const operationalEquipment = equipment?.filter(e => e.status === 'operational').length || 0;
  const totalEquipment = equipment?.length || 1;
  const expiredCalibration = equipment?.filter(e => e.calibrationStatus === 'expired').length || 0;
  const expiredMaterials = materials?.filter(m => new Date(m.expiryDate) < new Date()).length || 0;
  const openCAPAs = capas?.filter(c => c.status !== 'closed').length || 0;

  // Сегодняшние батчи
  const today = new Date().toISOString().split('T')[0];
  const todayBatches = batches.filter(b => b.startedAt?.startsWith(today));

  // Функции для модальных окон
  const showBatchesModal = () => {
    const completed = batches.filter(b => b.status === 'completed').length;
    const inProgress = batches.filter(b => b.status === 'in_progress').length;
    const planned = batches.filter(b => b.status === 'planned').length;
    
    setModalContent({
      title: 'Batch Statistics',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-2xl font-bold text-blue-600">{batches.length}</div>
              <div className="text-sm text-gray-600">Total Batches</div>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <div className="text-2xl font-bold text-green-600">{completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded">
              <div className="text-2xl font-bold text-yellow-600">{inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <div className="text-2xl font-bold text-purple-600">{planned}</div>
              <div className="text-sm text-gray-600">Planned</div>
            </div>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Recent Batches:</h4>
            <div className="space-y-2">
              {batches.slice(-5).reverse().map(b => (
                <div key={b.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                  <span className="font-medium">{b.id}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    b.status === 'completed' ? 'bg-green-100 text-green-700' :
                    b.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{b.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    });
  };

  const showActiveBatchesModal = () => {
    const active = batches.filter(b => b.status === 'in_progress');
    
    setModalContent({
      title: 'Active Batches Details',
      content: (
        <div className="space-y-3">
          {active.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active batches</p>
          ) : (
            active.map(batch => (
              <div key={batch.id} className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-lg">{batch.id}</div>
                    <div className="text-sm text-gray-600">Formula: {batch.formulaId}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Progress</div>
                    <div className="text-2xl font-bold text-green-600">{batch.progress || 0}%</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${batch.progress || 0}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Started: {batch.startedAt ? new Date(batch.startedAt).toLocaleDateString() : 'N/A'}</div>
                  <div>Target Qty: {batch.targetQuantity || 'N/A'}</div>
                  <div>Started By: {batch.startedBy || 'N/A'}</div>
                  <div>Current Step: {batch.currentStepIndex + 1 || 'N/A'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )
    });
  };

  const showOEEModal = () => {
    // Симуляция OEE данных для миксера
    const availability = 87.5; // % времени когда оборудование работает
    const performance = 92.3;  // % от максимальной скорости
    const quality = 96.8;      // % годной продукции
    const oee = ((availability * performance * quality) / 10000).toFixed(1);
    
    const mixerData = {
      name: "High Shear Mixer HSM-500",
      shift: "Day Shift",
      plannedTime: 480, // минут
      downtime: 60,
      actualProduction: 450,
      targetProduction: 488,
      defects: 15,
      goodUnits: 435
    };

    setModalContent({
      title: 'Equipment OEE - High Shear Mixer',
      content: (
        <div className="space-y-4">
          {/* OEE Score */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 text-center">
            <div className="text-sm opacity-90 mb-2">Overall Equipment Effectiveness</div>
            <div className="text-5xl font-bold">{oee}%</div>
            <div className="text-sm opacity-90 mt-2">Target: 85% (World Class)</div>
          </div>

          {/* Three Pillars */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-600 mb-1">Availability</div>
              <div className="text-3xl font-bold text-green-600">{availability}%</div>
              <div className="text-xs text-gray-500 mt-1">Uptime</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-600 mb-1">Performance</div>
              <div className="text-3xl font-bold text-blue-600">{performance}%</div>
              <div className="text-xs text-gray-500 mt-1">Speed</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-600 mb-1">Quality</div>
              <div className="text-3xl font-bold text-purple-600">{quality}%</div>
              <div className="text-xs text-gray-500 mt-1">Good Units</div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm text-gray-700">Shift Details ({mixerData.shift})</h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-600 text-xs">Planned Production Time</div>
                <div className="font-bold text-lg">{mixerData.plannedTime} min</div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="text-gray-600 text-xs">Downtime</div>
                <div className="font-bold text-lg text-red-600">{mixerData.downtime} min</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-gray-600 text-xs">Actual Production</div>
                <div className="font-bold text-lg text-blue-600">{mixerData.actualProduction} kg</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-600 text-xs">Target Production</div>
                <div className="font-bold text-lg">{mixerData.targetProduction} kg</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="text-gray-600 text-xs">Good Units</div>
                <div className="font-bold text-lg text-purple-600">{mixerData.goodUnits} kg</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <div className="text-gray-600 text-xs">Defects/Waste</div>
                <div className="font-bold text-lg text-yellow-600">{mixerData.defects} kg</div>
              </div>
            </div>
          </div>

          {/* Loss Analysis */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold text-sm text-gray-700 mb-3">Loss Analysis</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">⏰ Availability Loss</span>
                <span className="font-semibold text-red-600">{(100 - availability).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">🐌 Performance Loss</span>
                <span className="font-semibold text-orange-600">{(100 - performance).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">❌ Quality Loss</span>
                <span className="font-semibold text-yellow-600">{(100 - quality).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-blue-900 mb-2">💡 Improvement Opportunities</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Reduce planned maintenance downtime by 15 minutes</li>
              <li>• Optimize mixing speed to reach 95% performance</li>
              <li>• Review quality parameters to reduce defects to &lt;1%</li>
            </ul>
          </div>
        </div>
      )
    });
  };

  const showReleasedBatchesModal = () => {
    const released = batches.filter(b => b.status === 'released');
    
    setModalContent({
      title: 'Released Batches',
      content: (
        <div className="space-y-3">
          {released.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No released batches this month</p>
          ) : (
            released.map(batch => (
              <div key={batch.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-lg">{batch.id}</div>
                    <div className="text-sm text-gray-600">Formula: {batch.formulaId}</div>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                {batch.releaseInfo && (
                  <div className="mt-2 text-xs space-y-1">
                    <div>Released by: {batch.releaseInfo.approvedBy}</div>
                    <div>Date: {new Date(batch.releaseInfo.approvalDate).toLocaleDateString()}</div>
                    <div>Certificate: {batch.releaseInfo.certificateNumber}</div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )
    });
  };

  const showDeviationsModal = () => {
    const open = deviations?.filter(d => d.status === 'open') || [];
    
    setModalContent({
      title: 'Open Deviations',
      content: (
        <div className="space-y-3">
          {open.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No open deviations</p>
          ) : (
            open.map(dev => (
              <div key={dev.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold">{dev.id}</div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    dev.severity === 'critical' ? 'bg-red-100 text-red-700' :
                    dev.severity === 'major' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{dev.severity}</span>
                </div>
                <div className="text-sm mb-2">{dev.description}</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Batch: {dev.batchId || 'N/A'}</div>
                  <div>Reported: {new Date(dev.reportedDate).toLocaleDateString()}</div>
                  <div>Reporter: {dev.reportedBy}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )
    });
  };

  const showEquipmentModal = () => {
    const operational = equipment?.filter(e => e.status === 'operational') || [];
    const maintenance = equipment?.filter(e => e.status === 'maintenance') || [];
    const expired = equipment?.filter(e => e.calibrationStatus === 'expired') || [];
    
    setModalContent({
      title: 'Equipment Status',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 p-3 rounded text-center">
              <div className="text-2xl font-bold text-green-600">{operational.length}</div>
              <div className="text-xs text-gray-600">Operational</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded text-center">
              <div className="text-2xl font-bold text-yellow-600">{maintenance.length}</div>
              <div className="text-xs text-gray-600">Maintenance</div>
            </div>
            <div className="bg-red-50 p-3 rounded text-center">
              <div className="text-2xl font-bold text-red-600">{expired.length}</div>
              <div className="text-xs text-gray-600">Cal. Expired</div>
            </div>
          </div>
          <div className="border-t pt-3">
            <h4 className="font-semibold mb-2 text-sm">Equipment List:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {equipment?.map(eq => (
                <div key={eq.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{eq.name}</div>
                    <div className="text-xs text-gray-500">{eq.class}</div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      eq.status === 'operational' ? 'bg-green-100 text-green-700' :
                      eq.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{eq.status}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      eq.calibrationStatus === 'valid' ? 'bg-green-100 text-green-700' :
                      eq.calibrationStatus === 'due' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{eq.calibrationStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    });
  };

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {(expiredCalibration > 0 || openDeviationsCount > 0 || expiredMaterials > 0) && (
        <div className="glass-card bg-red-50 border-l-4 border-red-500">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-800">Critical Alerts</h3>
          </div>
          <div className="space-y-2 text-sm">
            {expiredCalibration > 0 && (
              <div className="flex items-center gap-2 text-red-700">
                <Wrench className="w-4 h-4" />
                <span>{expiredCalibration} Equipment Calibration Expired</span>
              </div>
            )}
            {openDeviationsCount > 0 && (
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span>{openDeviationsCount} Open Deviations</span>
              </div>
            )}
            {expiredMaterials > 0 && (
              <div className="flex items-center gap-2 text-red-700">
                <Package className="w-4 h-4" />
                <span>{expiredMaterials} Expired Materials</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card cursor-pointer hover:shadow-lg transition-shadow" onClick={showBatchesModal}>
          <div className="text-3xl font-bold text-blue-600">{batches.length}</div>
          <div className="text-gray-600 text-sm">Total Batches</div>
          <div className="text-xs text-blue-500 mt-1">Click for details →</div>
        </div>
        <div className="glass-card cursor-pointer hover:shadow-lg transition-shadow" onClick={showActiveBatchesModal}>
          <div className="text-3xl font-bold text-green-600">
            {batches.filter(b => b.status === "in_progress").length}
          </div>
          <div className="text-gray-600 text-sm">Active Batches</div>
          <div className="text-xs text-green-500 mt-1">Click for details →</div>
        </div>
        <div className="glass-card cursor-pointer hover:shadow-lg transition-shadow" onClick={showOEEModal}>
          <div className="text-3xl font-bold text-purple-600">77.8%</div>
          <div className="text-gray-600 text-sm">Equipment OEE</div>
          <div className="text-xs text-purple-500 mt-1">Click for details →</div>
        </div>
        <div className="glass-card">
          <div className="text-3xl font-bold text-orange-600">{workflows.length}</div>
          <div className="text-gray-600 text-sm">Workflows</div>
        </div>
      </div>

      {/* Quality & Compliance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card cursor-pointer hover:shadow-lg transition-shadow" onClick={showReleasedBatchesModal}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Released Batches</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">{releasedBatchesCount}</div>
          <div className="text-xs text-green-500 mt-1">Click for details →</div>
        </div>
        
        <div className="glass-card cursor-pointer hover:shadow-lg transition-shadow" onClick={showDeviationsModal}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Open Deviations</span>
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-yellow-600">{openDeviationsCount}</div>
          <div className="text-xs text-yellow-500 mt-1">Click for details →</div>
        </div>
        
        <div className="glass-card cursor-pointer hover:shadow-lg transition-shadow" onClick={showEquipmentModal}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Equipment Ready</span>
            <Wrench className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {operationalEquipment}/{totalEquipment}
          </div>
          <div className="text-xs text-blue-500 mt-1">Click for details →</div>
        </div>
      </div>

      {/* Today's Production */}
      {todayBatches.length > 0 && (
        <div className="glass-card">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-bold">Today's Production</h3>
          </div>
          <div className="space-y-3">
            {todayBatches.map(batch => (
              <div key={batch.id} className="bg-white/40 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{batch.id}</span>
                  <span className="text-sm px-2 py-1 rounded bg-blue-100 text-blue-700">
                    {batch.status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${batch.progress || 0}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-1">{batch.progress || 0}% Complete</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="glass-card">
        <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {auditTrail.slice(-5).reverse().map(entry => (
            <div key={entry.id} className="flex justify-between text-sm p-2 bg-white/40 rounded">
              <span>{entry.action}: {entry.details}</span>
              <span className="text-gray-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modalContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModalContent(null)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-teal-600 to-teal-700 text-white">
              <h3 className="text-xl font-bold">{modalContent.title}</h3>
              <button 
                onClick={() => setModalContent(null)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {modalContent.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}