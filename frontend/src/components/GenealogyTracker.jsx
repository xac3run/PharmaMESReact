import React, { useState } from 'react';
import { GitMerge, Search, ChevronRight, ChevronLeft, Package, Beaker } from 'lucide-react';

export default function GenealogyTracker({ 
  batches,
  materials,
  formulas,
  language = 'en'
}) {
  const [searchType, setSearchType] = useState('batch');
  const [searchId, setSearchId] = useState('');
  const [genealogyData, setGenealogyData] = useState(null);
  const [traceDirection, setTraceDirection] = useState('both'); // 'forward', 'backward', 'both'

  const performGenealogy = () => {
    if (!searchId) {
      alert('Please enter a Batch ID or Material Lot Number');
      return;
    }

    if (searchType === 'batch') {
      traceBatchGenealogy(searchId);
    } else {
      traceMaterialGenealogy(searchId);
    }
  };

  const traceBatchGenealogy = (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) {
      alert('Batch not found');
      return;
    }

    const formula = formulas.find(f => f.id === batch.formulaId);
    
    // Backward tracing - materials used
    const materialsUsed = batch.materialConsumption.map(mc => {
      const material = materials.find(m => m.articleNumber === mc.materialArticle);
      return {
        ...mc,
        materialDetails: material,
        traceLevel: 1
      };
    });

    // Forward tracing - where this batch was used (if it's an intermediate)
    const usedInBatches = batches.filter(b => 
      b.materialConsumption?.some(mc => mc.lotNumber === batchId)
    );

    setGenealogyData({
      type: 'batch',
      id: batchId,
      root: {
        id: batch.id,
        type: 'batch',
        productName: formula?.productName,
        quantity: batch.targetQuantity,
        status: batch.status,
        createdDate: batch.createdDate,
        startedBy: batch.startedBy
      },
      backward: {
        materials: materialsUsed,
        rawMaterialSuppliers: [...new Set(materialsUsed.map(m => m.materialDetails?.supplier).filter(Boolean))]
      },
      forward: {
        batches: usedInBatches.map(b => ({
          id: b.id,
          productName: formulas.find(f => f.id === b.formulaId)?.productName,
          status: b.status,
          createdDate: b.createdDate
        }))
      }
    });
  };

  const traceMaterialGenealogy = (lotNumber) => {
    const material = materials.find(m => m.lotNumber === lotNumber);
    if (!material) {
      alert('Material lot not found');
      return;
    }

    // Forward tracing - which batches used this material
    const usedInBatches = batches.filter(b => 
      b.materialConsumption?.some(mc => mc.lotNumber === lotNumber)
    );

    // Recursive forward trace through intermediate products
    const recursiveForwardTrace = (initialBatches, level = 1) => {
      if (level > 5) return []; // Prevent infinite recursion
      
      let nextLevel = [];
      initialBatches.forEach(batch => {
        const downstream = batches.filter(b => 
          b.materialConsumption?.some(mc => mc.lotNumber === batch.id)
        );
        nextLevel = [...nextLevel, ...downstream];
      });

      if (nextLevel.length === 0) return initialBatches;
      
      return [
        ...initialBatches,
        ...recursiveForwardTrace(nextLevel, level + 1)
      ];
    };

    const allAffectedBatches = recursiveForwardTrace(usedInBatches);

    setGenealogyData({
      type: 'material',
      id: lotNumber,
      root: {
        articleNumber: material.articleNumber,
        name: material.name,
        lotNumber: material.lotNumber,
        supplier: material.supplier,
        receivedDate: material.receivedDate,
        quantity: material.quantity,
        status: material.status
      },
      forward: {
        directBatches: usedInBatches.map(b => ({
          id: b.id,
          productName: formulas.find(f => f.id === b.formulaId)?.productName,
          quantityUsed: b.materialConsumption.find(mc => mc.lotNumber === lotNumber)?.quantity,
          status: b.status,
          createdDate: b.createdDate
        })),
        allAffectedBatches: allAffectedBatches.map(b => ({
          id: b.id,
          productName: formulas.find(f => f.id === b.formulaId)?.productName,
          status: b.status,
          createdDate: b.createdDate
        })),
        totalImpact: allAffectedBatches.length
      }
    });
  };

  const exportGenealogy = () => {
    if (!genealogyData) return;

    const content = JSON.stringify(genealogyData, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Genealogy_${genealogyData.id}_${new Date().toISOString()}.json`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <GitMerge className="w-6 h-6 mr-2" />
          Genealogy & Traceability
        </h2>
      </div>

      {/* Search Panel */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold mb-4">Trace Product Genealogy</h3>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Search Type</label>
            <select 
              className="border rounded px-3 py-2 w-full"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="batch">Batch ID</option>
              <option value="material">Material Lot</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-semibold mb-1">
              {searchType === 'batch' ? 'Batch ID' : 'Material Lot Number'}
            </label>
            <input
              className="border rounded px-3 py-2 w-full"
              placeholder={searchType === 'batch' ? 'e.g., B-2025-001' : 'e.g., LOT-2025-001'}
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={performGenealogy}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>Trace</span>
            </button>
          </div>
        </div>

        {genealogyData && (
          <div className="mt-4 flex items-center space-x-3 text-sm">
            <label className="font-semibold">Trace Direction:</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setTraceDirection('backward')}
                className={`px-3 py-1 rounded ${
                  traceDirection === 'backward' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}
              >
                <ChevronLeft className="w-4 h-4 inline mr-1" />
                Backward (Suppliers)
              </button>
              <button
                onClick={() => setTraceDirection('both')}
                className={`px-3 py-1 rounded ${
                  traceDirection === 'both' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}
              >
                Both Directions
              </button>
              <button
                onClick={() => setTraceDirection('forward')}
                className={`px-3 py-1 rounded ${
                  traceDirection === 'forward' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}
              >
                Forward (Usage)
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
            <button
              onClick={exportGenealogy}
              className="ml-auto btn-secondary text-sm"
            >
              Export Report
            </button>
          </div>
        )}
      </div>

      {/* Genealogy Results */}
      {genealogyData && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Genealogy Results</h3>

          {/* Root Item */}
          <div className="bg-gradient-to-r from-teal-50 to-teal-100 border-2 border-teal-600 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  {genealogyData.type === 'batch' ? (
                    <Beaker className="w-5 h-5 text-teal-700" />
                  ) : (
                    <Package className="w-5 h-5 text-teal-700" />
                  )}
                  <span className="font-bold text-lg text-teal-900">
                    {genealogyData.type === 'batch' ? 'Batch' : 'Material'}: {genealogyData.id}
                  </span>
                </div>
                {genealogyData.type === 'batch' ? (
                  <div className="text-sm space-y-1">
                    <p><span className="font-semibold">Product:</span> {genealogyData.root.productName}</p>
                    <p><span className="font-semibold">Quantity:</span> {genealogyData.root.quantity} units</p>
                    <p><span className="font-semibold">Status:</span> {genealogyData.root.status}</p>
                    <p><span className="font-semibold">Created:</span> {new Date(genealogyData.root.createdDate).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <div className="text-sm space-y-1">
                    <p><span className="font-semibold">Material:</span> {genealogyData.root.name}</p>
                    <p><span className="font-semibold">Article:</span> {genealogyData.root.articleNumber}</p>
                    <p><span className="font-semibold">Supplier:</span> {genealogyData.root.supplier}</p>
                    <p><span className="font-semibold">Quantity:</span> {genealogyData.root.quantity} {materials.find(m => m.lotNumber === genealogyData.id)?.unit}</p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className={`px-4 py-2 rounded-lg font-semibold ${
                  genealogyData.root.status === 'completed' || genealogyData.root.status === 'validated' ? 'bg-green-200 text-green-800' :
                  genealogyData.root.status === 'in_progress' || genealogyData.root.status === 'quarantine' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-blue-200 text-blue-800'
                }`}>
                  {genealogyData.root.status}
                </div>
              </div>
            </div>
          </div>

          {/* Backward Trace (Materials Used) */}
          {genealogyData.type === 'batch' && genealogyData.backward && (traceDirection === 'backward' || traceDirection === 'both') && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <ChevronLeft className="w-5 h-5 text-blue-600" />
                <h4 className="text-md font-semibold text-blue-900">Backward Trace: Input Materials</h4>
              </div>
              <div className="border-l-4 border-blue-400 pl-4 space-y-3">
                {genealogyData.backward.materials.map((mat, idx) => (
                  <div key={idx} className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{mat.materialArticle} - {mat.materialDetails?.name}</p>
                        <div className="text-xs text-gray-700 mt-1 space-y-1">
                          <p><span className="font-semibold">Lot:</span> {mat.lotNumber}</p>
                          <p><span className="font-semibold">Quantity Used:</span> {mat.quantity} {mat.unit}</p>
                          <p><span className="font-semibold">Supplier:</span> {mat.materialDetails?.supplier}</p>
                          <p><span className="font-semibold">Received:</span> {mat.materialDetails?.receivedDate}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        mat.materialDetails?.status === 'validated' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {mat.materialDetails?.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {genealogyData.backward.rawMaterialSuppliers.length > 0 && (
                <div className="mt-3 bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-semibold mb-1">Raw Material Suppliers:</p>
                  <div className="flex flex-wrap gap-2">
                    {genealogyData.backward.rawMaterialSuppliers.map((supplier, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-200 rounded text-xs">
                        {supplier}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Forward Trace (Usage) */}
          {genealogyData.forward && (traceDirection === 'forward' || traceDirection === 'both') && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <ChevronRight className="w-5 h-5 text-green-600" />
                <h4 className="text-md font-semibold text-green-900">
                  Forward Trace: {genealogyData.type === 'batch' ? 'Where Used' : 'Impact Analysis'}
                </h4>
              </div>

              {genealogyData.type === 'material' && (
                <div className="mb-4 grid grid-cols-3 gap-3">
                  <div className="bg-green-50 border border-green-300 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {genealogyData.forward.directBatches?.length || 0}
                    </div>
                    <div className="text-xs text-gray-600">Direct Batches</div>
                  </div>
                  <div className="bg-orange-50 border border-orange-300 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-orange-700">
                      {genealogyData.forward.totalImpact || 0}
                    </div>
                    <div className="text-xs text-gray-600">Total Impact</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {genealogyData.forward.allAffectedBatches?.filter(b => b.status === 'completed').length || 0}
                    </div>
                    <div className="text-xs text-gray-600">Completed Batches</div>
                  </div>
                </div>
              )}

              <div className="border-l-4 border-green-400 pl-4 space-y-3">
                {genealogyData.type === 'material' && genealogyData.forward.directBatches?.length > 0 ? (
                  <>
                    <p className="text-sm font-semibold mb-2">Direct Usage:</p>
                    {genealogyData.forward.directBatches.map((batch, idx) => (
                      <div key={idx} className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm">{batch.id} - {batch.productName}</p>
                            <div className="text-xs text-gray-700 mt-1">
                              <p><span className="font-semibold">Quantity Used:</span> {batch.quantityUsed} g</p>
                              <p><span className="font-semibold">Created:</span> {new Date(batch.createdDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                            batch.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {batch.status}
                          </span>
                        </div>
                      </div>
                    ))}

                    {genealogyData.forward.allAffectedBatches?.length > genealogyData.forward.directBatches.length && (
                      <>
                        <p className="text-sm font-semibold mt-4 mb-2">Downstream Impact (Cascading):</p>
                        {genealogyData.forward.allAffectedBatches
                          .filter(b => !genealogyData.forward.directBatches.some(db => db.id === b.id))
                          .map((batch, idx) => (
                            <div key={idx} className="bg-orange-50 rounded-lg p-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-xs">{batch.id} - {batch.productName}</p>
                                  <p className="text-xs text-gray-600">Created: {new Date(batch.createdDate).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {batch.status}
                                </span>
                              </div>
                            </div>
                          ))
                        }
                      </>
                    )}
                  </>
                ) : genealogyData.type === 'batch' && genealogyData.forward.batches?.length > 0 ? (
                  genealogyData.forward.batches.map((batch, idx) => (
                    <div key={idx} className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{batch.id} - {batch.productName}</p>
                          <p className="text-xs text-gray-600">Created: {new Date(batch.createdDate).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {batch.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No forward usage found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Search Suggestions */}
      {!genealogyData && (
        <div className="glass-card">
          <h3 className="text-md font-semibold mb-3">Available for Tracing:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold mb-2">Batches:</p>
              <div className="space-y-1">
                {batches.slice(0, 5).map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSearchType('batch');
                      setSearchId(b.id);
                    }}
                    className="w-full text-left px-3 py-2 bg-white/40 hover:bg-white/60 rounded text-xs"
                  >
                    {b.id} - {formulas.find(f => f.id === b.formulaId)?.productName}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Materials:</p>
              <div className="space-y-1">
                {materials.slice(0, 5).map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSearchType('material');
                      setSearchId(m.lotNumber);
                    }}
                    className="w-full text-left px-3 py-2 bg-white/40 hover:bg-white/60 rounded text-xs"
                  >
                    {m.lotNumber} - {m.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
