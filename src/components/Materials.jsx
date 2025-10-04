import React, { useState } from 'react';
import { Plus, AlertCircle, ChevronDown, ChevronUp, CheckCircle, XCircle, FlaskConical } from 'lucide-react';

export default function Materials({ 
  materials, 
  setMaterials,
  addNewMaterial,
  updateMaterialStatus,
  currentUser,
  addAuditEntry,
  showESignature,
  language = 'en'
}) {
  const [expandedMaterial, setExpandedMaterial] = useState(null);
  const [showQuarantinePanel, setShowQuarantinePanel] = useState(null);
  
  const t = (key) => {
    const translations = {
      en: {
        materialsManagement: "Materials Management",
        newMaterial: "New Material",
        articleNumber: "Article Number",
        name: "Name",
        status: "Status",
        stock: "Stock",
        location: "Location",
        details: "Details",
        supplier: "Supplier",
        received: "Received",
        expiry: "Expiry",
        lotNumber: "Lot Number",
        expired: "Material expired!",
        quarantineTests: "Quarantine Tests",
        addTest: "Add Test",
        approve: "Approve Material",
        reject: "Reject Material"
      },
      ru: {
        materialsManagement: "Управление материалами",
        newMaterial: "Новый материал",
        articleNumber: "Артикул",
        name: "Название",
        status: "Статус",
        stock: "Запас",
        location: "Местоположение",
        details: "Подробности",
        supplier: "Поставщик",
        received: "Получено",
        expiry: "Срок годности",
        lotNumber: "Номер партии",
        expired: "Материал просрочен!",
        quarantineTests: "Тесты карантина",
        addTest: "Добавить тест",
        approve: "Одобрить материал",
        reject: "Отклонить материал"
      }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  const addQuarantineTest = (materialId) => {
    const testName = prompt("Test name (e.g., Identity, Purity, Moisture):");
    if (!testName) return;

    setMaterials(prev => prev.map(m => {
      if (m.id === materialId) {
        const tests = m.quarantineTests || [];
        return {
          ...m,
          quarantineTests: [...tests, {
            test: testName,
            status: 'pending',
            result: null,
            performedBy: null,
            performedDate: null
          }]
        };
      }
      return m;
    }));
    addAuditEntry("Quarantine Test Added", `Test "${testName}" added to ${materials.find(m => m.id === materialId)?.articleNumber}`);
  };

  const updateTestResult = (materialId, testIndex) => {
    const material = materials.find(m => m.id === materialId);
    const test = material.quarantineTests[testIndex];
    
    const result = prompt(`Enter result for ${test.test} (PASS/FAIL or numeric value):`);
    if (!result) return;

    showESignature(
      'Quarantine Test Result',
      `${material.articleNumber} - ${test.test}: ${result}`,
      (signature) => {
        setMaterials(prev => prev.map(m => {
          if (m.id === materialId) {
            const tests = [...m.quarantineTests];
            tests[testIndex] = {
              ...tests[testIndex],
              status: 'completed',
              result: result,
              performedBy: signature.signedBy,
              performedDate: signature.timestamp,
              signature: signature
            };
            return { ...m, quarantineTests: tests };
          }
          return m;
        }));
        addAuditEntry("Quarantine Test Completed", `${material.articleNumber} - ${test.test}: ${result}`);
      }
    );
  };

  const approveMaterial = (materialId) => {
    const material = materials.find(m => m.id === materialId);
    
    // Check if all tests are completed
    const allTestsComplete = material.quarantineTests?.every(t => t.status === 'completed');
    if (!allTestsComplete) {
      alert("All quarantine tests must be completed before approval");
      return;
    }

    showESignature(
      'Material Approval',
      `Approve ${material.articleNumber} - ${material.name}`,
      (signature) => {
        setMaterials(prev => prev.map(m => {
          if (m.id === materialId) {
            return {
              ...m,
              status: 'validated',
              location: 'Warehouse A-1',
              approvedBy: signature.signedBy,
              approvedDate: signature.timestamp,
              approvalSignature: signature
            };
          }
          return m;
        }));
        addAuditEntry("Material Approved", `${material.articleNumber} approved by ${signature.signedBy}`);
        setShowQuarantinePanel(null);
      }
    );
  };

  const rejectMaterial = (materialId) => {
    const material = materials.find(m => m.id === materialId);
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    showESignature(
      'Material Rejection',
      `Reject ${material.articleNumber} - Reason: ${reason}`,
      (signature) => {
        setMaterials(prev => prev.map(m => {
          if (m.id === materialId) {
            return {
              ...m,
              status: 'rejected',
              rejectedBy: signature.signedBy,
              rejectedDate: signature.timestamp,
              rejectionReason: reason,
              rejectionSignature: signature
            };
          }
          return m;
        }));
        addAuditEntry("Material Rejected", `${material.articleNumber} rejected: ${reason}`);
        setShowQuarantinePanel(null);
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('materialsManagement')}</h2>
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={addNewMaterial}
        >
          <Plus className="w-4 h-4" />
          <span>{t('newMaterial')}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-teal-700">{materials.length}</div>
          <div className="text-sm text-gray-600">Total Materials</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-green-700">
            {materials.filter(m => m.status === 'validated').length}
          </div>
          <div className="text-sm text-gray-600">Validated</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-yellow-700">
            {materials.filter(m => m.status === 'quarantine').length}
          </div>
          <div className="text-sm text-gray-600">In Quarantine</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-red-700">
            {materials.filter(m => m.status === 'rejected').length}
          </div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
      </div>
      
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold">{t('articleNumber')}</th>
              <th className="text-left py-3 px-4 font-semibold">{t('name')}</th>
              <th className="text-left py-3 px-4 font-semibold">{t('status')}</th>
              <th className="text-left py-3 px-4 font-semibold">{t('stock')}</th>
              <th className="text-left py-3 px-4 font-semibold">{t('location')}</th>
              <th className="text-left py-3 px-4 font-semibold">{t('details')}</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m, idx) => (
              <React.Fragment key={m.id}>
                <tr className={`border-b hover:bg-white/40 transition-colors ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                  <td className="py-3 px-4 font-mono text-sm">{m.articleNumber}</td>
                  <td className="py-3 px-4">{m.name}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <select
                        className={`px-3 py-1 rounded text-xs font-semibold ${
                          m.status === "validated" ? "bg-green-100 text-green-800" :
                          m.status === "quarantine" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}
                        value={m.status}
                        onChange={(e) => updateMaterialStatus(m.id, e.target.value)}
                      >
                        <option value="quarantine">Quarantine</option>
                        <option value="validated">Validated</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      {m.status === 'quarantine' && (
                        <button
                          onClick={() => setShowQuarantinePanel(showQuarantinePanel === m.id ? null : m.id)}
                          className="p-1 hover:bg-yellow-200 rounded"
                          title="Quarantine Management"
                        >
                          <FlaskConical className="w-4 h-4 text-yellow-700" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold">{m.quantity} {m.unit}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{m.location}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setExpandedMaterial(expandedMaterial === m.id ? null : m.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {expandedMaterial === m.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>

                {/* Quarantine Panel */}
                {showQuarantinePanel === m.id && (
                  <tr>
                    <td colSpan="6" className="py-4 px-4 bg-yellow-50/80">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-yellow-900 flex items-center">
                            <FlaskConical className="w-4 h-4 mr-2" />
                            {t('quarantineTests')}
                          </h4>
                          <button
                            onClick={() => addQuarantineTest(m.id)}
                            className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                          >
                            {t('addTest')}
                          </button>
                        </div>

                        {m.quarantineTests && m.quarantineTests.length > 0 ? (
                          <div className="space-y-2">
                            {m.quarantineTests.map((test, tidx) => (
                              <div key={tidx} className="bg-white rounded-lg p-3 border border-yellow-300">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-semibold text-sm">{test.test}</span>
                                      {test.status === 'completed' ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                                      )}
                                    </div>
                                    {test.status === 'completed' && (
                                      <div className="text-xs text-gray-700 mt-1">
                                        <p><span className="font-semibold">Result:</span> {test.result}</p>
                                        <p><span className="font-semibold">By:</span> {test.performedBy} on {new Date(test.performedDate).toLocaleString()}</p>
                                      </div>
                                    )}
                                  </div>
                                  {test.status === 'pending' && (
                                    <button
                                      onClick={() => updateTestResult(m.id, tidx)}
                                      className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                    >
                                      Enter Result
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 text-center py-4">
                            No tests defined. Add tests to begin quarantine process.
                          </p>
                        )}

                        <div className="flex justify-end space-x-2 pt-3 border-t border-yellow-300">
                          <button
                            onClick={() => approveMaterial(m.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>{t('approve')}</span>
                          </button>
                          <button
                            onClick={() => rejectMaterial(m.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 flex items-center space-x-1"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>{t('reject')}</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Expanded Details */}
                {expandedMaterial === m.id && (
                  <tr>
                    <td colSpan="6" className="py-4 px-4 bg-white/60">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-gray-600">{t('lotNumber')}:</span>
                          <span className="ml-2">{m.lotNumber}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-600">{t('supplier')}:</span>
                          <span className="ml-2">{m.supplier}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-600">{t('received')}:</span>
                          <span className="ml-2">{m.receivedDate}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-600">{t('expiry')}:</span>
                          <span className={`ml-2 ${new Date(m.expiryDate) < new Date() ? 'text-red-600 font-bold' : ''}`}>
                            {m.expiryDate}
                          </span>
                        </div>
                        {m.coa && (
                          <div>
                            <span className="font-semibold text-gray-600">CoA:</span>
                            <span className="ml-2">{m.coa}</span>
                          </div>
                        )}
                        {m.approvedBy && (
                          <div className="col-span-2 mt-2 p-2 bg-green-50 rounded">
                            <p className="text-xs">
                              <span className="font-semibold">Approved by:</span> {m.approvedBy} on {new Date(m.approvedDate).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {m.rejectedBy && (
                          <div className="col-span-2 mt-2 p-2 bg-red-50 rounded">
                            <p className="text-xs">
                              <span className="font-semibold">Rejected by:</span> {m.rejectedBy} on {new Date(m.rejectedDate).toLocaleString()}
                            </p>
                            <p className="text-xs mt-1">
                              <span className="font-semibold">Reason:</span> {m.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                      {new Date(m.expiryDate) < new Date() && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-300 rounded">
                          <p className="text-xs text-red-800 font-semibold flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {t('expired')}
                          </p>
                        </div>
                      )}
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