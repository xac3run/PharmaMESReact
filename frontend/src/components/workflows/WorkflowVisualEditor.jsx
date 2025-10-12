import React, { useState, useRef, useEffect } from "react";
import { stepsToGraph } from "./WorkflowUtils";
import {
  getBomItemsForFormula,
  getBomItemName,
  shouldShowBomDropdown,
} from "./workflowDemoData";

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
      icon: "▶",
    },
    weighing: {
      color: "#7c3aed",
      bgColor: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
      borderColor: "#8b5cf6",
      label: "Взвешивание",
      width: 200,
      height: 120,
      icon: "⚖",
    },
    dispensing: {
      color: "#dc2626",
      bgColor: "linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)",
      borderColor: "#ef4444",
      label: "Дозирование",
      width: 200,
      height: 120,
      icon: "💉",
    },
    mixing: {
      color: "#2563eb",
      bgColor: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
      borderColor: "#3b82f6",
      label: "Смешивание",
      width: 200,
      height: 120,
      icon: "🌀",
    },
    qc: {
      color: "#ea580c",
      bgColor: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)",
      borderColor: "#f97316",
      label: "QC Проверка",
      width: 200,
      height: 120,
      icon: "🔍",
    },
    process: {
      color: "#6366f1",
      bgColor: "linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)",
      borderColor: "#6366f1",
      label: "Процесс",
      width: 200,
      height: 120,
      icon: "⚙",
    },
    decision: {
      color: "#7c2d12",
      bgColor: "linear-gradient(135deg, #fefce8 0%, #fde68a 100%)",
      borderColor: "#eab308",
      label: "Условие",
      width: 180,
      height: 120,
      icon: "◆",
    },
    end: {
      color: "#4b5563",
      bgColor: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
      borderColor: "#6b7280",
      label: "Конец",
      width: 180,
      height: 100,
      icon: "■",
    },
  };

  // -------------------- helpers --------------------
  const nodeById = (id) => (workflow.nodes || []).find((n) => n.id === id);
  const stepIdFromNodeId = (nodeId) =>
    nodeId?.startsWith("node_") ? parseInt(nodeId.replace("node_", ""), 10) : null;
  const stepById = (id) => (workflow.steps || []).find((s) => s.id === id);
  const stepsOptions = () =>
    (workflow.steps || []).map((s) => ({
      value: s.id,
      label: s.name || `Step ${s.id}`,
    }));

  const mergePositions = (oldWf, newWf) => {
    const posMap = new Map((oldWf.nodes || []).map((n) => [n.id, n.position]));
    const nodes = (newWf.nodes || []).map((n) =>
      posMap.has(n.id) ? { ...n, position: posMap.get(n.id) } : n
    );
    return { ...newWf, nodes };
  };

  // Добавить кастомные связи для параллельных и rework переходов
  const addCustomEdges = (wf) => {
    const customEdges = [];

    (wf.steps || []).forEach((step) => {
      const sourceNodeId = `node_${step.id}`;

      // Параллельные связи
      if (step.transition?.mode === "parallel" && Array.isArray(step.parallelTargets)) {
        step.parallelTargets.forEach((targetId) => {
          const targetNodeId = `node_${targetId}`;
          customEdges.push({
            id: `edge_parallel_${step.id}_${targetId}`,
            source: sourceNodeId,
            target: targetNodeId,
            type: "parallel",
            label: "Parallel",
          });
        });
      }

      // Rework связи
      if (step.transition?.mode === "rework" && step.reworkTargetId) {
        const targetNodeId = `node_${step.reworkTargetId}`;
        customEdges.push({
          id: `edge_rework_${step.id}_${step.reworkTargetId}`,
          source: sourceNodeId,
          target: targetNodeId,
          type: "rework",
          label: "Rework",
        });
      }
    });

    // Оставляем существующие (кроме наших кастомных), + добавляем свои
    const existingEdges = (wf.edges || []).filter(
      (edge) => !edge.type || (edge.type !== "parallel" && edge.type !== "rework")
    );

    return {
      ...wf,
      edges: [...existingEdges, ...customEdges],
    };
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
        s.id === stepIdFromNodeId(draggingNodeId)
          ? { ...s, position: { x: newX, y: newY } }
          : s
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

    // Пересобрать граф с сохранением позиций и добавить кастомные рёбра
    const newWorkflow = stepsToGraph({ ...workflow, steps: updatedSteps });
    const merged = mergePositions(workflow, newWorkflow);
    const enhancedWorkflow = addCustomEdges(merged);
    onWorkflowChange(enhancedWorkflow);
  };

  // -------------------- инициализация кастомных связей при загрузке --------------------
  useEffect(() => {
    if (workflow.steps && workflow.steps.length > 0) {
      const enhancedWorkflow = addCustomEdges(workflow);
      // обновляем только если изменилось количество рёбер
      if (
        enhancedWorkflow.edges &&
        enhancedWorkflow.edges.length !== (workflow.edges || []).length
      ) {
        onWorkflowChange(enhancedWorkflow);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflow.steps?.length, onWorkflowChange]);

  // -------------------- рендер edges --------------------
  const renderEdge = (edge) => {
    const sourceNode = nodeById(edge.source);
    const targetNode = nodeById(edge.target);
    if (!sourceNode || !targetNode) return null;

    const sourceType = nodeTypes[sourceNode.type] || nodeTypes.process;
    const targetType = nodeTypes[targetNode.type] || nodeTypes.process;

    // Расстояние для лучшей видимости стрелок
    const x1 = sourceNode.position.x + sourceType.width / 2;
    const y1 = sourceNode.position.y + sourceType.height + 10;
    const x2 = targetNode.position.x + targetType.width / 2;
    const y2 = targetNode.position.y - 10;

    let edgeColor = "#64748b";
    let strokeWidth = 3;
    let dash = "none";
    let markerEnd = "url(#arrowhead)";

    if (edge.type === "conditional") {
      edgeColor = "#f59e0b";
      dash = "8,4";
      strokeWidth = 4;
    }
    if (edge.type === "rework") {
      edgeColor = "#ef4444";
      dash = "4,3";
      strokeWidth = 4;
      markerEnd = "url(#arrowhead-rework)";
    }
    if (edge.type === "parallel") {
      edgeColor = "#10b981";
      dash = "2,8";
      strokeWidth = 5;
      markerEnd = "url(#arrowhead-parallel)";
    }

    const isSelected = selectedEdge === edge.id;

    // Для rework — кривая
    if (edge.type === "rework") {
      const midX = (x1 + x2) / 2 - 80;
      const midY = (y1 + y2) / 2;
      const pathD = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;

      return (
        <g key={edge.id}>
          {/* Тень */}
          <path
            d={pathD}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth={strokeWidth}
            strokeDasharray={dash}
            fill="none"
            transform="translate(2,2)"
          />
          {/* Основная линия */}
          <path
            d={pathD}
            stroke={edgeColor}
            strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
            markerEnd={markerEnd}
            strokeDasharray={dash}
            fill="none"
            className="cursor-pointer transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onEdgeClick(edge);
            }}
            style={{
              filter: isSelected ? `drop-shadow(0 0 8px ${edgeColor})` : "none",
            }}
          />
          {/* Метка */}
          {edge.label && (
            <g transform={`translate(${midX}, ${midY - 20})`}>
              <rect
                x="-25"
                y="-10"
                width="50"
                height="20"
                rx="10"
                fill="white"
                stroke={edgeColor}
                strokeWidth="2"
                style={{ filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.1))" }}
              />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                className="text-xs font-semibold"
                fill={edgeColor}
              >
                {edge.label}
              </text>
            </g>
          )}
        </g>
      );
    }

    return (
      <g key={edge.id}>
        {/* Лёгкое свечение для parallel */}
        {edge.type === "parallel" && (
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={edgeColor}
            strokeWidth={strokeWidth + 8}
            strokeDasharray={dash}
            opacity="0.2"
            style={{ filter: "blur(4px)" }}
          />
        )}

        {/* Тень */}
        <line
          x1={x1 + 2}
          y1={y1 + 2}
          x2={x2 + 2}
          y2={y2 + 2}
          stroke="rgba(0,0,0,0.15)"
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
        />

        {/* Основная линия */}
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={edgeColor}
          strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
          markerEnd={markerEnd}
          strokeDasharray={dash}
          className="cursor-pointer transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onEdgeClick(edge);
          }}
          style={{
            filter: isSelected ? `drop-shadow(0 0 6px ${edgeColor})` : "none",
          }}
        />

        {/* Метка */}
        {edge.label && (
          <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
            <rect
              x="-35"
              y="-12"
              width="70"
              height="24"
              rx="12"
              fill="white"
              stroke={edgeColor}
              strokeWidth="2"
              style={{ filter: "drop-shadow(2px 2px 6px rgba(0,0,0,0.1))" }}
            />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              className="text-xs font-semibold"
              fill={edgeColor}
            >
              {edge.label}
            </text>
          </g>
        )}
      </g>
    );
  };

  // -------------------- рендер узлов --------------------
  const renderNode = (node) => {
    const nodeType = nodeTypes[node.type] || nodeTypes.process;
    const isSelected = selectedNode === node.id;
    const step = stepById(stepIdFromNodeId(node.id));

    return (
      <g key={node.id} transform={`translate(${node.position.x}, ${node.position.y})`}>
        {/* Тень */}
        <rect
          width={nodeType.width}
          height={nodeType.height}
          rx="20"
          fill="rgba(0,0,0,0.08)"
          transform="translate(4,4)"
          style={{ filter: "blur(3px)" }}
        />

        {/* Подсветка выбранного */}
        {isSelected && (
          <rect
            width={nodeType.width + 8}
            height={nodeType.height + 8}
            rx="24"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            transform="translate(-4,-4)"
            style={{ filter: "drop-shadow(0 0 12px rgba(59, 130, 246, 0.4))" }}
            opacity="0.8"
          />
        )}

        {/* Контейнер с градиентом */}
        <rect
          width={nodeType.width}
          height={nodeType.height}
          rx="20"
          fill={`url(#gradient-${node.type})`}
          stroke={isSelected ? "#3b82f6" : nodeType.borderColor}
          strokeWidth={isSelected ? "3" : "2"}
          onMouseDown={(e) => onNodeMouseDown(e, node)}
          onClick={(e) => {
            e.stopPropagation();
            onNodeClick(node);
          }}
          className="cursor-move transition-all duration-300"
          style={{
            filter: isSelected
              ? "drop-shadow(0 8px 25px rgba(59, 130, 246, 0.15))"
              : "drop-shadow(0 4px 15px rgba(0,0,0,0.1))",
          }}
        />

        {/* Верхняя полоска */}
        <rect width={nodeType.width} height="12" rx="20" fill={nodeType.color} opacity="0.9" />

        {/* Иконка */}
        <circle
          cx="35"
          cy="40"
          r="22"
          fill="white"
          stroke={nodeType.color}
          strokeWidth="2"
          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
        />
        <circle cx="35" cy="40" r="18" fill={nodeType.color} fillOpacity="0.15" />
        <text x="35" y="47" textAnchor="middle" className="text-lg font-bold" fill={nodeType.color}>
          {nodeType.icon}
        </text>

        {/* Заголовок и подпись */}
        <text x="75" y="30" className="text-sm font-bold" fill="#1f2937">
          {node.name?.length > 18 ? node.name.substring(0, 18) + "…" : node.name}
        </text>
        <text x="75" y="45" className="text-xs font-medium" fill="#6b7280">
          {nodeType.label}
        </text>

        {/* Индикаторы ресурсов */}
        <g transform={`translate(75, 55)`}>
          {step?.formulaBomId && (
            <g>
              <rect x="0" y="0" width="10" height="10" rx="5" fill="#059669" />
              <text x="5" y="7" textAnchor="middle" className="text-xs font-bold" fill="white">
                B
              </text>
              <text x="15" y="8" className="text-xs font-medium" fill="#059669">
                {(getBomItemName(step.formulaBomId, formulas, workflow.formulaId || null) || "BOM")
                  .split("(")[0]
                  .substring(0, 10)}
              </text>
            </g>
          )}

          {step?.equipmentId && (
            <g transform={`translate(0, ${step?.formulaBomId ? 15 : 0})`}>
              <rect x="0" y="0" width="10" height="10" rx="5" fill="#7c3aed" />
              <text x="5" y="7" textAnchor="middle" className="text-xs font-bold" fill="white">
                E
              </text>
              <text x="15" y="8" className="text-xs font-medium" fill="#7c3aed">
                {equipment.find((e) => e.id === step.equipmentId)?.name?.substring(0, 10) ||
                  "Equip"}
              </text>
            </g>
          )}
        </g>

        {/* Индикатор режима перехода */}
        {step?.transition && (
          <g transform={`translate(${nodeType.width - 30}, 20)`}>
            <circle
              r="15"
              fill="white"
              stroke={nodeType.borderColor}
              strokeWidth="2"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
            />
            <text x="0" y="5" textAnchor="middle" fontSize="10" fontWeight="bold" fill={nodeType.color}>
              {step.transition.mode === "conditional"
                ? "?"
                : step.transition.mode === "rework"
                ? "R"
                : step.transition.mode === "parallel"
                ? "⫴"
                : step.transition.mode === "manual"
                ? "M"
                : "A"}
            </text>

            {step.transition.mode === "parallel" &&
              Array.isArray(step.parallelTargets) &&
              step.parallelTargets.length > 0 && (
                <g transform="translate(18, -8)">
                  <circle r="6" fill="#10b981" />
                  <text x="0" y="2" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">
                    {step.parallelTargets.length}
                  </text>
                </g>
              )}

            {step.transition.mode === "rework" && step.reworkTargetId && (
              <g transform="translate(18, -8)">
                <circle r="6" fill="#ef4444" />
                <text x="0" y="2" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">
                  ↺
                </text>
              </g>
            )}
          </g>
        )}
      </g>
    );
  };

  // Данные выбранного шага и BOM
  const selectedStep = selectedNode ? stepById(stepIdFromNodeId(selectedNode)) : null;
  const bomItems = workflow.formulaId
    ? getBomItemsForFormula(workflow.formulaId, formulas)
    : [];

  // На каждое обновление рендерим уже "дополненный" workflow
  const enhancedWorkflow = addCustomEdges(workflow);

  // -------------------- Render --------------------
  return (
    <div className="h-full relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Правая панель */}
     {/* Enhanced Right Panel */}
<div className="absolute top-0 right-0 h-full w-[360px] bg-white/95 backdrop-blur-xl border-l border-slate-200 shadow-2xl overflow-y-auto text-xs">
  <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 p-3">
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
        <span className="text-white text-sm font-bold">⚙</span>
      </div>
      <div>
        <div className="font-bold text-sm text-slate-800">Step Configuration</div>
        <div className="text-[11px] text-slate-500">
          {selectedStep ? `Step ${selectedStep.id} - ${selectedStep.name}` : 'Select a step'}
        </div>
      </div>
    </div>
  </div>

  <div className="p-3 space-y-4">
    {!selectedStep ? (
      <div className="text-center py-6 text-slate-500 text-xs">
        👆 Click a step to configure
      </div>
    ) : (
      <>
        {/* ---------- BASIC PROPERTIES ---------- */}
        <div>
          <div className="font-bold text-slate-700 mb-2 border-b pb-1 text-[12px]">Basic Properties</div>
          <label className="block mb-1 font-semibold">Name</label>
          <input
            className="w-full border border-slate-300 rounded px-2 py-1 mb-2 focus:ring focus:ring-blue-300"
            value={selectedStep.name}
            onChange={(e) => updateSelectedStep((s) => ({ ...s, name: e.target.value }))}
          />
          <label className="block mb-1 font-semibold">Type</label>
          <select
            className="w-full border border-slate-300 rounded px-2 py-1 focus:ring focus:ring-blue-300"
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

        {/* ---------- RESOURCES ---------- */}
        <div>
          <div className="font-bold text-slate-700 mb-2 border-b pb-1 text-[12px]">Resources</div>
          <label className="block mb-1 font-semibold">Equipment</label>
          <select
            className="w-full border border-slate-300 rounded px-2 py-1 mb-2 focus:ring focus:ring-blue-300"
            value={selectedStep.equipmentId || ""}
            onChange={(e) => updateSelectedStep((s) => ({ ...s, equipmentId: parseInt(e.target.value) || null }))}
          >
            <option value="">— Select —</option>
            {equipment.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.name}</option>
            ))}
          </select>

          <label className="block mb-1 font-semibold">Work Station</label>
          <select
            className="w-full border border-slate-300 rounded px-2 py-1 focus:ring focus:ring-blue-300"
            value={selectedStep.workStationId || ""}
            onChange={(e) => updateSelectedStep((s) => ({ ...s, workStationId: parseInt(e.target.value) || null }))}
          >
            <option value="">— Select —</option>
            {workStations.map((ws) => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>

          {shouldShowBomDropdown(selectedStep.type) && (
            <>
              <label className="block mt-2 mb-1 font-semibold">BOM Material</label>
              <select
                className="w-full border border-slate-300 rounded px-2 py-1 focus:ring focus:ring-blue-300"
                value={selectedStep.formulaBomId || ""}
                onChange={(e) => updateSelectedStep((s) => ({ ...s, formulaBomId: parseInt(e.target.value) || null }))}
              >
                <option value="">— Select —</option>
                {bomItems.map((bom) => (
                  <option key={bom.id} value={bom.id}>
                    {bom.materialArticle} ({bom.quantity}{bom.unit})
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        {/* ---------- STEP PARAMETERS ---------- */}
        {(selectedStep.type === "dispensing" || selectedStep.type === "weighing" || selectedStep.type === "mixing") && (
          <div>
            <div className="font-bold text-slate-700 mb-2 border-b pb-1 text-[12px]">Step Parameters</div>
            {["dispensing", "weighing"].includes(selectedStep.type) && (
              <>
                <label className="block mb-1 font-semibold">Target Weight</label>
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded px-2 py-1 mb-1"
                  value={selectedStep.stepParameters?.targetWeight || ""}
                  onChange={(e) => updateSelectedStep((s) => ({
                    ...s, stepParameters: { ...(s.stepParameters || {}), targetWeight: parseFloat(e.target.value) || 0 }
                  }))}
                />
                <label className="block mb-1 font-semibold">Tolerance</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border border-slate-300 rounded px-2 py-1 mb-1"
                  value={selectedStep.stepParameters?.tolerance || ""}
                  onChange={(e) => updateSelectedStep((s) => ({
                    ...s, stepParameters: { ...(s.stepParameters || {}), tolerance: parseFloat(e.target.value) || 0 }
                  }))}
                />
                <label className="block mb-1 font-semibold">Unit</label>
                <select
                  className="w-full border border-slate-300 rounded px-2 py-1"
                  value={selectedStep.stepParameters?.unit || "mg"}
                  onChange={(e) => updateSelectedStep((s) => ({
                    ...s, stepParameters: { ...(s.stepParameters || {}), unit: e.target.value }
                  }))}
                >
                  <option value="mg">mg</option>
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                </select>
              </>
            )}

            {selectedStep.type === "mixing" && (
              <>
                <label className="block mb-1 font-semibold">Duration (min)</label>
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded px-2 py-1 mb-1"
                  value={selectedStep.stepParameters?.duration || ""}
                  onChange={(e) => updateSelectedStep((s) => ({
                    ...s, stepParameters: { ...(s.stepParameters || {}), duration: parseInt(e.target.value) || 0 }
                  }))}
                />
                <label className="block mb-1 font-semibold">RPM</label>
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded px-2 py-1 mb-1"
                  value={selectedStep.stepParameters?.rpm || ""}
                  onChange={(e) => updateSelectedStep((s) => ({
                    ...s, stepParameters: { ...(s.stepParameters || {}), rpm: parseInt(e.target.value) || 0 }
                  }))}
                />
                <label className="block mb-1 font-semibold">Temperature (°C)</label>
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded px-2 py-1"
                  value={selectedStep.stepParameters?.temperature || ""}
                  onChange={(e) => updateSelectedStep((s) => ({
                    ...s, stepParameters: { ...(s.stepParameters || {}), temperature: parseInt(e.target.value) || 20 }
                  }))}
                />
              </>
            )}
          </div>
        )}

        {/* ---------- QC PARAMETERS ---------- */}
        {selectedStep.type === "qc" && (
          <div>
            <div className="font-bold text-slate-700 mb-2 border-b pb-1 text-[12px]">QC Parameters</div>
            <label className="block mb-1 font-semibold">Parameter</label>
            <input
              className="w-full border border-slate-300 rounded px-2 py-1 mb-1"
              value={selectedStep.qcParameters?.parameter || ""}
              onChange={(e) => updateSelectedStep((s) => ({
                ...s, qcParameters: { ...(s.qcParameters || {}), parameter: e.target.value }
              }))}
            />
            <label className="block mb-1 font-semibold">Min</label>
            <input
              type="number"
              className="w-full border border-slate-300 rounded px-2 py-1 mb-1"
              value={selectedStep.qcParameters?.min || ""}
              onChange={(e) => updateSelectedStep((s) => ({
                ...s, qcParameters: { ...(s.qcParameters || {}), min: parseFloat(e.target.value) }
              }))}
            />
            <label className="block mb-1 font-semibold">Max</label>
            <input
              type="number"
              className="w-full border border-slate-300 rounded px-2 py-1 mb-1"
              value={selectedStep.qcParameters?.max || ""}
              onChange={(e) => updateSelectedStep((s) => ({
                ...s, qcParameters: { ...(s.qcParameters || {}), max: parseFloat(e.target.value) }
              }))}
            />
          </div>
        )}

        {/* ---------- TRANSITION SETTINGS ---------- */}
        <div>
          <div className="font-bold text-slate-700 mb-2 border-b pb-1 text-[12px]">Transition Settings</div>
          <label className="block mb-1 font-semibold">Mode</label>
          <select
            className="w-full border border-slate-300 rounded px-2 py-1 mb-2"
            value={selectedStep.transition?.mode || "automatic"}
            onChange={(e) => updateSelectedStep((s) => ({
              ...s, transition: { ...(s.transition || {}), mode: e.target.value }
            }))}
          >
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
            <option value="conditional">Conditional</option>
            <option value="rework">Rework</option>
            <option value="parallel">Parallel</option>
          </select>

          {["automatic", "manual", "conditional"].includes(selectedStep.transition?.mode || "automatic") && (
            <>
              <label className="block mb-1 font-semibold">Next Step</label>
              <select
                className="w-full border border-slate-300 rounded px-2 py-1 mb-1"
                value={selectedStep.nextStepId || ""}
                onChange={(e) => updateSelectedStep((s) => ({
                  ...s, nextStepId: e.target.value ? parseInt(e.target.value) : null
                }))}
              >
                <option value="">(Sequential)</option>
                {stepsOptions().filter((o) => o.value !== selectedStep.id).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </>
          )}

          {selectedStep.transition?.mode === "rework" && (
            <>
              <label className="block mb-1 font-semibold">Rework Target</label>
              <select
                className="w-full border border-slate-300 rounded px-2 py-1"
                value={selectedStep.reworkTargetId || ""}
                onChange={(e) => updateSelectedStep((s) => ({
                  ...s, reworkTargetId: e.target.value ? parseInt(e.target.value) : null
                }))}
              >
                <option value="">— Select —</option>
                {stepsOptions().filter((o) => o.value !== selectedStep.id).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </>
          )}

          {selectedStep.transition?.mode === "parallel" && (
            <div>
              <label className="block mb-1 font-semibold">Parallel Targets</label>
              {stepsOptions().filter((o) => o.value !== selectedStep.id).map((o) => {
                const selected = selectedStep.parallelTargets?.includes(o.value);
                return (
                  <label key={o.value} className="flex items-center space-x-2 mb-1">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => updateSelectedStep((s) => {
                        const set = new Set(s.parallelTargets || []);
                        e.target.checked ? set.add(o.value) : set.delete(o.value);
                        return { ...s, parallelTargets: Array.from(set) };
                      })}
                      className="w-3 h-3 text-blue-600 border-gray-300 rounded"
                    />
                    <span>{o.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </>
    )}
  </div>
</div>



      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-default"
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onClick={onCanvasClick}
        style={{ backgroundColor: "transparent", paddingRight: "450px" }}
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Arrow markers */}
          <marker id="arrowhead" markerWidth="12" markerHeight="8" refX="11" refY="4" orient="auto" fill="#64748b">
            <polygon points="0 0, 12 4, 0 8" />
          </marker>
          <marker
            id="arrowhead-parallel"
            markerWidth="14"
            markerHeight="10"
            refX="13"
            refY="5"
            orient="auto"
            fill="#10b981"
          >
            <polygon points="0 0, 14 5, 0 10" />
          </marker>
          <marker
            id="arrowhead-rework"
            markerWidth="14"
            markerHeight="10"
            refX="13"
            refY="5"
            orient="auto"
            fill="#ef4444"
          >
            <polygon points="0 0, 14 5, 0 10" />
          </marker>

          {/* Gradients per node type */}
          {Object.entries(nodeTypes).map(([type, config]) => {
            const [c1, c2] = config.bgColor.match(/#[a-f0-9]{6}/gi) || ["#f8fafc", "#e2e8f0"];
            return (
              <linearGradient key={type} id={`gradient-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={c1} />
                <stop offset="100%" stopColor={c2} />
              </linearGradient>
            );
          })}

          {/* Grid pattern */}
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f1f5f9" strokeWidth="1" opacity="0.4" />
          </pattern>
        </defs>

        {/* Grid */}
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Edges */}
        {(enhancedWorkflow.edges || []).map(renderEdge)}

        {/* Nodes */}
        {(workflow.nodes || []).map(renderNode)}
      </svg>
    </div>
  );
}
