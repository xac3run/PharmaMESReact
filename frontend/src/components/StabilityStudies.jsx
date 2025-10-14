import React, { useState } from 'react';
import { Plus, Calendar, Thermometer, CheckCircle, AlertTriangle, Clock, TrendingDown, ChevronDown, ChevronUp, FlaskConical } from 'lucide-react';

export default function StabilityStudies({
  stabilityStudies,
  setStabilityStudies,
  batches,
  formulas,
  currentUser,
  addAuditEntry,
  showESignature,
  language = 'en'
}) {
  const [expandedStudy, setExpandedStudy] = useState(null);
  const [showNewStudy, setShowNewStudy] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const createStabilityStudy = (formData) => {
    const newStudy = {
      id: `STAB-${Date.now()}`,
      batchId: formData.get('batchId'),
      product: formData.get('product'),
      startDate: formData.get('startDate'),
      duration: parseInt(formData.get('duration')),
      status: 'active',
      conditions: [
        {
          id: 1,
          name: '25°C/60%RH',
          type: 'long_term',
          temperature: 25,
          humidity: 60,
          description: 'Long-term storage condition'
        },
        {
          id: 2,
          name: '40°C/75%RH',
          type: 'accelerated',
          temperature: 40,
          humidity: 75,
          description: 'Accelerated storage condition'
        }
      ],
      pullSchedule: [0, 3, 6, 12, 18, 24], // months
      samples: [],
      testResults: [],
      initiatedBy: currentUser.name,
      initiatedDate: new Date().toISOString()
    };

    // Generate sample pull schedule
    newStudy.conditions.forEach(condition => {
      newStudy.pullSchedule.forEach(month => {
        const pullDate = new Date(newStudy.startDate);
        pullDate.setMonth(pullDate.getMonth() + month);

        newStudy.samples.push({
          id: `${newStudy.id}-${condition.id}-M${month}`,
          conditionId: condition.id,
          conditionName: condition.name,
          timepoint: month,
          scheduledPullDate: pullDate.toISOString(),
          status: month === 0 ? 'available' : 'scheduled',
          pulledDate: month === 0 ? newStudy.startDate : null,
          pulledBy: month === 0 ? currentUser.name : null,
          storageLocation: `Stability Chamber ${condition.id}`,
          tests: [
            { name: 'Appearance', result: null, status: 'pending', spec: 'White to off-white' },
            { name: 'Assay (%)', result: null, status: 'pending', spec: '95.0-105.0', min: 95.0, max: 105.0 },
            { name: 'Impurities (%)', result: null, status: 'pending', spec: 'NMT 2.0', max: 2.0 },
            { name: 'Dissolution (%)', result: null, status: 'pending', spec: 'NLT 80% in 30 min', min: 80.0 }
          ]
        });
      });
    });

    setStabilityStudies(prev => [...prev, newStudy]);
    addAuditEntry("Stability Study Created", `${newStudy.id} for batch ${newStudy.batchId}`);
    setShowNewStudy(false);
  };

  const pullSample = (studyId, sampleId) => {
    showESignature(
      'Sample Pull',
      `Pull sample ${sampleId}`,
      (signature) => {
        setStabilityStudies(prev => prev.map(study => {
          if (study.id === studyId) {
            return {
              ...study,
              samples: study.samples.map(sample => 
                sample.id === sampleId ? {
                  ...sample,
                  status: 'available',
                  pulledDate: new Date().toISOString(),
                  pulledBy: signature.signedBy,
                  signature: signature
                } : sample
              )
            };
          }
          return study;
        }));
        addAuditEntry("Stability Sample Pulled", `${sampleId} from study ${studyId}`);
      }
    );
  };

  const recordTestResults = (studyId, sampleId, testResults) => {
    showESignature(
      'Stability Test Results',
      `Record test results for ${sampleId}`,
      (signature) => {
        setStabilityStudies(prev => prev.map(study => {
          if (study.id === studyId) {
            const updatedSamples = study.samples.map(sample => {
              if (sample.id === sampleId) {
                const updatedTests = sample.tests.map((test, idx) => {
                  const newResult = testResults[idx];
                  let pass = true;
                  
                  if (test.min !== undefined && newResult < test.min) pass = false;
                  if (test.max !== undefined && newResult > test.max) pass = false;
                  
                  return {
                    ...test,
                    result: newResult,
                    status: pass ? 'pass' : 'fail',
                    testedBy: signature.signedBy,
                    testedDate: signature.timestamp
                  };
                });

                return {
                  ...sample,
                  status: 'tested',
                  tests: updatedTests,
                  testSignature: signature
                };
              }
              return sample;
            });

            // Check if study should be completed
            const allSamplesTested = updatedSamples.every(s => s.status === 'tested');
            const newStatus = allSamplesTested ? 'completed' : study.status;

            return {
              ...study,
              samples: updatedSamples,
              status: newStatus
            };
          }
          return study;
        }));
        addAuditEntry("Stability Test Results Recorded", `${sampleId} from study ${studyId}`);
      }
    );
  };

  const generateShelfLife = (studyId) => {
    const study = stabilityStudies.find(s => s.id === studyId);
    
    // Simple shelf-life determination based on when assay drops below 95%
    const longTermSamples = study.samples.filter(s => 
      s.conditionName === '25°C/60%RH' && s.status === 'tested'
    );

    let shelfLifeMonths = study.duration;
    
    for (let sample of longTermSamples) {
      const assayTest = sample.tests.find(t => t.name === 'Assay (%)');
      if (assayTest && assayTest.result && assayTest.result < 95.0) {
        shelfLifeMonths = Math.min(shelfLifeMonths, sample.timepoint);
        break;
      }
    }

    const shelfLife = {
      determinedShelfLife: shelfLifeMonths,
      assignedShelfLife: Math.floor(shelfLifeMonths * 0.8), // 80% of determined
      expiryMonths: Math.floor(shelfLifeMonths * 0.8),
      determinedBy: currentUser.name,
      determinedDate: new Date().toISOString(),
      basedOnData: `${longTermSamples.length} timepoints at 25°C/60%RH`
    };

    setStabilityStudies(prev => prev.map(s => 
      s.id === studyId ? { ...s, shelfLife, status: 'shelf_life_determined' } : s
    ));

    addAuditEntry("Shelf Life Determined", `Study ${studyId}: ${shelfLife.assignedShelfLife} months`);
    alert(`Shelf life determined: ${shelfLife.assignedShelfLife} months`);
  };

  const filteredStudies = stabilityStudies.filter(study => {
    if (filterStatus === 'all') return true;
    return study.status === filterStatus;
  });

  const stats = {
    total: stabilityStudies.length,
    active: stabilityStudies.filter(s => s.status === 'active').length,
    dueSamples: stabilityStudies.reduce((sum, study) => {
      const due = study.samples.filter(s => {
        if (s.status !== 'scheduled') return false;
        const pullDate = new Date(s.scheduledPullDate);
        const today = new Date();
        const daysUntil = (pullDate - today) / (1000 * 60 * 60 * 24);
        return daysUntil <= 7; // due within 7 days
      }).length;
      return sum + due;
    }, 0),
    completed: stabilityStudies.filter(s => s.status === 'completed' || s.status === 'shelf_life_determined').length
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <FlaskConical className="w-6 h-6 mr-2" />
          Stability Studies
        </h2>
        <button 
          onClick={() => setShowNewStudy(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Study</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-blue-700">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Studies</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Active Studies</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.dueSamples}</div>
          <div className="text-sm text-gray-600">Samples Due (7 days)</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-purple-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      {showNewStudy && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Create New Stability Study</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            createStabilityStudy(new FormData(e.target));
          }}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Batch ID</label>
                <select name="batchId" className="border rounded px-3 py-2 w-full" required>
                  <option value="">Select Batch</option>
                  {batches.filter(b => b.status === 'released' || b.status === 'completed').map(batch => (
                    <option key={batch.id} value={batch.id}>{batch.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Product</label>
                <input
                  name="product"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Product name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Start Date</label>
                <input
                  name="startDate"
                  type="date"
                  required
                  className="border rounded px-3 py-2 w-full"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Duration (months)</label>
                <select name="duration" className="border rounded px-3 py-2 w-full" required>
                  <option value="12">12 months</option>
                  <option value="24" selected>24 months</option>
                  <option value="36">36 months</option>
                </select>
              </div>
              <div className="col-span-2 bg-blue-50 p-3 rounded">
                <p className="text-sm font-semibold mb-1">Storage Conditions (Demo Version):</p>
                <div className="text-xs space-y-1">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-3 h-3" />
                    <span>25°C/60%RH - Long-term storage</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-3 h-3" />
                    <span>40°C/75%RH - Accelerated storage</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">Pull schedule: 0, 3, 6, 12, 18, 24 months</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">Create Study</button>
              <button 
                type="button" 
                onClick={() => setShowNewStudy(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Studies List */}
      <div className="glass-card">
        <div className="flex items-center space-x-4 mb-4">
          <label className="text-sm font-semibold">Status:</label>
          <select 
            className="border rounded px-3 py-1 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="shelf_life_determined">Shelf Life Determined</option>
          </select>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs">Study ID</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Batch</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Product</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Start Date</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Duration</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Status</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Progress</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudies.map((study, idx) => {
              const testedSamples = study.samples.filter(s => s.status === 'tested').length;
              const totalSamples = study.samples.length;
              const progress = Math.round((testedSamples / totalSamples) * 100);

              return (
                <React.Fragment key={study.id}>
                  <tr className={`border-b hover:bg-white/40 ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                    <td className="py-2 px-2 font-mono text-xs">{study.id}</td>
                    <td className="py-2 px-2 text-xs">{study.batchId}</td>
                    <td className="py-2 px-2 text-xs">{study.product}</td>
                    <td className="py-2 px-2 text-xs">{new Date(study.startDate).toLocaleDateString()}</td>
                    <td className="py-2 px-2 text-xs">{study.duration} months</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        study.status === 'shelf_life_determined' ? 'bg-purple-100 text-purple-800' :
                        study.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {study.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{width: `${progress}%`}}
                          />
                        </div>
                        <span className="text-xs">{progress}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => setExpandedStudy(expandedStudy === study.id ? null : study.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {expandedStudy === study.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </td>
                  </tr>

                  {expandedStudy === study.id && (
                    <tr>
                      <td colSpan="8" className="py-4 px-4 bg-white/60">
                        <div className="space-y-4">
                          {/* Storage Conditions */}
                          <div>
                            <p className="font-semibold mb-2 flex items-center">
                              <Thermometer className="w-4 h-4 mr-2" />
                              Storage Conditions
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {study.conditions.map(condition => (
                                <div key={condition.id} className="bg-gray-50 p-2 rounded text-xs">
                                  <p className="font-semibold">{condition.name}</p>
                                  <p className="text-gray-600">{condition.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Sample Schedule */}
                          <div>
                            <p className="font-semibold mb-2 flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              Sample Pull Schedule
                            </p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="text-left p-2">Timepoint</th>
                                    <th className="text-left p-2">Condition</th>
                                    <th className="text-left p-2">Scheduled Date</th>
                                    <th className="text-left p-2">Status</th>
                                    <th className="text-left p-2">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {study.samples.map(sample => {
                                    const isPastDue = new Date(sample.scheduledPullDate) < new Date() && sample.status === 'scheduled';
                                    
                                    return (
                                      <tr key={sample.id} className="border-t">
                                        <td className="p-2">Month {sample.timepoint}</td>
                                        <td className="p-2">{sample.conditionName}</td>
                                        <td className="p-2">{new Date(sample.scheduledPullDate).toLocaleDateString()}</td>
                                        <td className="p-2">
                                          <span className={`px-2 py-1 rounded text-xs ${
                                            sample.status === 'tested' ? 'bg-green-100 text-green-800' :
                                            sample.status === 'available' ? 'bg-blue-100 text-blue-800' :
                                            isPastDue ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {sample.status.toUpperCase()} {isPastDue && '(OVERDUE)'}
                                          </span>
                                        </td>
                                        <td className="p-2">
                                          {sample.status === 'scheduled' && (
                                            <button
                                              onClick={() => pullSample(study.id, sample.id)}
                                              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                            >
                                              Pull Sample
                                            </button>
                                          )}
                                          {sample.status === 'available' && (
                                            <button
                                              onClick={() => {
                                                const results = sample.tests.map(test => {
                                                  const value = prompt(`${test.name} - Enter result:`, '');
                                                  return parseFloat(value) || 0;
                                                });
                                                if (results.every(r => !isNaN(r))) {
                                                  recordTestResults(study.id, sample.id, results);
                                                }
                                              }}
                                              className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                                            >
                                              Record Results
                                            </button>
                                          )}
                                          {sample.status === 'tested' && (
                                            <button
                                              onClick={() => {
                                                alert(`Results:\n${sample.tests.map(t => 
                                                  `${t.name}: ${t.result} - ${t.status}`
                                                ).join('\n')}`);
                                              }}
                                              className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                                            >
                                              View Results
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Shelf Life */}
                          {study.shelfLife && (
                            <div className="bg-purple-50 border border-purple-300 p-3 rounded">
                              <p className="font-semibold mb-2">Shelf Life Determination</p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="font-semibold">Determined Shelf Life:</span> {study.shelfLife.determinedShelfLife} months
                                </div>
                                <div>
                                  <span className="font-semibold">Assigned Shelf Life:</span> {study.shelfLife.assignedShelfLife} months
                                </div>
                                <div>
                                  <span className="font-semibold">Determined By:</span> {study.shelfLife.determinedBy}
                                </div>
                                <div>
                                  <span className="font-semibold">Date:</span> {new Date(study.shelfLife.determinedDate).toLocaleDateString()}
                                </div>
                                <div className="col-span-2">
                                  <span className="font-semibold">Based On:</span> {study.shelfLife.basedOnData}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex space-x-2 pt-3 border-t">
                            {study.status === 'completed' && !study.shelfLife && (
                              <button
                                onClick={() => generateShelfLife(study.id)}
                                className="text-sm bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 flex items-center space-x-1"
                              >
                                <TrendingDown className="w-3 h-3" />
                                <span>Determine Shelf Life</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}