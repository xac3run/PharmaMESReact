import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Save, CheckCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';

export default function Formulas({ 
  addAuditEntry,
  language = 'en'
}) {
  console.log('Formulas component loaded!'); // добавьте эту строку
  const [formulas, setFormulas] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedFormula, setExpandedFormula] = useState(null);
  const [editingFormula, setEditingFormula] = useState(null);
  const [saving, setSaving] = useState(false);
  
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
        details: "Details",
        loading: "Loading...",
        error: "Error loading data",
        save: "Save",
        cancel: "Cancel"
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
        details: "Подробности",
        loading: "Загрузка...",
        error: "Ошибка загрузки данных",
        save: "Сохранить",
        cancel: "Отмена"
      }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  // Load data on component mount
  useEffect(() => {
    console.log('🔄 useEffect called!');
    loadData();
  }, []);

  const loadData = async () => {
     console.log('📡 loadData started!');
    console.log('API URL:', 'http://77.233.212.181:3001/api');
    try {
      setLoading(true);
      setError(null);
      
      const [formulasData, materialsData] = await Promise.all([
        apiClient.getFormulas(),
        apiClient.getMaterials()
      ]);
      
      console.log('Loaded formulas:', formulasData); // добавьте эту строку
      console.log('Loaded materials:', materialsData); // добавьте эту строку

      setFormulas(formulasData);
      setMaterials(materialsData);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createNewFormula = async () => {
    try {
      setSaving(true);
      
      const newFormulaData = {
        articleNumber: `FORM-${String(formulas.length + 1).padStart(3, '0')}`,
        productName: "New Product",
        weightPerUnit: 0,
        productType: "dosing",
        status: "draft",
        version: "0.1",
        bom: []
      };

      const createdFormula = await apiClient.createFormula(newFormulaData);
      setFormulas(prev => [createdFormula, ...prev]);
      setEditingFormula(createdFormula.id);
      
      if (addAuditEntry) {
        addAuditEntry("Formula Created", `New formula ${createdFormula.articleNumber} created`);
      }
    } catch (err) {
      setError(`Failed to create formula: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateFormulaStatus = async (id, status) => {
    try {
      const updatedFormula = await apiClient.updateFormulaStatus(id, status);
      setFormulas(prev => prev.map(f => 
        f.id === id ? updatedFormula : f
      ));
      
      if (addAuditEntry) {
        addAuditEntry("Formula Status Changed", `Formula ${updatedFormula.articleNumber} status changed to ${status}`);
      }
    } catch (err) {
      setError(`Failed to update status: ${err.message}`);
    }
  };

  const saveFormula = async (formulaId, formulaData) => {
    try {
      setSaving(true);
      const updatedFormula = await apiClient.updateFormula(formulaId, formulaData);
      setFormulas(prev => prev.map(f => 
        f.id === formulaId ? updatedFormula : f
      ));
      setEditingFormula(null);
      
      if (addAuditEntry) {
        addAuditEntry("Formula Updated", `Formula ${updatedFormula.articleNumber} updated`);
      }
    } catch (err) {
      setError(`Failed to save formula: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteFormula = async (id) => {
    if (!window.confirm('Are you sure you want to delete this formula?')) {
      return;
    }

    try {
      await apiClient.deleteFormula(id);
      setFormulas(prev => prev.filter(f => f.id !== id));
      
      if (addAuditEntry) {
        addAuditEntry("Formula Deleted", `Formula deleted`);
      }
    } catch (err) {
      setError(`Failed to delete formula: ${err.message}`);
    }
  };

  // Handle editing formula data
  const updateEditingFormula = (field, value) => {
    setFormulas(prev => prev.map(f => 
      f.id === editingFormula 
        ? { ...f, [field]: value }
        : f
    ));
  };

  const updateEditingBom = (bomIndex, field, value) => {
    setFormulas(prev => prev.map(f => 
      f.id === editingFormula 
        ? {
            ...f,
            bom: f.bom.map((item, index) => 
              index === bomIndex ? { ...item, [field]: value } : item
            )
          }
        : f
    ));
  };

  const addBomItem = () => {
    setFormulas(prev => prev.map(f => 
      f.id === editingFormula 
        ? {
            ...f,
            bom: [...f.bom, {
              id: `temp-${Date.now()}`,
              materialArticle: "",
              quantity: 0,
              unit: "mg",
              minQuantity: 0,
              maxQuantity: 0,
              materialType: "raw_material"
            }]
          }
        : f
    ));
  };

  const removeBomItem = (bomIndex) => {
    setFormulas(prev => prev.map(f => 
      f.id === editingFormula 
        ? {
            ...f,
            bom: f.bom.filter((_, index) => index !== bomIndex)
          }
        : f
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <span className="ml-2 text-gray-600">{t('loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{t('error')}: {error}</p>
        <button 
          onClick={loadData}
          className="mt-2 btn-primary text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('formulaManagement')}</h2>
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={createNewFormula}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
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
                  <td className="py-2 px-2 text-xs">{formula.bom?.length || 0} items</td>
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
                        onClick={() => {
                          if (editingFormula === formula.id) {
                            // Save formula
                            saveFormula(formula.id, formula);
                          } else {
                            // Start editing
                            setEditingFormula(formula.id);
                          }
                        }}
                        className="p-1 hover:bg-blue-100 rounded text-blue-600"
                        title={editingFormula === formula.id ? "Save" : "Edit"}
                        disabled={saving}
                      >
                        {saving && editingFormula === formula.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : editingFormula === formula.id ? (
                          <Save className="w-3 h-3" />
                        ) : (
                          <Edit3 className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => setExpandedFormula(expandedFormula === formula.id ? null : formula.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Details"
                      >
                        {expandedFormula === formula.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => deleteFormula(formula.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
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
                                onChange={(e) => updateEditingFormula('articleNumber', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1">Product Name</label>
                              <input
                                className="border rounded px-2 py-1 w-full text-xs"
                                value={formula.productName}
                                onChange={(e) => updateEditingFormula('productName', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1">Weight/Unit (mg)</label>
                              <input
                                type="number"
                                className="border rounded px-2 py-1 w-full text-xs"
                                value={formula.weightPerUnit}
                                onChange={(e) => updateEditingFormula('weightPerUnit', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1">Type</label>
                              <select
                                className="border rounded px-2 py-1 w-full text-xs"
                                value={formula.productType}
                                onChange={(e) => updateEditingFormula('productType', e.target.value)}
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
                                onClick={addBomItem}
                                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                              >
                                + Add
                              </button>
                            </div>
                            
                            <div className="space-y-1">
                              {(formula.bom || []).map((bomItem, bomIndex) => (
                                <div key={bomItem.id || bomIndex} className="border rounded p-2 bg-white/40">
                                  <div className="grid grid-cols-7 gap-2 items-end">
                                    <div className="col-span-2">
                                      <label className="block text-xs mb-1">Material</label>
                                      <select
                                        className="border rounded px-2 py-1 w-full text-xs"
                                        value={bomItem.materialArticle}
                                        onChange={(e) => updateEditingBom(bomIndex, 'materialArticle', e.target.value)}
                                      >
                                        <option value="">Select</option>
                                        {materials.map(m => (
                                          <option key={m.id} value={m.articleNumber}>
                                            {m.articleNumber} - {m.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs mb-1">Type</label>
                                      <select
                                        className="border rounded px-2 py-1 w-full text-xs"
                                        value={bomItem.materialType || "raw_material"}
                                        onChange={(e) => updateEditingBom(bomIndex, 'materialType', e.target.value)}
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
                                        onChange={(e) => updateEditingBom(bomIndex, 'quantity', parseFloat(e.target.value) || 0)}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs mb-1">Min</label>
                                      <input
                                        type="number"
                                        className="border rounded px-2 py-1 w-full text-xs"
                                        value={bomItem.minQuantity || 0}
                                        onChange={(e) => updateEditingBom(bomIndex, 'minQuantity', parseFloat(e.target.value) || 0)}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs mb-1">Max</label>
                                      <input
                                        type="number"
                                        className="border rounded px-2 py-1 w-full text-xs"
                                        value={bomItem.maxQuantity || 0}
                                        onChange={(e) => updateEditingBom(bomIndex, 'maxQuantity', parseFloat(e.target.value) || 0)}
                                      />
                                    </div>
                                    <button
                                      onClick={() => removeBomItem(bomIndex)}
                                      className="text-red-600 hover:bg-red-100 p-1 rounded"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => saveFormula(formula.id, formula)}
                              className="btn-primary text-xs px-3 py-1"
                              disabled={saving}
                            >
                              {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                              {t('save')}
                            </button>
                            <button
                              onClick={() => {
                                setEditingFormula(null);
                                loadData(); // Reload to cancel changes
                              }}
                              className="text-xs px-3 py-1 border rounded hover:bg-gray-50"
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs space-y-2">
                          <div className="grid grid-cols-4 gap-2">
                            <div><span className="font-semibold">Version:</span> {formula.version}</div>
                            <div><span className="font-semibold">Weight:</span> {formula.weightPerUnit}mg</div>
                            <div><span className="font-semibold">Type:</span> {formula.productType}</div>
                            <div><span className="font-semibold">BOM Items:</span> {formula.bom?.length || 0}</div>
                          </div>
                          {formula.bom && formula.bom.length > 0 && (
                            <div>
                              <span className="font-semibold">Materials:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {formula.bom.map((b, index) => (
                                  <span key={b.id || index} className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                    {b.materialArticle}: {b.quantity}{b.unit}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
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