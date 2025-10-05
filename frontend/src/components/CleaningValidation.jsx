import React, { useState } from 'react';
import { Plus, Droplet, ChevronDown, ChevronUp } from 'lucide-react';

export default function CleaningValidation({ 
  cleaningRecords,
  setCleaningRecords,
  equipment,
  formulas,
  currentUser,
  addAuditEntry,
  showESignature,
  language = 'en'
}) {
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [showNewRecord, setShowNewRecord] = useState(false);

  const createCleaningRecord = (formData) => {
    showESignature(
      'Start Cleaning',
      `Equipment: ${equipment.find(e => e.id === parseInt(formData.get('equipmentId')))?.name}`,
      (signature) => {
        const newRecord = {
          id: `CLN-${Date.now()}`,
          equipmentId: parseInt(formData.get('equipmentId')),
          equipmentName: equipment.find(e => e.id === parseInt(formData.get('equipmentId')))?.name,
          previousProduct: formData.get('previousProduct'),
          cleaningProcedure: formData.get('procedure'),
          cleaningAgent: formData.get('agent'),
          startedBy: signature.signedBy,
          startTime: signature.timestamp,
          startSignature: signature,
          endTime: null,
          endSignature: null,
          swabResults: [],
          rinseResults: [],
          visualInspection: null,
          status: 'in_progress',
          approved: false,
          approvalSignature: null,
          holdTime: null,
          nextAllowedProduct: formData.get('nextProduct') || 'Any'
        };

        setCleaningRecords(prev => [...prev, newRecord]);
        addAuditEntry("Cleaning Started", `${newRecord.id} for ${newRecord.equipmentName}`);
        setShowNewRecord(false);
      }
    );
  };

  const completeCleaningRecord = (recordId) => {
    showESignature(
      'Complete Cleaning',
      `Complete cleaning record ${recordId}`,
      (signature) => {
        setCleaningRecords(prev => prev.map(r => {
          if (r.id === recordId) {
            return {
              ...r,
              endTime: signature.timestamp,
              endSignature: signature,
              status: 'completed'
            };
          }
          return r;
        }));
        addAuditEntry("Cleaning Completed", `${recordId} completed by ${signature.signedBy}`);
      }
    );
  };

  const addSwabResult = (recordId) => {
    const location = prompt("Swab location:");
    const result = prompt("Result (ppm or pass/fail):");
    const limit = prompt("Acceptance limit:");
    
    if (location && result) {
      setCleaningRecords(prev => prev.map(r => {
        if (r.id === recordId) {
          return {
            ...r,
            swabResults: [...r.swabResults, {
              location,
              result,
              limit,
              pass: true, // In production: compare result vs limit
              timestamp: new Date().toISOString(),
              analyst: currentUser.name
            }]
          };
        }
        return r;
      }));
      addAuditEntry("Swab Result Added", `${recordId} - ${location}: ${result}`);
    }
  };

  const approveCleaningRecord = (recordId) => {
    showESignature(
      'Approve Cleaning',
      `Approve cleaning record ${recordId}`,
      (signature) => {
        setCleaningRecords(prev => prev.map(r => {
          if (r.id === recordId) {
            return {
              ...r,
              approved: true,
              approvalSignature: signature,
              status: 'approved'
            };
          }
          return r;
        }));
        addAuditEntry("Cleaning Approved", `${recordId} approved by ${signature.signedBy}`);
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Cleaning Validation</h2>
        <button 
          onClick={() => setShowNewRecord(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Cleaning Record</span>
        </button>
      </div>

      {showNewRecord && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Start Cleaning Process</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            createCleaningRecord(new FormData(e.target));
          }}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Equipment</label>
                <select name="equipmentId" className="border rounded px-3 py-2 w-full" required>
                  <option value="">Select Equipment</option>
                  {equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Previous Product</label>
                <input
                  name="previousProduct"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Last product manufactured"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Cleaning Procedure</label>
                <input
                  name="procedure"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="SOP number"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Cleaning Agent</label>
                <input
                  name="agent"
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="e.g., WFI, IPA 70%"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Next Allowed Product</label>
                <input
                  name="nextProduct"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Any or specific product"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">Start Cleaning</button>
              <button 
                type="button" 
                onClick={() => setShowNewRecord(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card">
        <table className="w-full text-sm">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs">Record ID</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Equipment</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Previous Product</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Status</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Started</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Details</th>
            </tr>
          </thead>
          <tbody>
            {cleaningRecords.map((record, idx) => (
              <React.Fragment key={record.id}>
                <tr className={`border-b hover:bg-white/40 ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                  <td className="py-2 px-2 font-mono text-xs">{record.id}</td>
                  <td className="py-2 px-2 text-xs">{record.equipmentName}</td>
                  <td className="py-2 px-2 text-xs">{record.previousProduct}</td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      record.status === 'approved' ? 'bg-green-100 text-green-800' :
                      record.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-xs">{new Date(record.startTime).toLocaleString()}</td>
                  <td className="py-2 px-2">
                    <button
                      onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {expandedRecord === record.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </td>
                </tr>

                {expandedRecord === record.id && (
                  <tr>
                    <td colSpan="6" className="py-4 px-4 bg-white/60">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-semibold mb-1">Cleaning Details:</p>
                            <p>Procedure: {record.cleaningProcedure}</p>
                            <p>Agent: {record.cleaningAgent}</p>
                            <p>Next Product: {record.nextAllowedProduct}</p>
                          </div>
                          <div>
                            <p className="font-semibold mb-1">Signatures:</p>
                            <p className="text-xs">Started: {record.startedBy} - {new Date(record.startTime).toLocaleString()}</p>
                            {record.endTime && (
                              <p className="text-xs">Completed: {record.endSignature.signedBy} - {new Date(record.endTime).toLocaleString()}</p>
                            )}
                            {record.approved && (
                              <p className="text-xs text-green-700">Approved: {record.approvalSignature.signedBy}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-semibold text-sm">Swab Test Results:</p>
                            {record.status === 'completed' && (
                              <button
                                onClick={() => addSwabResult(record.id)}
                                className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                              >
                                + Add Result
                              </button>
                            )}
                          </div>
                          {record.swabResults.length > 0 ? (
                            <table className="w-full text-xs">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="text-left py-1 px-2">Location</th>
                                  <th className="text-left py-1 px-2">Result</th>
                                  <th className="text-left py-1 px-2">Limit</th>
                                  <th className="text-left py-1 px-2">Pass/Fail</th>
                                  <th className="text-left py-1 px-2">Analyst</th>
                                </tr>
                              </thead>
                              <tbody>
                                {record.swabResults.map((result, idx) => (
                                  <tr key={idx} className="border-b">
                                    <td className="py-1 px-2">{result.location}</td>
                                    <td className="py-1 px-2">{result.result}</td>
                                    <td className="py-1 px-2">{result.limit}</td>
                                    <td className="py-1 px-2">
                                      <span className={result.pass ? 'text-green-700' : 'text-red-700'}>
                                        {result.pass ? 'PASS' : 'FAIL'}
                                      </span>
                                    </td>
                                    <td className="py-1 px-2">{result.analyst}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-xs text-gray-500">No results yet</p>
                          )}
                        </div>

                        <div className="flex space-x-2 pt-2 border-t">
                          {record.status === 'in_progress' && (
                            <button
                              onClick={() => completeCleaningRecord(record.id)}
                              className="btn-primary text-sm"
                            >
                              Complete Cleaning
                            </button>
                          )}
                          {record.status === 'completed' && !record.approved && currentUser.role === 'QA' && (
                            <button
                              onClick={() => approveCleaningRecord(record.id)}
                              className="btn-primary text-sm"
                            >
                              Approve Cleaning
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
