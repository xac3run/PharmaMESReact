import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Save, CheckCircle, ChevronDown, ChevronUp, Loader2, Lock } from 'lucide-react';
import { apiClient } from '../api/client';

export default function Formulas({ 
  addAuditEntry,
  language = 'en',
  showESignature,
  currentUser
}) {
  console.log('Formulas component loaded with showESignature:', !!showESignature);
  
  const [formulas, setFormulas] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedFormula, setExpandedFormula] = useState(null);
  const [editingFormula, setEditingFormula] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(null);
  const [originalFormulas, setOriginalFormulas] = useState({}); // Для отслеживания оригинальных данных
  
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
        cancel: "Cancel",
        requiresSignature: "Changes require electronic signature",
        signAndSave: "Sign & Save Changes"
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
        cancel: "Отмена",
        requiresSignature: "Изменения требуют электронной подписи",
        signAndSave: "Подписать и сохранить"
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
    try {
      setLoading(true);
      setError(null);
      
      const [formulasData, materialsData] = await Promise.all([
        apiClient.getFormulas(),
        apiClient.getMaterials()
      ]);
      
      console.log('Loaded formulas:', formulasData);
      console.log('Loaded materials:', materialsData);

      setFormulas(formulasData);
      setMaterials(materialsData);
      
      // Сохраняем оригинальные данные для сравнения
      const originalData = {};
      formulasData.forEach(formula => {
        originalData[formula.id] = JSON.parse(JSON.stringify(formula));
      });
      setOriginalFormulas(originalData);
      
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
        version: "1.0",
        bom: []
      };

      const createdFormula = await apiClient.createFormula(newFormulaData);
      
      // Обновляем состояние
      setFormulas(prev => [createdFormula, ...prev]);
      setOriginalFormulas(prev => ({
        ...prev,
        [createdFormula.id]: JSON.parse(JSON.stringify(createdFormula))
      }));
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
    // For critical status changes, require e-signature
    if (status === "approved" && showESignature) {
      const formula = formulas.find(f => f.id === id);
      console.log('🔐 Requesting e-signature for status change...');
      
      showESignature(
        "Formula Status Change",
        `Change formula ${formula.articleNumber} status to ${status}`,
        (signature) => {
          console.log('✅ Status change signature received:', signature);
          performStatusUpdate(id, status, signature);
        }
      );
    } else {
      performStatusUpdate(id, status);
    }
  };

  const performStatusUpdate = async (id, status, signature = null) => {
    try {
      // Вызываем API для обновления статуса
      const updatedFormula = await apiClient.updateFormulaStatus(id, status);
      
      // Обновляем локальное состояние
      setFormulas(prev => prev.map(f => 
        f.id === id ? updatedFormula : f
      ));
      
      if (addAuditEntry) {
        const formula = formulas.find(f => f.id === id);
        const auditDetails = signature 
          ? `Formula ${formula.articleNumber} status changed to ${status} (E-Signed by ${signature.user})`
          : `Formula ${formula.articleNumber} status changed to ${status}`;
        addAuditEntry("Formula Status Changed", auditDetails);
      }
    } catch (err) {
      setError(`Failed to update status: ${err.message}`);
    }
  };

  // Check if changes require electronic signature
  const checkIfChangesRequireSignature = (original, modified) => {
    if (!original || !modified) {
      console.log('❌ Missing original or modified formula');
      return false;
    }
    
    console.log('🔍 Checking signature requirements:', {
      originalProduct: original.productName,
      modifiedProduct: modified.productName,
      originalType: original.productType,
      modifiedType: modified.productType,
      originalWeight: original.weightPerUnit,
      modifiedWeight: modified.weightPerUnit,
      originalStatus: original.status,
      modifiedStatus: modified.status
    });
    
    // Check critical field changes
    if (original.productName !== modified.productName) {
      console.log('✅ Product name changed - signature required');
      return true;
    }
    
    if (original.productType !== modified.productType) {
      console.log('✅ Product type changed - signature required');
      return true;
    }
    
    if (Number(original.weightPerUnit) !== Number(modified.weightPerUnit)) {
      console.log('✅ Weight changed - signature required');
      return true;
    }
    
    if (original.status === "approved" || modified.status === "approved") {
      console.log('✅ Status involves approved - signature required');
      return true;
    }
    
    // Check BOM changes
    const originalBOM = original.bom || [];
    const modifiedBOM = modified.bom || [];
    
    if (originalBOM.length !== modifiedBOM.length) {
      console.log('✅ BOM length changed - signature required');
      return true;
    }
    
    for (let i = 0; i < originalBOM.length; i++) {
      const origItem = originalBOM[i];
      const modItem = modifiedBOM[i];
      
      if (origItem.materialArticle !== modItem.materialArticle ||
          Number(origItem.quantity) !== Number(modItem.quantity) ||
          origItem.materialType !== modItem.materialType) {
        console.log('✅ BOM content changed - signature required');
        return true;
      }
    }
    
    console.log('❌ No critical changes found');
    return false;
  };

  // Function to create next version number
  const getNextVersion = (currentVersion) => {
    const parts = currentVersion.split('.');
    const majorVersion = parseInt(parts[0]) || 1;
    const minorVersion = parseInt(parts[1]) || 0;
    return `${majorVersion}.${minorVersion + 1}`;
  };

  const saveFormula = async (formulaId, formulaData) => {
    console.log('🔘 Save button clicked for formula:', formulaId);
    console.log('🔘 showESignature function available:', !!showESignature);
    
    // Get the original formula from initial state (before any edits)
    const originalFormula = originalFormulas[formulaId];
    
    const requiresSignature = checkIfChangesRequireSignature(originalFormula, formulaData);
    
    console.log('🔍 Signature check result:', {
      requiresSignature,
      showESignatureAvailable: !!showESignature,
      originalData: originalFormula?.productName,
      modifiedData: formulaData?.productName
    });
    
    if (requiresSignature && showESignature) {
      console.log('🔐 Showing e-signature modal...');
      
      showESignature(
        "Formula Modification",
        `Modify formula ${formulaData.articleNumber} - Critical changes detected. This will create version ${getNextVersion(formulaData.version)}`,
        (signature) => {
          console.log('✅ Signature received:', signature);
          performFormulaSave(formulaId, formulaData, signature);
        }
      );
      return;
    } else {
      console.log('❌ No signature required or showESignature missing:', {
        requiresSignature,
        hasShowESignature: !!showESignature
      });
      performFormulaSave(formulaId, formulaData);
    }
  };

  const performFormulaSave = async (formulaId, formulaData, signature = null) => {
    try {
      setSaving(true);
      
      // Determine if we need to increment version
      const originalFormula = originalFormulas[formulaId];
      const requiresVersioning = checkIfChangesRequireSignature(originalFormula, formulaData);
      
      let updateData = { ...formulaData };
      
      // If signature is required, increment version
      if (requiresVersioning && signature) {
        updateData.version = getNextVersion(formulaData.version);
        console.log('📝 Creating new version:', updateData.version);
      }
      
      // Call API to update formula
      const updatedFormula = await apiClient.updateFormula(formulaId, updateData);
      
      // Update local state
      setFormulas(prev => prev.map(f => 
        f.id === formulaId ? updatedFormula : f
      ));
      
      // Update original formulas cache
      setOriginalFormulas(prev => ({
        ...prev,
        [formulaId]: JSON.parse(JSON.stringify(updatedFormula))
      }));
      
      setEditingFormula(null);
      
      if (addAuditEntry) {
        const auditDetails = signature 
          ? `Formula ${updateData.articleNumber} updated to v${updateData.version} (E-Signed by ${signature.user})`
          : `Formula ${updateData.articleNumber} updated`;
        addAuditEntry("Formula Updated", auditDetails);
      }
    } catch (err) {
      setError(`Failed to save formula: ${err.message}`);
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteFormula = async (id) => {
    const formula = formulas.find(f => f.id === id);
    
    // Require e-signature for deletion of approved formulas
    if (formula.status === "approved" && showESignature) {
      console.log('🔐 Requesting e-signature for deletion...');
      
      showESignature(
        "Formula Deletion",
        `Delete approved formula ${formula.articleNumber}`,
        (signature) => {
          console.log('✅ Deletion signature received:', signature);
          performFormulaDeletion(id, signature);
        }
      );
    } else {
      if (!window.confirm('Are you sure you want to delete this formula?')) {
        return;
      }
      performFormulaDeletion(id);
    }
  };

  const performFormulaDeletion = async (id, signature = null) => {
    try {
      // Call API to delete formula
      await apiClient.deleteFormula(id);
      
      // Update local state
      setFormulas(prev => prev.filter(f => f.id !== id));
      
      // Remove from original formulas cache
      setOriginalFormulas(prev => {
        const newOriginals = { ...prev };
        delete newOriginals[id];
        return newOriginals;
      });
      
      if (addAuditEntry) {
        const auditDetails = signature 
          ? `Formula deleted (E-Signed by ${signature.user})`
          : `Formula deleted`;
        addAuditEntry("Formula Deleted", auditDetails);
      }
    } catch (err) {
      setError(`Failed to delete formula: ${err.message}`);
      console.error('Delete error:', err);
    }
  };

  // Test e-signature function
  const testESignature = () => {
    console.log('🧪 Testing e-signature modal...');
    console.log('🧪 showESignature prop:', showESignature);
    console.log('🧪 typeof showESignature:', typeof showESignature);
    
    if (showESignature && typeof showESignature === 'function') {
      console.log('🧪 Calling showESignature...');
      showESignature(
        "Test E-Signature",
        "This is a test of the electronic signature system",
        (signature) => {
          console.log('✅ Test signature received:', signature);
          alert(`Test signature successful! Signed by: ${signature.user}`);
        }
      );
    } else {
      console.error('❌ showESignature function not available or not a function');
      alert(`E-signature function not available. Type: ${typeof showESignature}`);
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
        <div className="flex space-x-2">
          {/* Test E-Signature Button */}
          <button 
            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm flex items-center space-x-1"
            onClick={testESignature}
          >
            <Lock className="w-4 h-4" />
            <span>Test E-Signature</span>
          </button>
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
            {formulas.map((formula, idx) => {
              // For signature requirements, compare against original state
              const originalFormula = formulas.find(f => f.id === formula.id && editingFormula !== formula.id) || formula;
              const requiresSignature = editingFormula === formula.id && 
                checkIfChangesRequireSignature(originalFormula, formula);
              
              return (
                <React.Fragment key={formula.id}>
                  <tr className={`border-b hover:bg-white/40 transition-colors ${idx % 2 === 0 ? 'bg-white/20' : ''}`}>
                    <td className="py-2 px-2 font-mono text-xs">{formula.articleNumber}</td>
                    <td className="py-2 px-2 text-xs">{formula.productName}</td>
                    <td className="py-2 px-2 text-xs">{formula.weightPerUnit}mg</td>
                    <td className="py-2 px-2 text-xs">{formula.productType}</td>
                    <td className="py-2 px-2 text-xs">{formula.bom?.length || 0} items</td>
                    <td className="py-2 px-2">
                      <div className="flex items-center space-x-1">
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
                        {formula.status === "approved" && (
                          <Lock className="w-3 h-3 text-green-600" title="Approved - Changes require e-signature" />
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            console.log('🔘 Edit/Save button clicked for formula:', formula.id);
                            console.log('🔘 Current editing mode:', editingFormula === formula.id);
                            
                            if (editingFormula === formula.id) {
                              console.log('🔘 Calling saveFormula with data:', formula);
                              saveFormula(formula.id, formula);
                            } else {
                              console.log('🔘 Starting edit mode');
                              setEditingFormula(formula.id);
                            }
                          }}
                          className={`p-1 rounded text-xs flex items-center space-x-1 ${
                            requiresSignature 
                              ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                              : 'hover:bg-blue-100 text-blue-600'
                          }`}
                          title={editingFormula === formula.id ? (requiresSignature ? "Requires E-Signature" : "Save") : "Edit"}
                          disabled={saving}
                        >
                          {saving && editingFormula === formula.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : editingFormula === formula.id ? (
                            <>
                              {requiresSignature && <Lock className="w-3 h-3" />}
                              <Save className="w-3 h-3" />
                            </>
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
                            {/* Show warning if changes require signature */}
                            {requiresSignature && (
                              <div className="bg-orange-50 border border-orange-200 rounded p-2 flex items-center space-x-2">
                                <Lock className="w-4 h-4 text-orange-600" />
                                <span className="text-xs text-orange-800">{t('requiresSignature')}</span>
                              </div>
                            )}
                            
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
                                className={`text-xs px-3 py-1 flex items-center space-x-1 ${
                                  requiresSignature 
                                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                                    : 'btn-primary'
                                }`}
                                disabled={saving}
                              >
                                {saving && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                                {requiresSignature && <Lock className="w-3 h-3" />}
                                <span>{requiresSignature ? t('signAndSave') : t('save')}</span>
                              </button>
                              <button
                                onClick={() => {
                                  // Отменяем изменения и возвращаем оригинальные данные
                                  const originalData = originalFormulas[formula.id];
                                  if (originalData) {
                                    setFormulas(prev => prev.map(f => 
                                      f.id === formula.id ? { ...originalData } : f
                                    ));
                                  }
                                  setEditingFormula(null);
                                  setPendingChanges(null);
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}