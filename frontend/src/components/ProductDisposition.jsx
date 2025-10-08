import React, { useState } from 'react';
import { Package, CheckCircle, XCircle, AlertTriangle, Clock, FileText } from 'lucide-react';

export default function ProductDisposition({
  batches,
  setBatches,
  materials,
  setMaterials,
  deviations,
  currentUser,
  addAuditEntry,
  showESignature,
  language = 'en'
}) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedItem, setExpandedItem] = useState(null);

  const t = (key) => {
    const translations = {
      en: {
        productDisposition: "Product Disposition",
        awaitingDisposition: "Awaiting Disposition",
        released: "Released",
        rejected: "Rejected",
        quarantine: "Quarantine",
        investigate: "Investigate",
        batch: "Batch",
        material: "Material",
        status: "Status",
        actions: "Actions"
      },
      ru: {
        productDisposition: "Решение о продукте",
        awaitingDisposition: "Ожидает решения",
        released: "Выпущен",
        rejected: "Отклонен",
        quarantine: "Карантин",
        investigate: "Расследование",
        batch: "Партия",
        material: "Материал",
        status: "Статус",
        actions: "Действия"
      }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  // Get items needing disposition
  const getItemsForDisposition = () => {
    const items = [];
    
    // Completed batches without disposition
    batches.forEach(batch => {
      if (batch.status === 'completed' && !batch.disposition) {
        const relatedDeviations = deviations.filter(d => d.relatedBatch === batch.id);
        items.push({
          id: batch.id,
          type: 'batch',
          name: batch.id,
          product: batch.productName,
          status: 'awaiting_disposition',
          hasDeviations: relatedDeviations.length > 0,
          deviations: relatedDeviations,
          qcResults: batch.qcResults || [],
          completedAt: batch.completedAt,
          data: batch
        });
      }
    });

    // Materials in quarantine
    materials.forEach(material => {
      if (material.status === 'quarantine' && !material.disposition) {
        items.push({
          id: material.id,
          type: 'material',
          name: material.lotNumber,
          product: material.name,
          status: 'quarantine',
          hasDeviations: false,
          qcResults: material.quarantineTests || [],
          receivedAt: material.receivedDate,
          data: material
        });
      }
    });

    return items;
  };

  const makeDisposition = (itemId, itemType, decision, reason) => {
    showESignature(
      'Product Disposition Decision',
      `${decision.toUpperCase()} - ${itemType} ${itemId}`,
      (signature) => {
        const disposition = {
          decision,
          reason,
          decidedBy: signature.user,
          decidedAt: signature.timestamp,
          signature
        };

        if (itemType === 'batch') {
          setBatches(prev => prev.map(b => 
            b.id === itemId ? { 
              ...b, 
              disposition,
              status: decision === 'release' ? 'released' : 
                     decision === 'reject' ? 'rejected' : 
                     decision === 'quarantine' ? 'quarantine' : 'investigating'
            } : b
          ));
        } else {
          setMaterials(prev => prev.map(m => 
            m.id === itemId ? { 
              ...m, 
              disposition,
              status: decision === 'release' ? 'validated' : 
                     decision === 'reject' ? 'rejected' : 
                     decision === 'quarantine' ? 'quarantine' : 'investigating'
            } : m
          ));
        }

        addAuditEntry(
          "Product Disposition",
          `${itemType} ${itemId} - ${decision.toUpperCase()}: ${reason}`,
          itemType === 'batch' ? itemId : null
        );
      }
    );
  };

  const handleDispositionAction = (item, decision) => {
    const reasons = {
      release: 'All quality criteria met, approved for release',
      reject: 'Does not meet quality specifications',
      quarantine: 'Requires additional testing or investigation',
      investigate: 'Investigation required before final decision'
    };

    const reason = prompt(`Enter reason for ${decision}:`, reasons[decision]);
    if (!reason) return;

    makeDisposition(item.id, item.type, decision, reason);
  };

  const items = getItemsForDisposition();
  const filteredItems = items.filter(item => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  const stats = {
    total: items.length,
    awaiting: items.filter(i => i.status === 'awaiting_disposition').length,
    quarantine: items.filter(i => i.status === 'quarantine').length,
    withDeviations: items.filter(i => i.hasDeviations).length
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <Package className="w-6 h-6 mr-2" />
          {t('productDisposition')}
        </h2>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-blue-700">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Items</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats.awaiting}</div>
          <div className="text-sm text-gray-600">{t('awaitingDisposition')}</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.quarantine}</div>
          <div className="text-sm text-gray-600">{t('quarantine')}</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-red-600">{stats.withDeviations}</div>
          <div className="text-sm text-gray-600">With Deviations</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card">
        <div className="flex items-center space-x-4 mb-4">
          <label className="text-sm font-semibold">{t('status')}:</label>
          <select 
            className="border rounded px-3 py-1 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Items</option>
            <option value="awaiting_disposition">{t('awaitingDisposition')}</option>
            <option value="quarantine">{t('quarantine')}</option>
          </select>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs">Type</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">ID</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Product</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">{t('status')}</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Issues</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">Date</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  No items requiring disposition
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => (
                <React.Fragment key={`${item.type}-${item.id}`}>
                  <tr className={`border-b hover:bg-white/40 ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.type === 'batch' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-mono text-xs">{item.name}</td>
                    <td className="py-2 px-2 text-xs">{item.product}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.status === 'awaiting_disposition' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center space-x-1">
                        {item.hasDeviations && (
                          <span className="px-1 py-0.5 bg-red-100 text-red-800 rounded text-xs">
                            {item.deviations.length} DEV
                          </span>
                        )}
                        {item.qcResults.some(qc => !qc.pass) && (
                          <span className="px-1 py-0.5 bg-orange-100 text-orange-800 rounded text-xs">
                            QC FAIL
                          </span>
                        )}
                        {!item.hasDeviations && item.qcResults.every(qc => qc.pass) && (
                          <span className="px-1 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                            OK
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-xs">
                      {new Date(item.completedAt || item.receivedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleDispositionAction(item, 'release')}
                          className="p-1 hover:bg-green-100 rounded text-green-600"
                          title="Release"
                        >
                          <CheckCircle className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDispositionAction(item, 'quarantine')}
                          className="p-1 hover:bg-yellow-100 rounded text-yellow-600"
                          title="Quarantine"
                        >
                          <Clock className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDispositionAction(item, 'investigate')}
                          className="p-1 hover:bg-blue-100 rounded text-blue-600"
                          title="Investigate"
                        >
                          <AlertTriangle className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDispositionAction(item, 'reject')}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          title="Reject"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}