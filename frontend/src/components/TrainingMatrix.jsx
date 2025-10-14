import React, { useState } from 'react';
import { GraduationCap, Users, BookOpen, CheckCircle, XCircle, Clock, AlertTriangle, Award } from 'lucide-react';

export default function TrainingMatrix({
  personnel,
  setPersonnel,
  trainingRecords,
  setTrainingRecords,
  currentUser,
  addAuditEntry,
  showESignature,
  language = 'en'
}) {
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showTrainingForm, setShowTrainingForm] = useState(false);

  // Training topics (demo version)
  const trainingTopics = [
    { id: 'GMP_BASIC', name: 'GMP Basic Training', category: 'Regulatory', retrainMonths: 12 },
    { id: 'GMP_ADV', name: 'GMP Advanced', category: 'Regulatory', retrainMonths: 24 },
    { id: 'CLEAN_ROOM', name: 'Cleanroom Behavior', category: 'Operational', retrainMonths: 12 },
    { id: 'WEIGHING', name: 'Weighing Operations', category: 'Technical', retrainMonths: 12 },
    { id: 'MIXING', name: 'Mixing Operations', category: 'Technical', retrainMonths: 12 },
    { id: 'QC_METHODS', name: 'QC Testing Methods', category: 'Technical', retrainMonths: 12 },
    { id: 'DATA_INTEGRITY', name: 'Data Integrity', category: 'Regulatory', retrainMonths: 12 },
    { id: 'ESIG', name: 'Electronic Signatures', category: 'System', retrainMonths: 24 },
    { id: 'DEVIATION', name: 'Deviation Handling', category: 'Quality', retrainMonths: 12 },
    { id: 'CAPA', name: 'CAPA System', category: 'Quality', retrainMonths: 24 }
  ];

  const getRequiredTrainings = (role) => {
    const requirements = {
      'Operator': ['GMP_BASIC', 'CLEAN_ROOM', 'WEIGHING', 'MIXING', 'DATA_INTEGRITY', 'ESIG', 'DEVIATION'],
      'QA': ['GMP_ADV', 'QC_METHODS', 'DATA_INTEGRITY', 'ESIG', 'DEVIATION', 'CAPA'],
      'Master': ['GMP_ADV', 'WEIGHING', 'MIXING', 'QC_METHODS', 'DATA_INTEGRITY', 'ESIG', 'DEVIATION', 'CAPA'],
      'Planner': ['GMP_BASIC', 'DATA_INTEGRITY', 'ESIG'],
      'Admin': ['GMP_ADV', 'DATA_INTEGRITY', 'ESIG', 'CAPA']
    };
    return requirements[role] || [];
  };

  const getPersonnelTrainingStatus = (person) => {
    const personRecords = trainingRecords.filter(tr => tr.personnelId === person.id);
    const requiredForRole = getRequiredTrainings(person.role);
    
    const trained = requiredForRole.filter(topicId => {
      const record = personRecords.find(r => r.topicId === topicId);
      if (!record) return false;
      
      const topic = trainingTopics.find(t => t.id === topicId);
      const monthsSinceTraining = (new Date() - new Date(record.completedDate)) / (1000 * 60 * 60 * 24 * 30);
      return monthsSinceTraining < topic.retrainMonths;
    }).length;

    const dueForRetrain = requiredForRole.filter(topicId => {
      const record = personRecords.find(r => r.topicId === topicId);
      if (!record) return false;
      
      const topic = trainingTopics.find(t => t.id === topicId);
      const monthsSinceTraining = (new Date() - new Date(record.completedDate)) / (1000 * 60 * 60 * 24 * 30);
      return monthsSinceTraining >= topic.retrainMonths;
    }).length;

    return {
      total: requiredForRole.length,
      trained,
      missing: requiredForRole.length - trained - dueForRetrain,
      dueForRetrain,
      percentage: Math.round((trained / requiredForRole.length) * 100)
    };
  };

  const recordTraining = (formData) => {
    const personnelId = parseInt(formData.get('personnelId'));
    const topicId = formData.get('topicId');
    const completedDate = formData.get('completedDate');
    const score = parseInt(formData.get('score'));
    const trainer = formData.get('trainer');

    showESignature(
      'Training Record',
      `Record training completion for topic ${topicId}`,
      (signature) => {
        const newRecord = {
          id: Date.now(),
          personnelId,
          topicId,
          topicName: trainingTopics.find(t => t.id === topicId)?.name,
          completedDate,
          score,
          trainer,
          status: score >= 80 ? 'passed' : 'failed',
          recordedBy: signature.signedBy,
          recordedDate: signature.timestamp,
          signature
        };

        setTrainingRecords(prev => [...prev, newRecord]);
        
        if (score >= 80) {
          setPersonnel(prev => prev.map(p => {
            if (p.id === personnelId) {
              const topic = trainingTopics.find(t => t.id === topicId);
              if (!p.certifications.includes(topic.name)) {
                return {
                  ...p,
                  certifications: [...p.certifications, topic.name]
                };
              }
            }
            return p;
          }));
        }

        addAuditEntry("Training Recorded", `${newRecord.topicName} for personnel ${personnelId} - ${newRecord.status}`);
        setShowTrainingForm(false);
      }
    );
  };

  const getTrainingRecord = (personnelId, topicId) => {
    const records = trainingRecords.filter(r => r.personnelId === personnelId && r.topicId === topicId);
    if (records.length === 0) return null;
    
    return records.sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate))[0];
  };

  const isTrainingExpired = (record, topicId) => {
    if (!record) return false;
    const topic = trainingTopics.find(t => t.id === topicId);
    const monthsSinceTraining = (new Date() - new Date(record.completedDate)) / (1000 * 60 * 60 * 24 * 30);
    return monthsSinceTraining >= topic.retrainMonths;
  };

  const stats = {
    totalPersonnel: personnel.length,
    fullyTrained: personnel.filter(p => getPersonnelTrainingStatus(p).percentage === 100).length,
    needsTraining: personnel.filter(p => getPersonnelTrainingStatus(p).missing > 0).length,
    needsRetrain: personnel.filter(p => getPersonnelTrainingStatus(p).dueForRetrain > 0).length
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <GraduationCap className="w-6 h-6 mr-2" />
          Training Matrix
        </h2>
        <button 
          onClick={() => setShowTrainingForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <BookOpen className="w-4 h-4" />
          <span>Record Training</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-blue-700">{stats.totalPersonnel}</div>
          <div className="text-sm text-gray-600">Total Personnel</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-green-600">{stats.fullyTrained}</div>
          <div className="text-sm text-gray-600">Fully Trained</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.needsTraining}</div>
          <div className="text-sm text-gray-600">Needs Training</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-red-600">{stats.needsRetrain}</div>
          <div className="text-sm text-gray-600">Due for Retraining</div>
        </div>
      </div>

      {/* Training Form Modal */}
      {showTrainingForm && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Record Training Completion</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            recordTraining(new FormData(e.target));
          }}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Personnel</label>
                <select name="personnelId" className="border rounded px-3 py-2 w-full" required>
                  <option value="">Select Person</option>
                  {personnel.map(person => (
                    <option key={person.id} value={person.id}>
                      {person.name} ({person.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Training Topic</label>
                <select name="topicId" className="border rounded px-3 py-2 w-full" required>
                  <option value="">Select Topic</option>
                  {trainingTopics.map(topic => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name} ({topic.category})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Completion Date</label>
                <input
                  name="completedDate"
                  type="date"
                  required
                  className="border rounded px-3 py-2 w-full"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Score (%)</label>
                <input
                  name="score"
                  type="number"
                  min="0"
                  max="100"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="80"
                />
                <p className="text-xs text-gray-500 mt-1">Passing score: 80%</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Trainer</label>
                <input
                  name="trainer"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Trainer name"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">Record Training</button>
              <button 
                type="button" 
                onClick={() => setShowTrainingForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Training Matrix Table */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold mb-4">Training Status by Personnel</h3>
        
        <div className="mb-4 space-y-2">
          {personnel.map(person => {
            const status = getPersonnelTrainingStatus(person);
            return (
              <div 
                key={person.id}
                className={`p-3 rounded-lg border cursor-pointer hover:bg-white/60 ${
                  selectedPerson === person.id ? 'bg-blue-50 border-blue-300' : 'bg-white/40 border-gray-200'
                }`}
                onClick={() => setSelectedPerson(selectedPerson === person.id ? null : person.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold">{person.name}</p>
                      <p className="text-xs text-gray-600">{person.role} - {person.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right text-xs">
                      <p className="font-semibold">
                        {status.trained}/{status.total} trained
                      </p>
                      {status.missing > 0 && (
                        <p className="text-orange-600">{status.missing} missing</p>
                      )}
                      {status.dueForRetrain > 0 && (
                        <p className="text-red-600">{status.dueForRetrain} expired</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            status.percentage === 100 ? 'bg-green-600' :
                            status.percentage >= 80 ? 'bg-blue-600' :
                            status.percentage >= 50 ? 'bg-yellow-600' :
                            'bg-red-600'
                          }`}
                          style={{width: `${status.percentage}%`}}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12">{status.percentage}%</span>
                    </div>
                  </div>
                </div>

                {selectedPerson === person.id && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-semibold mb-2">Required Training Topics:</p>
                    <div className="space-y-2">
                      {getRequiredTrainings(person.role).map(topicId => {
                        const topic = trainingTopics.find(t => t.id === topicId);
                        const record = getTrainingRecord(person.id, topicId);
                        const expired = isTrainingExpired(record, topicId);

                        return (
                          <div key={topicId} className="flex items-center justify-between bg-white/60 p-2 rounded text-xs">
                            <div className="flex items-center space-x-2">
                              {!record ? (
                                <XCircle className="w-4 h-4 text-red-600" />
                              ) : expired ? (
                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                              <div>
                                <p className="font-semibold">{topic.name}</p>
                                <p className="text-gray-600">
                                  {topic.category} | Retrain every {topic.retrainMonths} months
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {record ? (
                                <>
                                  <p className={`font-semibold ${
                                    expired ? 'text-orange-600' : 'text-green-600'
                                  }`}>
                                    {expired ? 'EXPIRED' : 'VALID'}
                                  </p>
                                  <p className="text-gray-600">
                                    {new Date(record.completedDate).toLocaleDateString()}
                                  </p>
                                  <p className="text-gray-600">
                                    Score: {record.score}%
                                  </p>
                                </>
                              ) : (
                                <p className="text-red-600 font-semibold">NOT TRAINED</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Training Topics Reference */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-semibold mb-2">Available Training Topics:</h4>
          <div className="grid grid-cols-2 gap-2">
            {trainingTopics.map(topic => (
              <div key={topic.id} className="bg-gray-50 p-2 rounded text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{topic.name}</p>
                    <p className="text-gray-600">{topic.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {topic.retrainMonths}mo
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Training Records History */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold mb-4">Recent Training Records</h3>
        <table className="w-full text-sm">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs">Date</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Personnel</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Topic</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Score</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Status</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Trainer</th>
            </tr>
          </thead>
          <tbody>
            {trainingRecords
              .sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate))
              .slice(0, 10)
              .map((record, idx) => {
                const person = personnel.find(p => p.id === record.personnelId);
                return (
                  <tr key={record.id} className={`border-b ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                    <td className="py-2 px-2 text-xs">
                      {new Date(record.completedDate).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-2 text-xs">{person?.name}</td>
                    <td className="py-2 px-2 text-xs">{record.topicName}</td>
                    <td className="py-2 px-2 text-xs">{record.score}%</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        record.status === 'passed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-xs">{record.trainer}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}