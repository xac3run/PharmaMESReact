import React from 'react';
import { Plus, Trash2, Edit3, Save } from 'lucide-react';

export default function Formulas({ 
  formulas, 
  setFormulas, 
  materials,
  editingFormula,
  setEditingFormula
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Formula Management</h2>
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
          }}
        >
          <Plus className="w-4 h-4" />
          <span>New Formula</span>
        </button>
      </div>
      
      {formulas.map(formula => (
        <div key={formula.id} className="glass-card">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              {editingFormula === formula.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Article Number</label>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={formula.articleNumber}
                        onChange={(e) => setFormulas(prev => prev.map(f => 
                          f.id === formula.id ? {...f, articleNumber: e.target.value} : f
                        ))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Product Name</label>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={formula.productName}
                        onChange={(e) => setFormulas(prev => prev.map(f => 
                          f.id === formula.id ? {...f, productName: e.target.value} : f
                        ))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Weight per Unit (mg)</label>
                      <input
                        type="number"
                        className="border rounded px-3 py-2 w-full"
                        value={formula.weightPerUnit}
                        onChange={(e) => setFormulas(prev => prev.map(f => 
                          f.id === formula.id ? {...f, weightPerUnit: parseFloat(e.target.value)} : f
                        ))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Product Type</label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={formula.productType}
                        onChange={(e) => setFormulas(prev => prev.map(f => 
                          f.id === formula.id ? {...f, productType: e.target.value} : f
                        ))}
                      >
                        <option value="dosing">Dosing</option>
                        <option value="packaging">Packaging</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-semibold">Bill of Materials (BOM)</label>
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
                                    unit: "mg"
                                  }]
                                }
                              : f
                          ));
                        }}
                        className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        + Add Material
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formula.bom.map(bomItem => (
                        <div key={bomItem.id} className="flex space-x-2 items-center">
                          <select
                            className="border rounded px-3 py-2 flex-1"
                            value={bomItem.materialArticle}
                            onChange={(e) => setFormulas(prev => prev.map(f => 
                              f.id === formula.id 
                                ? {
                                    ...f,
                                    bom: f.bom.map(b => 
                                      b.id === bomItem.id ? {...b, materialArticle: e.target.value} : b
                                    )
                                  }
                                : f
                            ))}
                          >
                            <option value="">Select Material</option>
                            {materials.map(m => (
                              <option key={m.id} value={m.articleNumber}>
                                {m.articleNumber} - {m.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            className="border rounded px-3 py-2 w-24"
                            placeholder="Qty"
                            value={bomItem.quantity}
                            onChange={(e) => setFormulas(prev => prev.map(f => 
                              f.id === formula.id 
                                ? {
                                    ...f,
                                    bom: f.bom.map(b => 
                                      b.id === bomItem.id ? {...b, quantity: parseFloat(e.target.value)} : b
                                    )
                                  }
                                : f
                            ))}
                          />
                          <select
                            className="border rounded px-3 py-2 w-20"
                            value={bomItem.unit}
                            onChange={(e) => setFormulas(prev => prev.map(f => 
                              f.id === formula.id 
                                ? {
                                    ...f,
                                    bom: f.bom.map(b => 
                                      b.id === bomItem.id ? {...b, unit: e.target.value} : b
                                    )
                                  }
                                : f
                            ))}
                          >
                            <option value="mg">mg</option>
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                          </select>
                          <button
                            onClick={() => setFormulas(prev => prev.map(f => 
                              f.id === formula.id 
                                ? {...f, bom: f.bom.filter(b => b.id !== bomItem.id)}
                                : f
                            ))}
                            className="text-red-600 hover:bg-red-100 p-2 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-bold">{formula.productName}</h3>
                  <p className="text-sm text-gray-600">
                    Article: {formula.articleNumber} | Version: {formula.version} | 
                    Type: {formula.productType} | Weight: {formula.weightPerUnit}mg
                  </p>
                  <div className="mt-2">
                    <p className="text-xs font-semibold mb-1">Bill of Materials:</p>
                    {formula.bom.map(b => (
                      <span key={b.id} className="inline-block text-xs bg-gray-100 px-2 py-1 rounded mr-1 mb-1">
                        {b.materialArticle}: {b.quantity}{b.unit}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className={`px-3 py-1 rounded text-sm font-semibold ${
                formula.status === "approved" ? "bg-green-100 text-green-800" :
                formula.status === "review" ? "bg-yellow-100 text-yellow-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {formula.status}
              </div>
              <button
                onClick={() => setEditingFormula(editingFormula === formula.id ? null : formula.id)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded"
              >
                {editingFormula === formula.id ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}