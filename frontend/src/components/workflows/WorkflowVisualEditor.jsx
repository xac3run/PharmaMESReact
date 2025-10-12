import React, { useState, useRef } from "react";
import { stepsToGraph } from "./WorkflowUtils";

/* -------------------------------------------------------------------------- */
/*                     VISUAL WORKFLOW EDITOR (SVG DRAG&DROP)                 */
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
  const [transitionUi, setTransitionUi] = useState({
    mode: "automatic",
    nextStepId: "",
    reworkTargetId: "",
    parallelTargets: [],
    condition: {
      type: "qc_result",
      qcParam: "weight",
      expected: "pass",
      minutes: 10,
      signalCode: "",
      formula: "",
    },
  });

  // -------------------- типы узлов --------------------
  const nodeTypes = {
    start: { color: "#059669", bgColor: "#d1fae5", borderColor: "#34d399", label: "Старт", width: 140, height: 60 },
    weighing: { color: "#7c3aed", bgColor: "#e9d5ff", borderColor: "#a78bfa", label: "Взвешивание", width: 140, height: 80 },
    dispensing: { color: "#dc2626", bgColor: "#fecaca", borderColor: "#f87171", label: "Дозирование", width: 140, height: 80 },
    mixing: { color: "#2563eb", bgColor: "#dbeafe", borderColor: "#60a5fa", label: "Смешивание", width: 140, height: 80 },
    qc_check: { color: "#ea580c", bgColor: "#fed7aa", borderColor: "#fdba74", label: "QC Проверка", width: 140, height: 80 },
    decision: { color: "#7c2d12", bgColor: "#fde68a", borderColor: "#fbbf24", label: "Условие", width: 120, height: 80 },
    rework: { color: "#991b1b", bgColor: "#fecaca", borderColor: "#f87171", label: "Переработка", width: 140, height: 80 },
    equipment_check: { color: "#166534", bgColor: "#bbf7d0", borderColor: "#86efac", label: "Проверка оборудования", width: 160, height: 80 },
    hold: { color: "#92400e", bgColor: "#fef3c7", borderColor: "#fcd34d", label: "Ожидание", width: 140, height: 80 },
    end: { color: "#4b5563", bgColor: "#f3f4f6", borderColor: "#d1d5db", label: "Конец", width: 140, height: 60 },
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
    };

    const movedStepId = stepIdFromNodeId(draggingNodeId);
    if (movedStepId) {
      updated.steps = (workflow.steps || []).map((s) =>
        s.id === movedStepId ? { ...s, position: { x: newX, y: newY } } : s
      );
    }

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
    const sid = stepIdFromNodeId(node.id);
    if (!sid) return;
    const st = stepById(sid);
    setTransitionUi({
      mode: st?.transition?.mode || "automatic",
      nextStepId: st?.nextStepId || "",
      reworkTargetId: st?.reworkTargetId || "",
      parallelTargets: st?.parallelTargets || [],
      condition: {
        type: st?.transition?.condition?.type || "qc_result",
        qcParam: st?.transition?.condition?.qcParam || "weight",
        expected: st?.transition?.condition?.expected || "pass",
        minutes: st?.transition?.condition?.minutes || 10,
        signalCode: st?.transition?.condition?.signalCode || "",
        formula: st?.transition?.condition?.formula || "",
      },
    });
  };

  const onEdgeClick = (edge) => {
    setSelectedEdge(edge.id);
    setSelectedNode(null);
  };

  // -------------------- APPLY/RESET --------------------
  const applyTransition = () => {
    if (!selectedNode) return;
    const sid = stepIdFromNodeId(selectedNode);
    if (!sid) return;

    const updatedSteps = (workflow.steps || []).map((s) => {
      if (s.id !== sid) return s;
      const next = { ...s, transition: { ...s.transition, ...transitionUi } };
      if (["automatic", "manual", "conditional"].includes(transitionUi.mode))
        next.nextStepId = parseInt(transitionUi.nextStepId) || null;
      if (transitionUi.mode === "rework")
        next.reworkTargetId = parseInt(transitionUi.reworkTargetId) || null;
      if (transitionUi.mode === "parallel")
        next.parallelTargets = transitionUi.parallelTargets.map((x) => parseInt(x, 10));
      return next;
    });

    const newWf = stepsToGraph({ ...workflow, steps: updatedSteps });
    const merged = mergePositions(workflow, newWf);
    onWorkflowChange(merged);
  };

  const clearTransitions = () => {
    if (!selectedNode) return;
    const sid = stepIdFromNodeId(selectedNode);
    if (!sid) return;

    const updatedSteps = (workflow.steps || []).map((s) =>
      s.id === sid
        ? {
            ...s,
            nextStepId: null,
            reworkTargetId: null,
            parallelTargets: [],
            transition: {
              mode: "automatic",
              condition: {
                type: "qc_result",
                qcParam: "weight",
                expected: "pass",
                minutes: 10,
                signalCode: "",
                formula: "",
              },
            },
          }
        : s
    );

    const newWf = stepsToGraph({ ...workflow, steps: updatedSteps });
    const merged = mergePositions(workflow, newWf);
    onWorkflowChange(merged);
  };

  // -------------------- Рендер edges --------------------
  const renderEdge = (edge) => {
    const sourceNode = nodeById(edge.source);
    const targetNode = nodeById(edge.target);
    if (!sourceNode || !targetNode) return null;

    const sourceType = nodeTypes[sourceNode.type] || { width: 140, height: 80 };
    const targetType = nodeTypes[targetNode.type] || { width: 140, height: 80 };
    const x1 = sourceNode.position.x + sourceType.width / 2;
    const y1 = sourceNode.position.y + sourceType.height;
    const x2 = targetNode.position.x + targetType.width / 2;
    const y2 = targetNode.position.y;

    let edgeColor = "#64748b";
    let dash = "none";
    if (edge.type === "conditional") { edgeColor = "#f59e0b"; dash = "8,4"; }
    if (edge.type === "rework") { edgeColor = "#ef4444"; dash = "4,3"; }
    if (edge.type === "parallel") { edgeColor = "#2563eb"; dash = "2,3"; }

    return (
      <g key={edge.id}>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={edgeColor}
          strokeWidth={selectedEdge === edge.id ? "4" : "2"}
          markerEnd="url(#arrowhead)"
          strokeDasharray={dash}
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onEdgeClick(edge);
          }}
        />
        {edge.label && (
          <text
            x={(x1 + x2) / 2}
            y={(y1 + y2) / 2 - 4}
            textAnchor="middle"
            fill={edgeColor}
            className="text-xs"
          >
            {edge.label}
          </text>
        )}
      </g>
    );
  };

  // -------------------- Рендер узлов --------------------
  const renderNode = (node) => {
    const nodeType = nodeTypes[node.type] || {
      width: 140,
      height: 80,
      bgColor: "#fff",
      borderColor: "#e5e7eb",
      color: "#94a3b8",
    };
    const isSelected = selectedNode === node.id;

    return (
      <g key={node.id} transform={`translate(${node.position.x}, ${node.position.y})`}>
        <rect
          width={nodeType.width}
          height={nodeType.height}
          rx="12"
          fill={nodeType.bgColor}
          stroke={isSelected ? "#3b82f6" : nodeType.borderColor}
          strokeWidth={isSelected ? "3" : "2"}
          onMouseDown={(e) => onNodeMouseDown(e, node)}
          onClick={(e) => {
            e.stopPropagation();
            onNodeClick(node);
          }}
          className="cursor-move"
        />
        <text
          x={nodeType.width / 2}
          y="40"
          textAnchor="middle"
          className="text-sm font-semibold pointer-events-none"
          fill="#374151"
        >
          {node.name}
        </text>
      </g>
    );
  };

  // -------------------- Render --------------------
  return (
    <div className="h-full relative overflow-hidden">
      {/* Правая панель */}
      <div className="absolute top-0 right-0 h-full w-80 bg-white border-l border-slate-200 p-4 overflow-y-auto">
        <div className="font-semibold text-slate-800 mb-2">Настройки переходов</div>
        {!selectedNode && <div className="text-xs text-slate-500">Выберите узел.</div>}
        {selectedNode && (
          <>
            <label className="block text-xs mb-1">Transition Mode</label>
            <select
              className="w-full border rounded px-2 py-1 text-xs mb-3"
              value={transitionUi.mode}
              onChange={(e) => setTransitionUi((p) => ({ ...p, mode: e.target.value }))}
            >
              <option value="automatic">automatic</option>
              <option value="manual">manual</option>
              <option value="conditional">conditional</option>
              <option value="rework">rework</option>
              <option value="parallel">parallel</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={applyTransition}
                className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
              >
                Применить
              </button>
              <button
                onClick={clearTransitions}
                className="bg-slate-200 text-slate-700 text-xs px-3 py-1 rounded hover:bg-slate-300"
              >
                Очистить
              </button>
            </div>
          </>
        )}
      </div>

      {/* Канвас */}
      <div
        className="h-full w-[calc(100%-20rem)] overflow-auto"
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        <svg
          ref={svgRef}
          className="w-full min-h-full"
          style={{ minHeight: "1200px", minWidth: "1000px" }}
          onClick={onCanvasClick}
        >
          <defs>
            <marker id="arrowhead" markerWidth="12" markerHeight="8" refX="11" refY="4" orient="auto">
              <polygon points="0 0, 12 4, 0 8" fill="#64748b" />
            </marker>
          </defs>

          {(workflow.edges || []).map(renderEdge)}
          {(workflow.nodes || []).map(renderNode)}
        </svg>
      </div>
    </div>
  );
}
