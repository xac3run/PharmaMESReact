import React, { useState } from 'react';
import { Plus, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function Materials({ 
  materials, 
  setMaterials,
  addNewMaterial,
  updateMaterialStatus,
  language = 'en'
}) {
  const [expandedMaterial, setExpandedMaterial] = useState(null);
  
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
        expired: "Material expired!"
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
        expired: "Материал просрочен!"
      }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
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