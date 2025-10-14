import React, { useState } from 'react';
import { Plus, FileText, TrendingUp, AlertTriangle, CheckCircle, Download, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

export default function AnnualProductReview({
  aprs,
  setAprs,
  formulas,
  batches,
  deviations,
  complaints,
  capas,
  changes,
  stabilityStudies,
  currentUser,
  addAuditEntry,
  showESignature,
  language = 'en'
}) {
  const [expandedAPR, setExpandedAPR] = useState(null);
  const [showNewAPR, setShowNewAPR] = useState(false);

  const createAPR = (formData) => {
    const productId = parseInt(formData.get('productId'));
    const year = parseInt(formData.get('year'));
    const product = formulas.find(f => f.id === productId);

    // Собираем данные за год
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    const productBatches = batches.filter(b => {
      if (b.formulaId !== productId) return false;
      const batchDate = new Date(b.startedAt || b.createdDate);
      return batchDate >= yearStart && batchDate <= yearEnd;
    });

    const productDeviations = deviations.filter(d => {
      const devDate = new Date(d.createdDate);
      return productBatches.some(pb => pb.id === d.batchId) && devDate >= yearStart && devDate <= yearEnd;
    });

    const productComplaints = complaints.filter(c => {
      const complaintDate = new Date(c.receivedDate);
      return c.productId === productId && complaintDate >= yearStart && complaintDate <= yearEnd;
    });

    const productChanges = changes.filter(ch => {
      const changeDate = new Date(ch.initiatedDate);
      return ch.affectedItems.includes(product.articleNumber) && changeDate >= yearStart && changeDate <= yearEnd;
    });

    const productCAPAs = capas.filter(ca => {
      const capaDate = new Date(ca.initiatedDate);
      return productBatches.some(pb => ca.relatedBatches?.includes(pb.id)) && capaDate >= yearStart && capaDate <= yearEnd;
    });

    // Расчет статистики
    const totalBatches = productBatches.length;
    const completedBatches = productBatches.filter(b => b.status === 'completed' || b.status === 'released').length;
    const rejectedBatches = productBatches.filter(b => b.status === 'rejected').length;
    const avgYield = productBatches
      .filter(b => b.yieldReconciliation)
      .reduce((sum, b) => sum + b.yieldReconciliation.yieldPercentage, 0) / 
      (productBatches.filter(b => b.yieldReconciliation).length || 1);

    const newAPR = {
      id: `APR-${Date.now()}`,
      productId,
      productName: product.productName,
      articleNumber: product.articleNumber,
      year,
      initiator: currentUser.name,
      initiatedDate: new Date().toISOString(),
      status: 'in_progress',
      reviewData: {
        batches: {
          total: totalBatches,
          completed: completedBatches,
          rejected: rejectedBatches,
          averageYield: avgYield.toFixed(2),
          batchList: productBatches.map(b => b.id)
        },
        deviations: {
          total: productDeviations.length,
          critical: productDeviations.filter(d => d.severity === 'critical').length,
          major: productDeviations.filter(d => d.severity === 'major').length,
          minor: productDeviations.filter(d => d.severity === 'minor').length,
          deviationList: productDeviations.map(d => ({ id: d.id, title: d.title }))
        },
        complaints: {
          total: productComplaints.length,
          open: productComplaints.filter(c => c.status !== 'closed').length,
          complaintList: productComplaints.map(c => ({ id: c.id, description: c.description }))
        },
        capas: {
          total: productCAPAs.length,
          open: productCAPAs.filter(c => c.status !== 'closed').length,
          capaList: productCAPAs.map(c => ({ id: c.id, title: c.title }))
        },
        changes: {
          total: productChanges.length,
          changeList: productChanges.map(ch => ({ id: ch.id, title: ch.title }))
        },
        stability: {
          activeStudies: stabilityStudies.filter(s => 
            productBatches.some(pb => pb.id === s.batchId) && s.status === 'active'
          ).length
        },
        oosResults: productBatches
          .filter(b => b.qcResults?.some(qc => !qc.pass))
          .map(b => ({ batchId: b.id, failures: b.qcResults.filter(qc => !qc.pass) }))
      },
      recommendations: [],
      conclusions: null,
      revalidationRequired: false,
      approvers: []
    };

    setAprs(prev => [...prev, newAPR]);
    addAuditEntry("Annual Product Review Created", `${newAPR.id} for ${product.productName} (${year})`);
    setShowNewAPR(false);
  };

  const addRecommendation = (aprId, recommendation) => {
    setAprs(prev => prev.map(apr => {
      if (apr.id === aprId) {
        return {
          ...apr,
          recommendations: [...apr.recommendations, {
            id: Date.now(),
            text: recommendation,
            addedBy: currentUser.name,
            addedDate: new Date().toISOString()
          }]
        };
      }
      return apr;
    }));
  };

  const finalizeAPR = (aprId, conclusions, revalidationRequired) => {
    showESignature(
      'Finalize Annual Product Review',
      `Approve APR ${aprId}`,
      (signature) => {
        setAprs(prev => prev.map(apr => {
          if (apr.id === aprId) {
            return {
              ...apr,
              status: 'completed',
              conclusions: {
                text: conclusions,
                revalidationRequired,
                approvedBy: signature.signedBy,
                approvedDate: signature.timestamp,
                signature: signature
              },
              completedDate: new Date().toISOString()
            };
          }
          return apr;
        }));
        addAuditEntry("APR Completed", `${aprId} finalized by ${signature.signedBy}`);
      }
    );
  };

  const exportAPRReport = (apr) => {
    let content = `ANNUAL PRODUCT REVIEW - ${apr.id}\n\n`;
    content += `Product: ${apr.productName} (${apr.articleNumber})\n`;
    content += `Review Year: ${apr.year}\n`;
    content += `Initiated By: ${apr.initiator}\n`;
    content += `Date: ${new Date(apr.initiatedDate).toLocaleDateString()}\n\n`;

    content += `--- PRODUCTION SUMMARY ---\n`;
    content += `Total Batches Manufactured: ${apr.reviewData.batches.total}\n`;
    content += `Completed: ${apr.reviewData.batches.completed}\n`;
    content += `Rejected: ${apr.reviewData.batches.rejected}\n`;
    content += `Average Yield: ${apr.reviewData.batches.averageYield}%\n\n`;

    content += `--- DEVIATIONS ---\n`;
    content += `Total Deviations: ${apr.reviewData.deviations.total}\n`;
    content += `  Critical: ${apr.reviewData.deviations.critical}\n`;
    content += `  Major: ${apr.reviewData.deviations.major}\n`;
    content += `  Minor: ${apr.reviewData.deviations.minor}\n`;
    if (apr.reviewData.deviations.deviationList.length > 0) {
      content += `\nDeviation List:\n`;
      apr.reviewData.deviations.deviationList.forEach(d => {
        content += `  - ${d.id}: ${d.title}\n`;
      });
    }

    content += `\n--- CUSTOMER COMPLAINTS ---\n`;
    content += `Total Complaints: ${apr.reviewData.complaints.total}\n`;
    content += `Open Complaints: ${apr.reviewData.complaints.open}\n`;

    content += `\n--- CAPA ACTIONS ---\n`;
    content += `Total CAPAs: ${apr.reviewData.capas.total}\n`;
    content += `Open CAPAs: ${apr.reviewData.capas.open}\n`;

    content += `\n--- CHANGE CONTROLS ---\n`;
    content += `Total Changes: ${apr.reviewData.changes.total}\n`;

    content += `\n--- OUT-OF-SPECIFICATION RESULTS ---\n`;
    content += `Batches with OOS: ${apr.reviewData.oosResults.length}\n`;
    apr.reviewData.oosResults.forEach(oos => {
      content += `  Batch ${oos.batchId}: ${oos.failures.length} test(s) failed\n`;
    });

    content += `\n--- STABILITY STUDIES ---\n`;
    content += `Active Studies: ${apr.reviewData.stability.activeStudies}\n`;

    if (apr.recommendations.length > 0) {
      content += `\n--- RECOMMENDATIONS ---\n`;
      apr.recommendations.forEach((rec, idx) => {
        content += `${idx + 1}. ${rec.text}\n`;
        content += `   Added by ${rec.addedBy} on ${new Date(rec.addedDate).toLocaleDateString()}\n`;
      });
    }

    if (apr.conclusions) {
      content += `\n--- CONCLUSIONS ---\n`;
      content += `${apr.conclusions.text}\n\n`;
      content += `Revalidation Required: ${apr.conclusions.revalidationRequired ? 'YES' : 'NO'}\n`;
      content += `Approved By: ${apr.conclusions.approvedBy}\n`;
      content += `Date: ${new Date(apr.conclusions.approvedDate).toLocaleDateString()}\n`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `APR_${apr.productName.replace(/\s/g, '_')}_${apr.year}.txt`;
    a.click();
    addAuditEntry("APR Report Exported", `Report for ${apr.id} exported`);
  };

  const stats = {
    total: aprs.length,
    inProgress: aprs.filter(a => a.status === 'in_progress').length,
    completed: aprs.filter(a => a.status === 'completed').length,
    revalidationNeeded: aprs.filter(a => a.conclusions?.revalidationRequired).length
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <BarChart3 className="w-6 h-6 mr-2" />
          Annual Product Review (APR)
        </h2>
        <button 
          onClick={() => setShowNewAPR(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New APR</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-blue-700">{stats.total}</div>
          <div className="text-sm text-gray-600">Total APRs</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats.inProgress}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-red-600">{stats.revalidationNeeded}</div>
          <div className="text-sm text-gray-600">Revalidation Needed</div>
        </div>
      </div>

      {showNewAPR && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Create Annual Product Review</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            createAPR(new FormData(e.target));
          }}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Product</label>
                <select name="productId" className="border rounded px-3 py-2 w-full" required>
                  <option value="">Select Product</option>
                  {formulas.map(formula => (
                    <option key={formula.id} value={formula.id}>
                      {formula.articleNumber} - {formula.productName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Review Year</label>
                <select name="year" className="border rounded px-3 py-2 w-full" required>
                  <option value="">Select Year</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>
              <div className="col-span-2 bg-blue-50 p-3 rounded text-xs">
                <p className="font-semibold mb-1">FDA Requirement - 21 CFR 211.180(e)</p>
                <p className="text-gray-700">
                  Annual review of all batches to determine if process changes, revalidation, 
                  or improvements are needed. Includes review of complaints, returns, deviations, 
                  CAPAs, and stability data.
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">Create APR</button>
              <button 
                type="button" 
                onClick={() => setShowNewAPR(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* APRs List */}
      <div className="glass-card">
        <table className="w-full text-sm">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs">APR ID</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Product</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Year</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Batches</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Issues</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Status</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Details</th>
            </tr>
          </thead>
          <tbody>
            {aprs.map((apr, idx) => (
              <React.Fragment key={apr.id}>
                <tr className={`border-b hover:bg-white/40 ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                  <td className="py-2 px-2 font-mono text-xs">{apr.id}</td>
                  <td className="py-2 px-2 text-xs">{apr.productName}</td>
                  <td className="py-2 px-2 text-xs">{apr.year}</td>
                  <td className="py-2 px-2 text-xs">{apr.reviewData.batches.total}</td>
                  <td className="py-2 px-2">
                    <div className="flex space-x-1 text-xs">
                      <span className="px-1 bg-red-100 text-red-800 rounded">{apr.reviewData.deviations.total}D</span>
                      <span className="px-1 bg-orange-100 text-orange-800 rounded">{apr.reviewData.complaints.total}C</span>
                      <span className="px-1 bg-blue-100 text-blue-800 rounded">{apr.reviewData.capas.total}CA</span>
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      apr.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {apr.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <button
                      onClick={() => setExpandedAPR(expandedAPR === apr.id ? null : apr.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {expandedAPR === apr.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </td>
                </tr>

                {expandedAPR === apr.id && (
                  <tr>
                    <td colSpan="7" className="py-4 px-4 bg-white/60">
                      <div className="space-y-4">
                        {/* Production Summary */}
                        <div className="bg-blue-50 p-3 rounded">
                          <p className="text-sm font-semibold mb-2">Production Summary</p>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div>Total Batches: {apr.reviewData.batches.total}</div>
                            <div>Completed: {apr.reviewData.batches.completed}</div>
                            <div>Rejected: {apr.reviewData.batches.rejected}</div>
                            <div>Avg Yield: {apr.reviewData.batches.averageYield}%</div>
                          </div>
                        </div>

                        {/* Quality Metrics */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-red-50 p-3 rounded">
                            <p className="text-sm font-semibold mb-2">Deviations ({apr.reviewData.deviations.total})</p>
                            <div className="text-xs space-y-1">
                              <div>Critical: {apr.reviewData.deviations.critical}</div>
                              <div>Major: {apr.reviewData.deviations.major}</div>
                              <div>Minor: {apr.reviewData.deviations.minor}</div>
                            </div>
                          </div>

                          <div className="bg-orange-50 p-3 rounded">
                            <p className="text-sm font-semibold mb-2">Complaints ({apr.reviewData.complaints.total})</p>
                            <div className="text-xs">
                              <div>Open: {apr.reviewData.complaints.open}</div>
                              <div>Closed: {apr.reviewData.complaints.total - apr.reviewData.complaints.open}</div>
                            </div>
                          </div>

                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm font-semibold mb-2">CAPAs ({apr.reviewData.capas.total})</p>
                            <div className="text-xs">
                              <div>Open: {apr.reviewData.capas.open}</div>
                              <div>Closed: {apr.reviewData.capas.total - apr.reviewData.capas.open}</div>
                            </div>
                          </div>

                          <div className="bg-purple-50 p-3 rounded">
                            <p className="text-sm font-semibold mb-2">Changes ({apr.reviewData.changes.total})</p>
                            <div className="text-xs">
                              <div>Total Change Controls: {apr.reviewData.changes.total}</div>
                            </div>
                          </div>
                        </div>

                        {/* OOS Results */}
                        {apr.reviewData.oosResults.length > 0 && (
                          <div className="bg-yellow-50 border border-yellow-300 p-3 rounded">
                            <p className="text-sm font-semibold mb-2 flex items-center">
                              <AlertTriangle className="w-4 h-4 mr-1 text-yellow-700" />
                              Out-of-Specification Results
                            </p>
                            <div className="text-xs space-y-1">
                              {apr.reviewData.oosResults.map((oos, idx) => (
                                <div key={idx}>
                                  Batch {oos.batchId}: {oos.failures.length} test(s) failed
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-semibold">Recommendations</p>
                            {apr.status === 'in_progress' && (
                              <button
                                onClick={() => {
                                  const rec = prompt("Enter recommendation:");
                                  if (rec) addRecommendation(apr.id, rec);
                                }}
                                className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                              >
                                + Add Recommendation
                              </button>
                            )}
                          </div>
                          {apr.recommendations.length > 0 ? (
                            <div className="space-y-1">
                              {apr.recommendations.map((rec, idx) => (
                                <div key={rec.id} className="bg-white p-2 rounded text-xs">
                                  <p className="font-semibold">{idx + 1}. {rec.text}</p>
                                  <p className="text-gray-600">Added by {rec.addedBy} on {new Date(rec.addedDate).toLocaleDateString()}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">No recommendations yet</p>
                          )}
                        </div>

                        {/* Conclusions */}
                        {apr.conclusions ? (
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-sm font-semibold mb-2">Conclusions</p>
                            <p className="text-xs mb-2">{apr.conclusions.text}</p>
                            <div className="text-xs text-gray-600">
                              <p>Revalidation Required: <span className={`font-semibold ${apr.conclusions.revalidationRequired ? 'text-red-600' : 'text-green-600'}`}>
                                {apr.conclusions.revalidationRequired ? 'YES' : 'NO'}
                              </span></p>
                              <p>Approved by {apr.conclusions.approvedBy} on {new Date(apr.conclusions.approvedDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ) : apr.status === 'in_progress' ? (
                          <button
                            onClick={() => {
                              const conclusions = prompt("Enter APR conclusions:");
                              const revalidation = confirm("Is revalidation required?");
                              if (conclusions) {
                                finalizeAPR(apr.id, conclusions, revalidation);
                              }
                            }}
                            className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                          >
                            Finalize APR
                          </button>
                        ) : null}

                        {/* Actions */}
                        <div className="flex space-x-2 pt-3 border-t">
                          <button
                            onClick={() => exportAPRReport(apr)}
                            className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center space-x-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>Export Report</span>
                          </button>
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