import React, { useState } from 'react';
import { Thermometer, Plus, TrendingUp, AlertTriangle, Wind, Droplets, Activity } from 'lucide-react';

export default function EnvironmentalMonitoring({ 
  envRecords,
  setEnvRecords,
  workStations,
  currentUser,
  addAuditEntry,
  showESignature,
  language = 'en'
}) {
  const [selectedStation, setSelectedStation] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [showNewReading, setShowNewReading] = useState(false);

  const createReading = (formData) => {
    showESignature(
      'Environmental Reading',
      `Record for ${workStations.find(ws => ws.id === parseInt(formData.get('stationId')))?.name}`,
      (signature) => {
        const newReading = {
          id: `ENV-${Date.now()}`,
          stationId: parseInt(formData.get('stationId')),
          stationName: workStations.find(ws => ws.id === parseInt(formData.get('stationId')))?.name,
          timestamp: new Date().toISOString(),
          recordedBy: signature.signedBy,
          signature: signature,
          parameters: {
            temperature: {
              value: parseFloat(formData.get('temperature')),
              unit: '°C',
              limit: { min: 15, max: 25 },
              status: null
            },
            humidity: {
              value: parseFloat(formData.get('humidity')),
              unit: '%',
              limit: { min: 30, max: 60 },
              status: null
            },
            pressure: {
              value: parseFloat(formData.get('pressure')),
              unit: 'Pa',
              limit: { min: -15, max: -5 },
              status: null
            },
            particleCount: {
              value: parseFloat(formData.get('particleCount')),
              unit: 'particles/m³',
              limit: { min: 0, max: 3520 },
              status: null
            },
            airflow: {
              value: parseFloat(formData.get('airflow')) || null,
              unit: 'm³/h',
              limit: { min: 20, max: 50 },
              status: null
            }
          },
          notes: formData.get('notes') || '',
          alerts: []
        };

        // Check parameters against limits
        Object.keys(newReading.parameters).forEach(key => {
          const param = newReading.parameters[key];
          if (param.value !== null) {
            if (param.value < param.limit.min || param.value > param.limit.max) {
              param.status = 'out_of_spec';
              newReading.alerts.push({
                parameter: key,
                value: param.value,
                limit: param.limit,
                severity: 'high'
              });
            } else if (
              param.value < param.limit.min + (param.limit.max - param.limit.min) * 0.1 ||
              param.value > param.limit.max - (param.limit.max - param.limit.min) * 0.1
            ) {
              param.status = 'warning';
              newReading.alerts.push({
                parameter: key,
                value: param.value,
                limit: param.limit,
                severity: 'medium'
              });
            } else {
              param.status = 'in_spec';
            }
          }
        });

        setEnvRecords(prev => [...prev, newReading]);
        
        if (newReading.alerts.length > 0) {
          addAuditEntry(
            "Environmental Alert", 
            `${newReading.stationName}: ${newReading.alerts.length} parameter(s) out of specification`
          );
        } else {
          addAuditEntry("Environmental Reading", `${newReading.stationName}: All parameters in spec`);
        }
        
        setShowNewReading(false);
      }
    );
  };

  // Filter records by time range
  const getFilteredRecords = () => {
    const now = Date.now();
    const ranges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };

    return envRecords.filter(r => {
      const timeMatch = now - new Date(r.timestamp).getTime() < ranges[timeRange];
      const stationMatch = !selectedStation || r.stationId === selectedStation;
      return timeMatch && stationMatch;
    });
  };

  const filteredRecords = getFilteredRecords();

  // Calculate statistics
  const calculateStats = (parameter) => {
    const values = filteredRecords
      .map(r => r.parameters[parameter]?.value)
      .filter(v => v !== null && v !== undefined);

    if (values.length === 0) return null;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const outOfSpec = filteredRecords.filter(r => 
      r.parameters[parameter]?.status === 'out_of_spec'
    ).length;

    return { avg, min, max, count: values.length, outOfSpec };
  };

  const tempStats = calculateStats('temperature');
  const humidityStats = calculateStats('humidity');
  const particleStats = calculateStats('particleCount');

  const recentAlerts = envRecords
    .filter(r => r.alerts.length > 0)
    .slice(0, 10)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <Thermometer className="w-6 h-6 mr-2 text-green-600" />
          Environmental Monitoring
        </h2>
        <button 
          onClick={() => setShowNewReading(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Record Reading</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600">Temperature</span>
            <Thermometer className="w-5 h-5 text-red-500" />
          </div>
          {tempStats ? (
            <div className="space-y-1">
              <div className="text-2xl font-bold">{tempStats.avg.toFixed(1)}°C</div>
              <div className="text-xs text-gray-600">
                Range: {tempStats.min.toFixed(1)} - {tempStats.max.toFixed(1)}°C
              </div>
              {tempStats.outOfSpec > 0 && (
                <div className="text-xs text-red-600 font-semibold">
                  {tempStats.outOfSpec} out of spec
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No data</p>
          )}
        </div>

        <div className="glass-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600">Humidity</span>
            <Droplets className="w-5 h-5 text-blue-500" />
          </div>
          {humidityStats ? (
            <div className="space-y-1">
              <div className="text-2xl font-bold">{humidityStats.avg.toFixed(1)}%</div>
              <div className="text-xs text-gray-600">
                Range: {humidityStats.min.toFixed(1)} - {humidityStats.max.toFixed(1)}%
              </div>
              {humidityStats.outOfSpec > 0 && (
                <div className="text-xs text-red-600 font-semibold">
                  {humidityStats.outOfSpec} out of spec
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No data</p>
          )}
        </div>

        <div className="glass-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600">Particle Count</span>
            <Activity className="w-5 h-5 text-purple-500" />
          </div>
          {particleStats ? (
            <div className="space-y-1">
              <div className="text-2xl font-bold">{particleStats.avg.toFixed(0)}</div>
              <div className="text-xs text-gray-600">
                particles/m³
              </div>
              {particleStats.outOfSpec > 0 && (
                <div className="text-xs text-red-600 font-semibold">
                  {particleStats.outOfSpec} out of spec
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No data</p>
          )}
        </div>
      </div>

      {showNewReading && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Record Environmental Reading</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            createReading(new FormData(e.target));
          }}>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="col-span-3">
                <label className="block text-sm font-semibold mb-1">Work Station / Clean Room</label>
                <select name="stationId" className="border rounded px-3 py-2 w-full" required>
                  <option value="">Select Station</option>
                  {workStations.map(ws => (
                    <option key={ws.id} value={ws.id}>{ws.name} - {ws.location}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Temperature (°C)</label>
                <input
                  name="temperature"
                  type="number"
                  step="0.1"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="15-25°C"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Humidity (%)</label>
                <input
                  name="humidity"
                  type="number"
                  step="0.1"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="30-60%"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Differential Pressure (Pa)</label>
                <input
                  name="pressure"
                  type="number"
                  step="0.1"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="-15 to -5 Pa"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Particle Count (particles/m³)</label>
                <input
                  name="particleCount"
                  type="number"
                  step="1"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Max 3520"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Air Flow (m³/h) - Optional</label>
                <input
                  name="airflow"
                  type="number"
                  step="0.1"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="20-50 m³/h"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-semibold mb-1">Notes (Optional)</label>
                <textarea
                  name="notes"
                  rows="2"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Any observations..."
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">Record Reading</button>
              <button 
                type="button" 
                onClick={() => setShowNewReading(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recent Alerts */}
      {recentAlerts.length > 0 && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            Recent Alerts
          </h3>
          <div className="space-y-2">
            {recentAlerts.map(record => (
              <div key={record.id} className="bg-red-50 border border-red-300 rounded p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-red-900">{record.stationName}</p>
                    <p className="text-xs text-gray-600">{new Date(record.timestamp).toLocaleString()}</p>
                    <div className="mt-1 space-y-1">
                      {record.alerts.map((alert, idx) => (
                        <div key={idx} className="text-xs text-red-700">
                          {alert.parameter}: {alert.value} (Limit: {alert.limit.min}-{alert.limit.max})
                        </div>
                      ))}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    record.alerts[0].severity === 'high' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                  }`}>
                    {record.alerts[0].severity.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-semibold">Time Range:</label>
            <select 
              className="border rounded px-3 py-1 text-sm"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-semibold">Station:</label>
            <select 
              className="border rounded px-3 py-1 text-sm"
              value={selectedStation || ''}
              onChange={(e) => setSelectedStation(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">All Stations</option>
              {workStations.map(ws => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-white/40">
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-semibold">Time</th>
                <th className="text-left py-2 px-2 font-semibold">Station</th>
                <th className="text-left py-2 px-2 font-semibold">Temp (°C)</th>
                <th className="text-left py-2 px-2 font-semibold">Humidity (%)</th>
                <th className="text-left py-2 px-2 font-semibold">Pressure (Pa)</th>
                <th className="text-left py-2 px-2 font-semibold">Particles</th>
                <th className="text-left py-2 px-2 font-semibold">Status</th>
                <th className="text-left py-2 px-2 font-semibold">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    No environmental records found
                  </td>
                </tr>
              ) : (
                filteredRecords
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map((record, idx) => {
                    const hasAlerts = record.alerts.length > 0;
                    return (
                      <tr key={record.id} className={`border-b hover:bg-white/40 ${idx % 2 === 0 ? 'bg-white/20' : ''} ${hasAlerts ? 'bg-red-50' : ''}`}>
                        <td className="py-2 px-2">{new Date(record.timestamp).toLocaleString()}</td>
                        <td className="py-2 px-2">{record.stationName}</td>
                        <td className={`py-2 px-2 ${record.parameters.temperature.status === 'out_of_spec' ? 'text-red-700 font-bold' : ''}`}>
                          {record.parameters.temperature.value.toFixed(1)}
                        </td>
                        <td className={`py-2 px-2 ${record.parameters.humidity.status === 'out_of_spec' ? 'text-red-700 font-bold' : ''}`}>
                          {record.parameters.humidity.value.toFixed(1)}
                        </td>
                        <td className={`py-2 px-2 ${record.parameters.pressure.status === 'out_of_spec' ? 'text-red-700 font-bold' : ''}`}>
                          {record.parameters.pressure.value.toFixed(1)}
                        </td>
                        <td className={`py-2 px-2 ${record.parameters.particleCount.status === 'out_of_spec' ? 'text-red-700 font-bold' : ''}`}>
                          {record.parameters.particleCount.value.toFixed(0)}
                        </td>
                        <td className="py-2 px-2">
                          {hasAlerts ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                              ALERT
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                              OK
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2">{record.recordedBy}</td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
