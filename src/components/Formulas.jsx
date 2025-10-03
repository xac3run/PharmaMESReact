import React from 'react';
import { Plus, Trash2, Edit3, Save, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function Formulas({ 
  formulas, 
  setFormulas, 
  materials,
  editingFormula,
  setEditingFormula,
  addAuditEntry,
  language = 'en'
}) {
  const [expandedFormula, setExpandedFormula] = React.useState(null);
  
  const t = (key) => {
    const translations = {
      en: {
        formulaManagement: "Formula Management",
        newFormula: "New Formula",
        article: "Article",
        product: "Product",
        weight: "Weight",
        type: "Type",
        status: "Status",
        bom: "BOM",
        actions: "Actions",
        details: "Details"
      },
      ru: {
        formulaManagement: "Управление формулами",
        newFormula: "Новая формула",
        article: "Артикул",
        product: "Продукт",
        weight: "Вес",
        type: "Тип",
        status: "Статус",
        bom: "Состав",
        actions: "Действия",
        details: "Подробности"
      }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
  };
  
  const updateFormulaStatus = (id, status) => {
    setFormulas(prev => prev.map(f => 
      f.id === id ? {...f, status} : f
    ));
    const formula = formulas.find(f => f.id === id);
    addAuditEntry("Formula Status Changed", `${formula.articleNumber} status changed to ${status}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('formulaManagement')}</h2>
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={() => {
            const newFormula = {
              id: Date.now(),
              articleNumber: `ART-${String(formulas.length + 1).padStart(3, '0')}`,
              productName: "New Product",
              weightPerUnit: 0,
              productType: "dosing",
              status: "draft",
              version: "0.1",
              bom: []
            };
            setFormulas(prev => [...prev, newFormula]);
            setEditingFormula(newFormula.id);
            addAuditEntry("Formula Created", `New formula ${newFormula.articleNumber} created`);
          }}
        >
          <Plus className="w-4 h-4" />
          <span>{t('newFormula')}</span>
        </button>
      </div>
      
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/40">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs">{t('article')}</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">{t('product')}</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">{t('weight')}</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">{t('type')}</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">{t('bom')}</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">{t('status')}</th>
              <th className="text-left py-2 px-2 font-semibold text-xs">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {formulas.map((formula, idx) => (
              <React.Fragment key={formula.id}>
                <tr className={`border-b hover:bg-white/40 transition-colors ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                  <td className="py-2 px-2 font-mono text-xs">{formula.articleNumber}</td>
                  <td className="py-2 px-2 text-xs">{formula.productName}</td>
                  <td className="py-2 px-2 text-xs">{formula.weightPerUnit}mg</td>
                  <td className="py-2 px-2 text-xs">{formula.productType}</td>
                  <td className="py-2 px-2 text-xs">{formula.bom.length} items</td>
                  <td className="py-2 px-2">
                    <select
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        formula.status === "approved" ? "bg-green-100 text-green-800" :
                        formula.status === "review" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}
                      value={formula.status}
                      onChange={(e) => updateFormulaStatus(formula.id, e.target.value)}
                    >
                      <option value="draft">Draft</option>
                      <option value="review">Review</option>
                      <option value="approved">Approved</option>
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setEditingFormula(editingFormula === formula.id ? null : formula.id)}
                        className="p-1 hover:bg-blue-100 rounded text-blue-600"
                        title="Edit"
                      >
                        {editingFormula === formula.id ? <Save className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => setExpandedFormula(expandedFormula === formula.id ? null : formula.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Details"
                      >
                        {expandedFormula === formula.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>
                </tr>
                
                {(expandedFormula === formula.id || editingFormula === formula.id) && (
                  <tr>
                    <td colSpan="7" className="py-3 px-3 bg-white/60">
                      {editingFormula === formula.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <label className="block text-xs font-semibold mb-1">Article Number</label>
                              <input
                                className="border rounded px-2 py-1 w-full text-xs"
                                value={formula.articleNumber}
                                onChange={(e) => {
                                  setFormulas(prev => prev.map(f => 
                                    f.id === formula.id ? {...f, articleNumber: e.target.value} : f
                                  ));
                                  addAuditEntry("Formula Modified", `Article number changed to ${e.target.value}`);
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1">Product Name</label>
                              <input
                                className="border rounded px-2 py-1 w-full text-xs"
                                value={formula.productName}
                                onChange={(e) => {
                                  setFormulas(prev => prev.map(f => 
                                    f.id === formula.id ? {...f, productName: e.target.value} : f
                                  ));
                                  addAuditEntry("Formula Modified", `Product name changed to ${e.target.value}`);
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1">Weight/Unit (mg)</label>
                              <input
                                type="number"
                                className="border rounded px-2 py-1 w-full text-xs"
                                value={formula.weightPerUnit}
                                onChange={(e) => {
                                  setFormulas(prev => prev.map(f => 
                                    f.id === formula.id ? {...f, weightPerUnit: parseFloat(e.target.value)} : f
                                  ));
                                  addAuditEntry("Formula Modified", `Weight changed to ${e.target.value}mg`);
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1">Type</label>
                              <select
                                className="border rounded px-2 py-1 w-full text-xs"
                                value={formula.productType}
                                onChange={(e) => {
                                  setFormulas(prev => prev.map(f => 
                                    f.id === formula.id ? {...f, productType: e.target.value} : f
                                  ));
                                  addAuditEntry("Formula Modified", `Type changed to ${e.target.value}`);
                                }}
                              >
                                <option value="dosing">Dosing</option>
                                <option value="packaging">Packaging</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="font-semibold text-xs">Bill of Materials</label>
                              <button
                                onClick={() => {
                                  setFormulas(prev => prev.map(f => 
                                    f.id === formula.id 
                                      ? {
                                          ...f, 
                                          bom: [...f.bom, {
                                            id: Date.now(),
                                            materialArticle: "",
                                            quantity: 0,
                                            unit: "mg",
                                            min: 0,
                                            max: 0,
                                            type: "raw_material"
                                          }]
                                        }
                                      : f
                                  ));
                                  addAuditEntry("Formula Modified", `BOM item added`);
                                }}
                                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                              >
                                + Add
                              </button>
                            </div>
                            
                            <div className="space-y-1">
                              {formula.bom.map(bomItem => (
                                <div key={bomItem.id} className="border rounded p-2 bg-white/40">
                                  <div className="grid grid-cols-7 gap-2 items-end">
                                    <div className="col-span-2">
                                      <label className="block text-xs mb-1">Material</label>
                                      <select
                                        className="border rounded px-2 py-1 w-full text-xs"
                                        value={bomItem.materialArticle}
                                        onChange={(e) => {
                                          setFormulas(prev => prev.map(f => 
                                            f.id === formula.id 
                                              ? {
                                                  ...f,
                                                  bom: f.bom.map(b => 
                                                    b.id === bomItem.id ? {...b, materialArticle: e.target.value} : b
                                                  )
                                                }
                                              : f
                                          ));
                                        }}
                                      >
                                        <option value="">Select</option>
                                        {materials.map(m => (
                                          <option key={m.id} value={m.articleNumber}>
                                            {m.articleNumber}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs mb-1">Type</label>
                                      <select
                                        className="border rounded px-2 py-1 w-full text-xs"
                                        value={bomItem.type || "raw_material"}
                                        onChange={(e) => {
                                          setFormulas(prev => prev.map(f => 
                                            f.id === formula.id 
                                              ? {
                                                  ...f,
                                                  bom: f.bom.map(b => 
                                                    b.id === bomItem.id ? {...b, type: e.target.value} : b
                                                  )
                                                }
                                              : f
                                          ));
                                        }}
                                      >
                                        <option value="raw_material">Raw</option>
                                        <option value="intermediate">Inter</option>
                                        <option value="packaging">Pack</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs mb-1">Qty</label>
                                      <input
                                        type="number"
                                        className="border rounded px-2 py-1 w-full text-xs"
                                        value={bomItem.quantity}
                                        onChange={(e) => {
                                          setFormulas(prev => prev.map(f => 
                                            f.id === formula.id 
                                              ? {
                                                  ...f,
                                                  bom: f.bom.map(b => 
                                                    b.id === bomItem.id ? {...b, quantity: parseFloat(e.target.value)} : b
                                                  )
                                                }
                                              : f
                                          ));
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs mb-1">Min</label>
                                      <input
                                        type="number"
                                        className="border rounded px-2 py-1 w-full text-xs"
                                        value={bomItem.min || 0}
                                        onChange={(e) => {
                                          setFormulas(prev => prev.map(f => 
                                            f.id === formula.id 
                                              ? {
                                                  ...f,
                                                  bom: f.bom.map(b => 
                                                    b.id === bomItem.id ? {...b, min: parseFloat(e.target.value)} : b
                                                  )
                                                }
                                              : f
                                          ));
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs mb-1">Max</label>
                                      <input
                                        type="number"
                                        className="border rounded px-2 py-1 w-full text-xs"
                                        value={bomItem.max || 0}
                                        onChange={(e) => {
                                          setFormulas(prev => prev.map(f => 
                                            f.id === formula.id 
                                              ? {
                                                  ...f,
                                                  bom: f.bom.map(b => 
                                                    b.id === bomItem.id ? {...b, max: parseFloat(e.target.value)} : b
                                                  )
                                                }
                                              : f
                                          ));
                                        }}
                                      />
                                    </div>
                                    <button
                                      onClick={() => {
                                        setFormulas(prev => prev.map(f => 
                                          f.id === formula.id 
                                            ? {...f, bom: f.bom.filter(b => b.id !== bomItem.id)}
                                            : f
                                        ));
                                      }}
                                      className="text-red-600 hover:bg-red-100 p-1 rounded"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setEditingFormula(null)}
                            className="btn-primary text-xs px-3 py-1"
                          >
                            Save & Close
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs space-y-2">
                          <div className="grid grid-cols-4 gap-2">
                            <div><span className="font-semibold">Version:</span> {formula.version}</div>
                            <div><span className="font-semibold">Weight:</span> {formula.weightPerUnit}mg</div>
                            <div><span className="font-semibold">Type:</span> {formula.productType}</div>
                            <div><span className="font-semibold">BOM Items:</span> {formula.bom.length}</div>
                          </div>
                          <div>
                            <span className="font-semibold">Materials:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {formula.bom.map(b => (
                                <span key={b.id} className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                  {b.materialArticle}: {b.quantity}{b.unit}
                                </span>
                              ))}
                            </div>
                          </div>
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