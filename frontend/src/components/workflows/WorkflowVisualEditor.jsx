import React, { useState, useRef } from "react";
import { stepsToGraph } from "./WorkflowUtils";
import { getBomItemsForFormula, getBomItemName, shouldShowBomDropdown } from "./workflowDemoData";

/* -------------------------------------------------------------------------- */
/*                     ENHANCED VISUAL WORKFLOW EDITOR                        */
/* -------------------------------------------------------------------------- */

export default function WorkflowVisualEditor({
  workflow = {},
  onWorkflowChange = () => {},
  formulas = [],
  equipment = [],
  workStations = [],
}) {
  const svgRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // -------------------- улучшенные типы узлов --------------------
  const nodeTypes = {
    start: { 
      color: "#059669", 
      bgColor: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", 
      borderColor: "#10b981", 
      label: "Старт", 
      width: 180, 
      height: 100,
      icon: "▶"
    },
    weighing: { 
      color: "#7c3aed", 
      bgColor: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)", 
      borderColor: "#8b5cf6", 
      label: "Взвешивание", 
      width: 200, 
      height: 120,
      icon: "⚖"
    },
    dispensing: { 
      color: "#dc2626", 
      bgColor: "linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)", 
      borderColor: "#ef4444", 
      label: "Дозирование", 
      width: 200, 
      height: 120,
      icon: "💉"
    },
    mixing: { 
      color: "#2563eb", 
      bgColor: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", 
      borderColor: "#3b82f6", 
      label: "Смешивание", 
      width: 200, 
      height: 120,
      icon: "🌀"
    },
    qc: { 
      color: "#ea580c", 
      bgColor: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)", 
      borderColor: "#f97316", 
      label: "QC Проверка", 
      width: 200, 
      height: 120,
      icon: "🔍"
    },
    process: { 
      color: "#6366f1", 
      bgColor: "linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)", 
      borderColor: "#6366f1", 
      label: "Процесс", 
      width: 200, 
      height: 120,
      icon: "⚙"
    },
    decision: { 
      color: "#7c2d12", 
      bgColor: "linear-gradient(135deg, #fefce8 0%, #fde68a 100%)", 
      borderColor: "#eab308", 
      label: "Условие", 
      width: 180, 
      height: 120,
      icon: "◆"
    },
    end: { 
      color: "#4b5563", 
      bgColor: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)", 
      borderColor: "#6b7280", 
      label: "Конец", 
      width: 180, 
      height: 100,
      icon: "■"
    }
  };

  // -------------------- helpers --------------------
  const nodeById = (id) => (workflow.nodes || []).find((n) => n.id === id);
  const stepIdFromNodeId = (nodeId) =>
    nodeId?.startsWith("node_") ? parseInt(nodeId.replace("node_", ""), 10) : null;
  const stepById = (id) => (workflow.steps || []).find((s) => s.id === id);
  const stepsOptions = () =>
    (workflow.steps || []).map((s) => ({ value: s.id, label: s.name || `Step ${s.id}` }));

  const mergePositions = (oldWf, newWf) => {
    const posMap = new Map((oldWf.nodes || []).map((n) => [n.id, n.position]));
    const nodes = (newWf.nodes || []).map((n) =>
      posMap.has(n.id) ? { ...n, position: posMap.get(n.id) } : n
    );
    return { ...newWf, nodes };
  };

  // -------------------- DRAG --------------------
  const onNodeMouseDown = (e, node) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDraggingNodeId(node.id);
    setDragOffset({
      x: e.clientX - rect.left - node.position.x,
      y: e.clientY - rect.top - node.position.y,
    });
  };

  const onMouseMove = (e) => {
    if (!draggingNodeId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    const updated = {
      ...workflow,
      nodes: (workflow.nodes || []).map((n) =>
        n.id === draggingNodeId ? { ...n, position: { x: newX, y: newY } } : n
      ),
      steps: (workflow.steps || []).map((s) =>
        s.id === stepIdFromNodeId(draggingNodeId) ? { ...s, position: { x: newX, y: newY } } : s
      ),
    };

    onWorkflowChange(updated);
  };

  const onMouseUp = () => setDraggingNodeId(null);

  // -------------------- ВЫБОР --------------------
  const onCanvasClick = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const onNodeClick = (node) => {
    setSelectedNode(node.id);
    setSelectedEdge(null);
  };

  const onEdgeClick = (edge) => {
    setSelectedEdge(edge.id);
    setSelectedNode(null);
  };

  // -------------------- ОБНОВЛЕНИЕ ШАГА --------------------
  const updateSelectedStep = (updater) => {
    if (!selectedNode) return;
    const stepId = stepIdFromNodeId(selectedNode);
    if (!stepId) return;

    const updatedSteps = (workflow.steps || []).map((s) =>
      s.id === stepId ? updater(s) : s
    );

    // Пересобрать граф с сохранением позиций
    const newWorkflow = stepsToGraph({ ...workflow, steps: updatedSteps });
    const merged = mergePositions(workflow, newWorkflow);
    onWorkflowChange(merged);
  };

  // -------------------- Рендер edges --------------------
  const renderEdge = (edge) => {
    const sourceNode = nodeById(edge.source);
    const targetNode = nodeById(edge.target);
    if (!sourceNode || !targetNode) return null;

    const sourceType = nodeTypes[sourceNode.type] || nodeTypes.process;
    const targetType = nodeTypes[targetNode.type] || nodeTypes.process;
    const x1 = sourceNode.position.x + sourceType.width / 2;
    const y1 = sourceNode.position.y + sourceType.height;
    const x2 = targetNode.position.x + targetType.width / 2;
    const y2 = targetNode.position.y;

    let edgeColor = "#64748b";
    let strokeWidth = 3;
    let dash = "none";
    
    if (edge.type === "conditional") { 
      edgeColor = "#f59e0b"; 
      dash = "8,4"; 
      strokeWidth = 4;
    }
    if (edge.type === "rework") { 
      edgeColor = "#ef4444"; 
      dash = "4,3"; 
      strokeWidth = 4;
    }
    if (edge.type === "parallel") { 
      edgeColor = "#10b981"; 
      dash = "2,8"; 
      strokeWidth = 5;
    }

    const isSelected = selectedEdge === edge.id;

    return (
      <g key={edge.id}>
        {/* Glow effect for parallel edges */}
        {edge.type === "parallel" && (
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={edgeColor}
            strokeWidth={strokeWidth + 6}
            strokeDasharray={dash}
            opacity="0.3"
            filter="blur(3px)"
          />
        )}
        
        {/* Shadow */}
        <line
          x1={x1 + 2}
          y1={y1 + 2}
          x2={x2 + 2}
          y2={y2 + 2}
          stroke="rgba(0,0,0,0.15)"
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
        />
        
        {/* Main line */}
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={edgeColor}
          strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
          markerEnd="url(#arrowhead)"
          strokeDasharray={dash}
          className="cursor-pointer transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onEdgeClick(edge);
          }}
          style={{
            filter: isSelected ? `drop-shadow(0 0 6px ${edgeColor})` : 'none'
          }}
        />
        
        {/* Label with enhanced styling */}
        {edge.label && (
          <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
            <rect 
              x="-50" 
              y="-15" 
              width="100" 
              height="30" 
              rx="15" 
              fill="white" 
              stroke={edgeColor} 
              strokeWidth="2"
              filter="drop-shadow(2px 2px 6px rgba(0,0,0,0.1))"
            />
            <text 
              x="0" 
              y="5" 
              textAnchor="middle" 
              className="text-sm font-semibold" 
              fill={edgeColor}
            >
              {edge.label}
            </text>
          </g>
        )}
      </g>
    );
  };

  // -------------------- Рендер узлов --------------------
  const renderNode = (node) => {
    const nodeType = nodeTypes[node.type] || nodeTypes.process;
    const isSelected = selectedNode === node.id;
    const step = stepById(stepIdFromNodeId(node.id));

    return (
      <g key={node.id} transform={`translate(${node.position.x}, ${node.position.y})`}>
        {/* Enhanced shadow with blur */}
        <rect
          width={nodeType.width}
          height={nodeType.height}
          rx="20"
          fill="rgba(0,0,0,0.08)"
          transform="translate(6,6)"
          filter="blur(4px)"
        />
        
        {/* Selection glow */}
        {isSelected && (
          <rect
            width={nodeType.width + 8}
            height={nodeType.height + 8}
            rx="24"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            transform="translate(-4,-4)"
            filter="drop-shadow(0 0 12px rgba(59, 130, 246, 0.4))"
            opacity="0.8"
          />
        )}
        
        {/* Main container with gradient */}
        <defs>
          <linearGradient id={`gradient-${node.type}-${node.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: nodeType.bgColor.match(/#[a-f0-9]{6}/gi)?.[0] || '#f8fafc'}} />
            <stop offset="100%" style={{stopColor: nodeType.bgColor.match(/#[a-f0-9]{6}/gi)?.[1] || '#e2e8f0'}} />
          </linearGradient>
        </defs>
        
        <rect
          width={nodeType.width}
          height={nodeType.height}
          rx="20"
          fill={`url(#gradient-${node.type}-${node.id})`}
          stroke={isSelected ? "#3b82f6" : nodeType.borderColor}
          strokeWidth={isSelected ? "3" : "2"}
          onMouseDown={(e) => onNodeMouseDown(e, node)}
          onClick={(e) => {
            e.stopPropagation();
            onNodeClick(node);
          }}
          className="cursor-move transition-all duration-300 hover:stroke-4"
          style={{
            filter: isSelected ? 'drop-shadow(0 8px 25px rgba(59, 130, 246, 0.15))' : 'drop-shadow(0 4px 15px rgba(0,0,0,0.1))'
          }}
        />
        
        {/* Header bar with enhanced gradient */}
        <rect 
          width={nodeType.width} 
          height="12" 
          rx="20" 
          fill={nodeType.color}
          opacity="0.9"
        />
        
        {/* Icon container with enhanced styling */}
        <circle
          cx="40"
          cy="45"
          r="25"
          fill="white"
          stroke={nodeType.color}
          strokeWidth="3"
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
        />
        <circle
          cx="40"
          cy="45"
          r="20"
          fill={nodeType.color}
          fillOpacity="0.15"
        />
        
        {/* Enhanced icon */}
        <text 
          x="40" 
          y="52" 
          textAnchor="middle" 
          className="text-xl font-bold" 
          fill={nodeType.color}
        >
          {nodeType.icon}
        </text>
        
        {/* Title with better typography */}
        <text 
          x="85" 
          y="35" 
          className="text-base font-bold" 
          fill="#1f2937"
        >
          {node.name?.length > 16 ? node.name.substring(0, 16) + '…' : node.name}
        </text>
        
        {/* Type badge */}
        <text 
          x="85" 
          y="50" 
          className="text-sm font-medium" 
          fill="#6b7280"
        >
          {nodeType.label}
        </text>
        
        {/* Enhanced status indicators */}
        <g transform={`translate(85, 60)`}>
          {/* BOM indicator */}
          {step?.formulaBomId && (
            <g>
              <rect x="0" y="0" width="12" height="12" rx="6" fill="#059669" />
              <text x="6" y="8" textAnchor="middle" className="text-xs font-bold" fill="white">B</text>
              <text x="20" y="10" className="text-xs font-medium" fill="#059669">
                {getBomItemName(step.formulaBomId, formulas, workflow.formulaId)?.split('(')[0]?.substring(0, 12) || 'BOM'}
              </text>
            </g>
          )}
          
          {/* Equipment indicator */}
          {step?.equipmentId && (
            <g transform="translate(0, 18)">
              <rect x="0" y="0" width="12" height="12" rx="6" fill="#7c3aed" />
              <text x="6" y="8" textAnchor="middle" className="text-xs font-bold" fill="white">E</text>
              <text x="20" y="10" className="text-xs font-medium" fill="#7c3aed">
                {equipment.find(e => e.id === step.equipmentId)?.name?.substring(0, 12) || 'Equipment'}
              </text>
            </g>
          )}
        </g>
        
        {/* Enhanced transition mode indicator */}
        {step?.transition && (
          <g transform={`translate(${nodeType.width - 35}, 20)`}>
            <circle 
              r="18" 
              fill="white" 
              stroke={nodeType.borderColor} 
              strokeWidth="2"
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
            />
            <text x="0" y="6" textAnchor="middle" fontSize="12" fontWeight="bold" fill={nodeType.color}>
              {step.transition.mode === 'conditional' ? '?' :
               step.transition.mode === 'rework' ? 'R' :
               step.transition.mode === 'parallel' ? '⫴' :
               step.transition.mode === 'manual' ? 'M' : 'A'}
            </text>
            
            {/* Parallel targets indicator */}
            {step.transition.mode === 'parallel' && Array.isArray(step.parallelTargets) && step.parallelTargets.length > 0 && (
              <g transform="translate(20, -10)">
                <circle r="8" fill="#10b981" />
                <text x="0" y="3" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">
                  {step.parallelTargets.length}
                </text>
              </g>
            )}
          </g>
        )}
      </g>
    );
  };

  // Get selected step data
  const selectedStep = selectedNode ? stepById(stepIdFromNodeId(selectedNode)) : null;
  const bomItems = workflow.formulaId ? getBomItemsForFormula(workflow.formulaId, formulas) : [];

  // -------------------- Render --------------------
  return (
    <div className="h-full relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Enhanced Right Panel */}
      <div className="absolute top-0 right-0 h-full w-[450px] bg-white/95 backdrop-blur-xl border-l border-slate-200 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-bold">⚙</span>
            </div>
            <div>
              <div className="font-bold text-lg text-slate-800">Step Configuration</div>
              <div className="text-sm text-slate-500">
                {selectedStep ? `Step ${selectedStep.id} - ${selectedStep.name}` : 'Select a step to configure'}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {!selectedStep ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <span className="text-3xl text-slate-400">👆</span>
              </div>
              <div className="text-slate-600 text-lg font-medium mb-2">
                No Step Selected
              </div>
              <div className="text-slate-400 text-sm">
                Click on a step in the workflow to configure its properties, parameters, and transitions
              </div>
            </div>
          ) : (
            <>
              {/* Basic Properties */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-lg font-bold text-slate-700 border-b border-slate-200 pb-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                  <span>Basic Properties</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Step Name</label>
                    <input
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={selectedStep.name}
                      onChange={(e) =>
                        updateSelectedStep((s) => ({ ...s, name: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Step Type</label>
                    <select
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={selectedStep.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        updateSelectedStep((s) => ({
                          ...s,
                          type: newType,
                          formulaBomId: shouldShowBomDropdown(newType) ? s.formulaBomId : null,
                          qcParameters: newType === 'qc' ? (s.qcParameters || {}) : {},
                        }));
                      }}
                    >
                      <option value="process">Process</option>
                      <option value="weighing">Weighing</option>
                      <option value="dispensing">Dispensing</option>
                      <option value="qc">QC Check</option>
                      <option value="mixing">Mixing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Instruction</label>
                    <textarea
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                      rows="4"
                      value={selectedStep.instruction || ""}
                      onChange={(e) =>
                        updateSelectedStep((s) => ({ ...s, instruction: e.target.value }))
                      }
                      placeholder="Enter step instructions..."
                    />
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-lg font-bold text-slate-700 border-b border-slate-200 pb-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
                  <span>Resources</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Equipment</label>
                    <select
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={selectedStep.equipmentId || ""}
                      onChange={(e) =>
                        updateSelectedStep((s) => ({
                          ...s,
                          equipmentId: parseInt(e.target.value) || null,
                        }))
                      }
                    >
                      <option value="">Select equipment...</option>
                      {equipment.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Work Station</label>
                    <select
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={selectedStep.workStationId || ""}
                      onChange={(e) =>
                        updateSelectedStep((s) => ({
                          ...s,
                          workStationId: parseInt(e.target.value) || null,
                        }))
                      }
                    >
                      <option value="">Select station...</option>
                      {workStations.map((ws) => (
                        <option key={ws.id} value={ws.id}>
                          {ws.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {shouldShowBomDropdown(selectedStep.type) && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">BOM Material</label>
                      <select
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={selectedStep.formulaBomId || ""}
                        onChange={(e) =>
                          updateSelectedStep((s) => ({
                            ...s,
                            formulaBomId: parseInt(e.target.value) || null,
                          }))
                        }
                        disabled={!workflow.formulaId}
                      >
                        <option value="">Select material...</option>
                        {bomItems.map((bom) => (
                          <option key={bom.id} value={bom.id}>
                            {bom.materialArticle} ({bom.quantity}{bom.unit})
                          </option>
                        ))}
                      </select>
                      {!workflow.formulaId && (
                        <div className="text-sm text-orange-600 mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                          ⚠ Select formula in table view to access BOM materials
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Step Parameters */}
              {(selectedStep.type === "dispensing" || selectedStep.type === "weighing" || selectedStep.type === "mixing") && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-lg font-bold text-slate-700 border-b border-slate-200 pb-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
                    <span>Step Parameters</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {(selectedStep.type === "dispensing" || selectedStep.type === "weighing") && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Target Weight</label>
                          <input
                            type="number"
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={selectedStep.stepParameters?.targetWeight || ""}
                            onChange={(e) =>
                              updateSelectedStep((s) => ({
                                ...s,
                                stepParameters: {
                                  ...(s.stepParameters || {}),
                                  targetWeight: parseFloat(e.target.value) || 0,
                                },
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Tolerance</label>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={selectedStep.stepParameters?.tolerance || ""}
                            onChange={(e) =>
                              updateSelectedStep((s) => ({
                                ...s,
                                stepParameters: {
                                  ...(s.stepParameters || {}),
                                  tolerance: parseFloat(e.target.value) || 0,
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Unit</label>
                          <select
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={selectedStep.stepParameters?.unit || "mg"}
                            onChange={(e) =>
                              updateSelectedStep((s) => ({
                                ...s,
                                stepParameters: {
                                  ...(s.stepParameters || {}),
                                  unit: e.target.value,
                                },
                              }))
                            }
                          >
                            <option value="mg">mg</option>
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                          </select>
                        </div>
                      </>
                    )}
                    
                    {selectedStep.type === "mixing" && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Duration (min)</label>
                          <input
                            type="number"
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={selectedStep.stepParameters?.duration || ""}
                            onChange={(e) =>
                              updateSelectedStep((s) => ({
                                ...s,
                                stepParameters: {
                                  ...(s.stepParameters || {}),
                                  duration: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">RPM</label>
                          <input
                            type="number"
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={selectedStep.stepParameters?.rpm || ""}
                            onChange={(e) =>
                              updateSelectedStep((s) => ({
                                ...s,
                                stepParameters: {
                                  ...(s.stepParameters || {}),
                                  rpm: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Temperature (°C)</label>
                          <input
                            type="number"
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={selectedStep.stepParameters?.temperature || ""}
                            onChange={(e) =>
                              updateSelectedStep((s) => ({
                                ...s,
                                stepParameters: {
                                  ...(s.stepParameters || {}),
                                  temperature: parseInt(e.target.value) || 20,
                                },
                              }))
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* QC Parameters */}
              {selectedStep.type === "qc" && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-lg font-bold text-slate-700 border-b border-slate-200 pb-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-full"></div>
                    <span>QC Parameters</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Parameter</label>
                      <input
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={selectedStep.qcParameters?.parameter || ""}
                        onChange={(e) =>
                          updateSelectedStep((s) => ({
                            ...s,
                            qcParameters: {
                              ...(s.qcParameters || {}),
                              parameter: e.target.value,
                            },
                          }))
                        }
                        placeholder="e.g., pH, viscosity, temperature"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Min Value</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={selectedStep.qcParameters?.min || ""}
                        onChange={(e) =>
                          updateSelectedStep((s) => ({
                            ...s,
                            qcParameters: {
                              ...(s.qcParameters || {}),
                              min: parseFloat(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Max Value</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={selectedStep.qcParameters?.max || ""}
                        onChange={(e) =>
                          updateSelectedStep((s) => ({
                            ...s,
                            qcParameters: {
                              ...(s.qcParameters || {}),
                              max: parseFloat(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Unit</label>
                      <select
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={selectedStep.qcParameters?.unit || "%"}
                        onChange={(e) =>
                          updateSelectedStep((s) => ({
                            ...s,
                            qcParameters: {
                              ...(s.qcParameters || {}),
                              unit: e.target.value,
                            },
                          }))
                        }
                      >
                        <option value="%">%</option>
                        <option value="mg">mg</option>
                        <option value="g">g</option>
                        <option value="pH">pH</option>
                        <option value="°C">°C</option>
                        <option value="cP">cP (centipoise)</option>
                        <option value="ppm">ppm</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Transitions Section - Enhanced */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 text-lg font-bold text-slate-700 border-b border-slate-200 pb-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
                  <span>Transition Settings</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Transition Mode</label>
                    <select
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={selectedStep.transition?.mode || "automatic"}
                      onChange={(e) =>
                        updateSelectedStep((s) => ({
                          ...s,
                          transition: {
                            ...(s.transition || {}),
                            mode: e.target.value,
                          },
                        }))
                      }
                    >
                      <option value="automatic">Automatic</option>
                      <option value="manual">Manual</option>
                      <option value="conditional">Conditional</option>
                      <option value="rework">Rework</option>
                      <option value="parallel">Parallel</option>
                    </select>
                    <div className="mt-2 text-xs text-slate-500 p-3 bg-slate-50 rounded-lg">
                      <strong>Mode descriptions:</strong><br/>
                      • <strong>Automatic:</strong> Proceeds to next step automatically<br/>
                      • <strong>Manual:</strong> Requires manual confirmation<br/>
                      • <strong>Conditional:</strong> Based on QC results or conditions<br/>
                      • <strong>Rework:</strong> Returns to previous step for corrections<br/>
                      • <strong>Parallel:</strong> Executes multiple steps simultaneously
                    </div>
                  </div>

                  {/* Next Step Selection */}
                  {["automatic", "manual", "conditional"].includes(
                    selectedStep.transition?.mode || "automatic"
                  ) && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Next Step</label>
                      <select
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={selectedStep.nextStepId || ""}
                        onChange={(e) =>
                          updateSelectedStep((s) => ({
                            ...s,
                            nextStepId: e.target.value ? parseInt(e.target.value) : null,
                          }))
                        }
                      >
                        <option value="">(Follow sequential order)</option>
                        {stepsOptions()
                          .filter((o) => o.value !== selectedStep.id)
                          .map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Rework Target */}
                  {selectedStep.transition?.mode === "rework" && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Rework Target Step</label>
                      <select
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={selectedStep.reworkTargetId || ""}
                        onChange={(e) =>
                          updateSelectedStep((s) => ({
                            ...s,
                            reworkTargetId: e.target.value ? parseInt(e.target.value) : null,
                          }))
                        }
                      >
                        <option value="">Select target step...</option>
                        {stepsOptions()
                          .filter((o) => o.value !== selectedStep.id)
                          .map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Parallel Targets */}
                  {selectedStep.transition?.mode === "parallel" && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Parallel Target Steps</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto p-4 bg-slate-50 rounded-xl border border-slate-200">
                        {stepsOptions()
                          .filter((o) => o.value !== selectedStep.id)
                          .map((o) => {
                            const selected = Array.isArray(selectedStep.parallelTargets)
                              ? selectedStep.parallelTargets.includes(o.value)
                              : false;
                            return (
                              <label key={o.value} className="flex items-center space-x-3 cursor-pointer hover:bg-white rounded-lg p-2 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={(e) =>
                                    updateSelectedStep((s) => {
                                      const set = new Set(s.parallelTargets || []);
                                      if (e.target.checked) {
                                        set.add(o.value);
                                      } else {
                                        set.delete(o.value);
                                      }
                                      return {
                                        ...s,
                                        parallelTargets: Array.from(set),
                                      };
                                    })
                                  }
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className={`text-sm font-medium ${selected ? 'text-blue-700' : 'text-slate-700'}`}>
                                  {o.label}
                                </span>
                                {selected && (
                                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </label>
                            );
                          })}
                      </div>
                      {Array.isArray(selectedStep.parallelTargets) && selectedStep.parallelTargets.length > 0 && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="text-sm text-green-800 font-medium">
                            Selected {selectedStep.parallelTargets.length} parallel target(s):
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            {selectedStep.parallelTargets.map(id => {
                              const step = stepsOptions().find(o => o.value === id);
                              return step ? step.label : `Step ${id}`;
                            }).join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Override */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Manual Override</label>
                    <select
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={
                        (selectedStep.transition?.allowManualOverride ?? true) === true
                          ? "allowed"
                          : "forbidden"
                      }
                      onChange={(e) =>
                        updateSelectedStep((s) => ({
                          ...s,
                          transition: {
                            ...(s.transition || {}),
                            allowManualOverride: e.target.value === "allowed",
                          },
                        }))
                      }
                    >
                      <option value="allowed">Allowed</option>
                      <option value="forbidden">Forbidden</option>
                    </select>
                  </div>

                  {/* Conditional Parameters */}
                  {selectedStep.transition?.mode === "conditional" && (
                    <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <h4 className="text-sm font-bold text-yellow-800">Conditional Logic</h4>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Condition Type</label>
                        <select
                          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={selectedStep.transition?.condition?.type || "qc_result"}
                          onChange={(e) =>
                            updateSelectedStep((s) => ({
                              ...s,
                              transition: {
                                ...(s.transition || {}),
                                condition: {
                                  ...(s.transition?.condition || {}),
                                  type: e.target.value,
                                },
                              },
                            }))
                          }
                        >
                          <option value="qc_result">QC Result</option>
                          <option value="time_elapsed">Time Elapsed</option>
                          <option value="equipment_signal">Equipment Signal</option>
                          <option value="custom">Custom Formula</option>
                        </select>
                      </div>

                      {/* QC Result Condition */}
                      {selectedStep.transition?.condition?.type === "qc_result" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">QC Parameter</label>
                            <input
                              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={selectedStep.transition?.condition?.qcParam || ""}
                              onChange={(e) =>
                                updateSelectedStep((s) => ({
                                  ...s,
                                  transition: {
                                    ...(s.transition || {}),
                                    condition: {
                                      ...(s.transition?.condition || {}),
                                      qcParam: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., weight, pH, temperature"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Expected Result</label>
                            <select
                              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={selectedStep.transition?.condition?.expected || "pass"}
                              onChange={(e) =>
                                updateSelectedStep((s) => ({
                                  ...s,
                                  transition: {
                                    ...(s.transition || {}),
                                    condition: {
                                      ...(s.transition?.condition || {}),
                                      expected: e.target.value,
                                    },
                                  },
                                }))
                              }
                            >
                              <option value="pass">Pass</option>
                              <option value="fail">Fail</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Time Elapsed Condition */}
                      {selectedStep.transition?.condition?.type === "time_elapsed" && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Minutes to Wait</label>
                          <input
                            type="number"
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={selectedStep.transition?.condition?.minutes || ""}
                            onChange={(e) =>
                              updateSelectedStep((s) => ({
                                ...s,
                                transition: {
                                  ...(s.transition || {}),
                                  condition: {
                                    ...(s.transition?.condition || {}),
                                    minutes: parseInt(e.target.value) || 0,
                                  },
                                },
                              }))
                            }
                            placeholder="Enter time in minutes"
                          />
                        </div>
                      )}

                      {/* Equipment Signal Condition */}
                      {selectedStep.transition?.condition?.type === "equipment_signal" && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Equipment Signal Code</label>
                          <input
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={selectedStep.transition?.condition?.signalCode || ""}
                            onChange={(e) =>
                              updateSelectedStep((s) => ({
                                ...s,
                                transition: {
                                  ...(s.transition || {}),
                                  condition: {
                                    ...(s.transition?.condition || {}),
                                    signalCode: e.target.value,
                                  },
                                },
                              }))
                            }
                            placeholder="e.g., TEMP_READY, MIX_COMPLETE"
                          />
                        </div>
                      )}

                      {/* Custom Formula Condition */}
                      {selectedStep.transition?.condition?.type === "custom" && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Custom Condition Formula</label>
                          <textarea
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows="3"
                            value={selectedStep.transition?.condition?.formula || ""}
                            onChange={(e) =>
                              updateSelectedStep((s) => ({
                                ...s,
                                transition: {
                                  ...(s.transition || {}),
                                  condition: {
                                    ...(s.transition?.condition || {}),
                                    formula: e.target.value,
                                  },
                                },
                              }))
                            }
                            placeholder="e.g., temperature > 30 && ph < 7 && weight >= 100"
                          />
                          <div className="text-xs text-slate-500 mt-2">
                             {"Use logical operators: && (and), || (or), >, <, >=, <=, ==, !="}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SVG Canvas with enhanced styling */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-default"
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onClick={onCanvasClick}
        style={{ backgroundColor: 'transparent' }}
      >
        {/* Enhanced Definitions */}
        <defs>
          {/* Arrow marker */}
          <marker
            id="arrowhead"
            markerWidth="12"
            markerHeight="8"
            refX="11"
            refY="4"
            orient="auto"
            fill="#64748b"
          >
            <polygon points="0 0, 12 4, 0 8" />
          </marker>
          
          {/* Gradients for each node type */}
          {Object.entries(nodeTypes).map(([type, config]) => (
            <linearGradient key={type} id={`gradient-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor: config.bgColor.match(/#[a-f0-9]{6}/gi)?.[0] || '#f8fafc'}} />
              <stop offset="100%" style={{stopColor: config.bgColor.match(/#[a-f0-9]{6}/gi)?.[1] || '#e2e8f0'}} />
            </linearGradient>
          ))}
        </defs>

        {/* Grid background */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1" opacity="0.5"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Render edges */}
        {(workflow.edges || []).map(renderEdge)}

        {/* Render nodes */}
        {(workflow.nodes || []).map(renderNode)}
      </svg>
    </div>
  );
}