import React from 'react';
import { Plus, Trash2, Save, CheckCircle, ChevronDown, ChevronUp, Eye, Edit3, GitBranch, Play, Square, Circle, Settings, Diamond } from 'lucide-react';

// Встроенный визуальный редактор для Pharma workflow
const VisualWorkflowEditor = ({ 
  workflow = {}, 
  onWorkflowChange = () => {}, 
  formulas = [], 
  equipment = [], 
  workStations = [] 
}) => {
  const [selectedNode, setSelectedNode] = React.useState(null);
  const [selectedEdge, setSelectedEdge] = React.useState(null);
  const [draggedNode, setDraggedNode] = React.useState(null);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [connectionStart, setConnectionStart] = React.useState(null);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [editMode, setEditMode] = React.useState('select');
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const svgRef = React.useRef(null);

  // Pharma-специфичные типы узлов
  const nodeTypes = {
    start: { color: '#059669', bgColor: '#d1fae5', borderColor: '#34d399', label: 'Старт', width: 140, height: 60 },
    weighing: { color: '#7c3aed', bgColor: '#e9d5ff', borderColor: '#a78bfa', label: 'Взвешивание', width: 140, height: 80 },
    dispensing: { color: '#dc2626', bgColor: '#fecaca', borderColor: '#f87171', label: 'Дозирование', width: 140, height: 80 },
    mixing: { color: '#2563eb', bgColor: '#dbeafe', borderColor: '#60a5fa', label: 'Смешивание', width: 140, height: 80 },
    qc_check: { color: '#ea580c', bgColor: '#fed7aa', borderColor: '#fdba74', label: 'QC Проверка', width: 140, height: 80 },
    decision: { color: '#7c2d12', bgColor: '#fde68a', borderColor: '#fbbf24', label: 'Условие', width: 120, height: 80 },
    rework: { color: '#991b1b', bgColor: '#fecaca', borderColor: '#f87171', label: 'Переработка', width: 140, height: 80 },
    equipment_check: { color: '#166534', bgColor: '#bbf7d0', borderColor: '#86efac', label: 'Проверка оборудования', width: 160, height: 80 },
    hold: { color: '#92400e', bgColor: '#fef3c7', borderColor: '#fcd34d', label: 'Ожидание', width: 140, height: 80 },
    end: { color: '#4b5563', bgColor: '#f3f4f6', borderColor: '#d1d5db', label: 'Конец', width: 140, height: 60 }
  };

  // Добавление нового узла
  const addNode = (type) => {
    const nodeType = nodeTypes[type];
    let yPosition = 100;
    
    // Находим самый нижний узел для вертикального размещения
    if (workflow.nodes && workflow.nodes.length > 0) {
      const maxY = Math.max(...workflow.nodes.map(n => n.position.y));
      yPosition = maxY + 120;
    }

    const newNode = {
      id: `node_${Date.now()}`,
      type,
      name: `${nodeType.label} ${workflow.nodes?.length || 1}`,
      position: { x: 400, y: yPosition },
      data: {
        // Pharma-специфичные параметры по умолчанию
        ...(type === 'weighing' && {
          target_weight: 100,
          tolerance: 0.1,
          unit: 'g',
          equipmentId: null
        }),
        ...(type === 'qc_check' && {
          qc_type: 'weight',
          qcParameters: { min: 99.9, max: 100.1, unit: '%' }
        }),
        ...(type === 'decision' && {
          condition: {
            type: 'qc_result',
            qc_parameter: 'weight',
            expected_result: 'pass'
          }
        }),
        ...(type === 'rework' && {
          max_iterations: 3,
          rework_procedure: 'Повторить процесс с корректировкой параметров'
        }),
        ...(type === 'hold' && {
          hold_type: 'time',
          hold_duration: 10
        })
      }
    };

    onWorkflowChange({
      ...workflow,
      nodes: [...(workflow.nodes || []), newNode]
    });
  };

  // Создание параллельных веток
  const createParallelBranches = () => {
    if (!selectedNode) {
      alert('Выберите узел для создания параллельных веток');
      return;
    }

    const selectedNodeObj = (workflow.nodes || []).find(n => n.id === selectedNode);
    if (!selectedNodeObj) return;

    const branch1 = {
      id: `node_${Date.now()}`,
      type: "weighing",
      name: "Параллельная ветка A",
      position: { x: selectedNodeObj.position.x - 100, y: selectedNodeObj.position.y + 120 },
      data: { target_weight: 50, tolerance: 0.1 }
    };

    const branch2 = {
      id: `node_${Date.now() + 1}`,
      type: "dispensing",
      name: "Параллельная ветка B", 
      position: { x: selectedNodeObj.position.x + 100, y: selectedNodeObj.position.y + 120 },
      data: {}
    };

    const merge = {
      id: `node_${Date.now() + 2}`,
      type: "qc_check",
      name: "Контроль слияния",
      position: { x: selectedNodeObj.position.x, y: selectedNodeObj.position.y + 240 },
      data: { qc_type: 'visual' }
    };

    const newEdges = [
      {
        id: `edge_${Date.now()}`,
        source: selectedNode,
        target: branch1.id,
        type: 'default',
        label: 'Ветка A'
      },
      {
        id: `edge_${Date.now() + 1}`,
        source: selectedNode,
        target: branch2.id,
        type: 'default',
        label: 'Ветка B'
      },
      {
        id: `edge_${Date.now() + 2}`,
        source: branch1.id,
        target: merge.id,
        type: 'default',
        label: ''
      },
      {
        id: `edge_${Date.now() + 3}`,
        source: branch2.id,
        target: merge.id,
        type: 'default',
        label: ''
      }
    ];

    onWorkflowChange({
      ...workflow,
      nodes: [...(workflow.nodes || []), branch1, branch2, merge],
      edges: [...(workflow.edges || []), ...newEdges]
    });
  };

  // Создание Rework петли
  const createReworkLoop = () => {
    if (!selectedNode) {
      alert('Выберите узел для создания Rework петли');
      return;
    }

    const selectedNodeObj = (workflow.nodes || []).find(n => n.id === selectedNode);
    if (!selectedNodeObj) return;

    const qcCheck = {
      id: `node_${Date.now()}`,
      type: "qc_check",
      name: "QC Проверка",
      position: { x: selectedNodeObj.position.x, y: selectedNodeObj.position.y + 120 },
      data: { qc_type: 'weight' }
    };

    const decision = {
      id: `node_${Date.now() + 1}`,
      type: "decision",
      name: "Результат OK?",
      position: { x: selectedNodeObj.position.x, y: selectedNodeObj.position.y + 220 },
      data: {
        condition: {
          type: 'qc_result',
          qc_parameter: 'weight',
          expected_result: 'pass'
        }
      }
    };

    const rework = {
      id: `node_${Date.now() + 2}`,
      type: "rework", 
      name: "Переработка",
      position: { x: selectedNodeObj.position.x + 180, y: selectedNodeObj.position.y + 120 },
      data: {
        max_iterations: 3,
        rework_procedure: 'Повторить с корректировкой параметров'
      }
    };

    const newEdges = [
      {
        id: `edge_${Date.now()}`,
        source: selectedNode,
        target: qcCheck.id,
        type: 'default',
        label: ''
      },
      {
        id: `edge_${Date.now() + 1}`,
        source: qcCheck.id,
        target: decision.id,
        type: 'default',
        label: ''
      },
      {
        id: `edge_${Date.now() + 2}`,
        source: decision.id,
        target: rework.id,
        type: 'conditional',
        label: 'Fail',
        condition: 'qc_result === "fail"'
      },
      {
        id: `edge_${Date.now() + 3}`,
        source: rework.id,
        target: selectedNode,
        type: 'default',
        label: 'Rework'
      }
    ];

    onWorkflowChange({
      ...workflow,
      nodes: [...(workflow.nodes || []), qcCheck, decision, rework],
      edges: [...(workflow.edges || []), ...newEdges]
    });
  };

  // Обработка перетаскивания узла
  const handleNodeMouseDown = (e, node) => {
    if (editMode !== 'select') return;
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setDragOffset({
      x: e.clientX - rect.left - node.position.x,
      y: e.clientY - rect.top - node.position.y
    });
    setDraggedNode(node.id);
  };

  const handleMouseMove = (e) => {
    if (!draggedNode || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    onWorkflowChange({
      ...workflow,
      nodes: (workflow.nodes || []).map(node =>
        node.id === draggedNode
          ? { ...node, position: { x: newX, y: newY } }
          : node
      )
    });
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  // Обработка кликов на узлы
  const handleNodeClick = (node) => {
    if (editMode === 'select') {
      setSelectedNode(node.id);
      setSelectedEdge(null);
    } else if (editMode === 'connect') {
      handleConnectionStart(node.id);
    } else if (editMode === 'delete') {
      if (node.type !== 'start' && node.type !== 'end') {
        deleteNode(node.id);
      }
    }
  };

  // Создание связей
  const handleConnectionStart = (nodeId) => {
    if (editMode !== 'connect') return;

    if (isConnecting) {
      if (connectionStart && connectionStart !== nodeId) {
        const newEdge = {
          id: `edge_${Date.now()}`,
          source: connectionStart,
          target: nodeId,
          type: 'default',
          label: ''
        };

        onWorkflowChange({
          ...workflow,
          edges: [...(workflow.edges || []), newEdge]
        });
      }
      setIsConnecting(false);
      setConnectionStart(null);
    } else {
      setIsConnecting(true);
      setConnectionStart(nodeId);
    }
  };

  // Удаление узла
  const deleteNode = (nodeId) => {
    onWorkflowChange({
      ...workflow,
      nodes: (workflow.nodes || []).filter(n => n.id !== nodeId),
      edges: (workflow.edges || []).filter(e => e.source !== nodeId && e.target !== nodeId)
    });
    setSelectedNode(null);
  };

  // Удаление связи
  const deleteEdge = (edgeId) => {
    onWorkflowChange({
      ...workflow,
      edges: (workflow.edges || []).filter(e => e.id !== edgeId)
    });
    setSelectedEdge(null);
  };

  // Рендер узла
  const renderNode = (node) => {
    const nodeType = nodeTypes[node.type];
    const isSelected = selectedNode === node.id;
    const isConnectingFrom = connectionStart === node.id;

    if (!nodeType) return null;

    return (
      <g key={node.id} transform={`translate(${node.position.x}, ${node.position.y})`}>
        {/* Тень узла */}
        <rect
          width={nodeType.width}
          height={nodeType.height}
          rx="12"
          fill="#00000015"
          transform="translate(3, 3)"
        />
        
        {/* Основной узел */}
        <rect
          width={nodeType.width}
          height={nodeType.height}
          rx="12"
          fill={nodeType.bgColor}
          stroke={isSelected ? '#3b82f6' : isConnectingFrom ? '#10b981' : nodeType.borderColor}
          strokeWidth={isSelected || isConnectingFrom ? '3' : '2'}
          className="cursor-move transition-all duration-200"
          onMouseDown={(e) => handleNodeMouseDown(e, node)}
          onClick={() => handleNodeClick(node)}
        />
        
        {/* Цветная полоска сверху */}
        <rect
          width={nodeType.width}
          height="4"
          rx="12"
          fill={nodeType.color}
        />
        
        {/* Иконка и тип */}
        <g transform="translate(12, 16)">
          <circle r="16" fill={nodeType.color} fillOpacity="0.2" />
          <text x="16" y="20" textAnchor="middle" className="text-sm font-bold" fill={nodeType.color}>
            {node.type === 'start' ? '▶' : 
             node.type === 'end' ? '■' :
             node.type === 'weighing' ? '⚖' :
             node.type === 'qc_check' ? '🔍' :
             node.type === 'dispensing' ? '⚗' :
             node.type === 'mixing' ? '🌀' :
             node.type === 'decision' ? '◆' : 
             node.type === 'rework' ? '🔄' :
             node.type === 'equipment_check' ? '🔧' :
             node.type === 'hold' ? '⏸' : '⚙'}
          </text>
        </g>
        
        {/* Название */}
        <text
          x={nodeType.width / 2}
          y="40"
          textAnchor="middle"
          className="text-sm font-semibold pointer-events-none"
          fill="#374151"
        >
          {node.name.length > 16 ? node.name.substring(0, 16) + '...' : node.name}
        </text>
        
        {/* Параметры узла */}
        {node.data && Object.keys(node.data).length > 0 && (
          <text
            x={nodeType.width / 2}
            y="56"
            textAnchor="middle"
            className="text-xs pointer-events-none"
            fill="#6b7280"
          >
            {node.type === 'weighing' && `${node.data.target_weight || 0}g ±${node.data.tolerance || 0}%`}
            {node.type === 'qc_check' && `${node.data.qc_type || 'check'}`}
            {node.type === 'decision' && `${node.data.condition?.type || 'condition'}`}
            {node.type === 'rework' && `max: ${node.data.max_iterations || 3}`}
            {node.type === 'hold' && `${node.data.hold_duration || 10}min`}
          </text>
        )}
        
        {/* Точки подключения */}
        <circle
          cx={nodeType.width / 2}
          cy="0"
          r="8"
          fill="white"
          stroke={nodeType.color}
          strokeWidth="2"
          className="cursor-pointer hover:fill-blue-50"
          onClick={(e) => {
            e.stopPropagation();
            if (editMode === 'connect') handleConnectionStart(node.id);
          }}
        />
        <circle
          cx={nodeType.width / 2}
          cy={nodeType.height}
          r="8"
          fill="white"
          stroke={nodeType.color}
          strokeWidth="2"
          className="cursor-pointer hover:fill-blue-50"
          onClick={(e) => {
            e.stopPropagation();
            if (editMode === 'connect') handleConnectionStart(node.id);
          }}
        />
        
        {/* Индикатор выбора */}
        {isSelected && (
          <circle
            cx={nodeType.width - 10}
            cy="10"
            r="4"
            fill="#3b82f6"
            className="animate-pulse"
          />
        )}
      </g>
    );
  };

  // Рендер связи
  const renderEdge = (edge) => {
    const sourceNode = (workflow.nodes || []).find(n => n.id === edge.source);
    const targetNode = (workflow.nodes || []).find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return null;

    const sourceType = nodeTypes[sourceNode.type];
    const targetType = nodeTypes[targetNode.type];
    
    const x1 = sourceNode.position.x + (sourceType?.width || 140) / 2;
    const y1 = sourceNode.position.y + (sourceType?.height || 80);
    const x2 = targetNode.position.x + (targetType?.width || 140) / 2;
    const y2 = targetNode.position.y;

    const isSelected = selectedEdge === edge.id;
    const edgeColor = edge.type === 'conditional' ? '#f59e0b' :
                     edge.type === 'error' ? '#ef4444' :
                     isSelected ? '#3b82f6' : '#64748b';

    return (
      <g key={edge.id}>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={edgeColor}
          strokeWidth={isSelected ? "4" : "2"}
          markerEnd="url(#arrowhead)"
          className="cursor-pointer"
          strokeDasharray={edge.type === 'conditional' ? '8,4' : 'none'}
          onClick={(e) => {
            e.stopPropagation();
            if (editMode === 'select') {
              setSelectedEdge(edge.id);
              setSelectedNode(null);
            } else if (editMode === 'delete') {
              deleteEdge(edge.id);
            }
          }}
        />
        
        {edge.label && (
          <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
            <rect
              x="-20"
              y="-8"
              width="40"
              height="16"
              rx="8"
              fill="white"
              stroke={edgeColor}
              strokeWidth="1"
            />
            <text
              x="0"
              y="0"
              textAnchor="middle"
              alignmentBaseline="central"
              className="text-xs font-medium"
              fill={edgeColor}
            >
              {edge.label}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-slate-50 to-white">
      {/* Панель инструментов */}
      <div className="w-80 bg-white border-r border-slate-200 p-6 space-y-6 overflow-y-auto">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-lg text-slate-800">Pharma Process Designer</h3>
        </div>
        
        {/* Панель режимов */}
        <div className="bg-slate-50 rounded-xl p-4">
          <h4 className="font-medium text-sm text-slate-700 mb-3">Режим работы</h4>
          <div className="space-y-2">
            {[
              { mode: 'select', label: 'Выбор/Перемещение', emoji: '🎯', color: 'blue' },
              { mode: 'connect', label: 'Создание связей', emoji: '🔗', color: 'emerald' },
              { mode: 'delete', label: 'Удаление', emoji: '🗑️', color: 'red' }
            ].map(({ mode, label, emoji, color }) => (
              <button
                key={mode}
                onClick={() => {
                  setEditMode(mode);
                  setIsConnecting(false);
                  setConnectionStart(null);
                }}
                className={`w-full p-3 text-left rounded-lg transition-all duration-200 border-2 ${
                  editMode === mode 
                    ? `bg-${color}-50 text-${color}-700 border-${color}-200 shadow-sm` 
                    : 'hover:bg-slate-100 text-slate-600 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{emoji}</span>
                  <span className="font-medium text-sm">{label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Элементы процесса */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-slate-700 mb-3">Элементы процесса</h4>
          {Object.entries(nodeTypes).map(([type, config]) => (
            <button
              key={type}
              onClick={() => addNode(type)}
              className="w-full p-3 rounded-lg text-white font-medium flex items-center space-x-3 hover:opacity-90 transition-all duration-200 shadow-md border-2 border-white/30"
              style={{ 
                backgroundColor: config.color,
                boxShadow: `0 4px 12px ${config.color}20`
              }}
            >
              <span className="text-lg bg-white/30 w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                {type === 'start' ? '▶' : 
                 type === 'end' ? '■' :
                 type === 'weighing' ? '⚖' :
                 type === 'qc_check' ? '🔍' :
                 type === 'dispensing' ? '⚗' :
                 type === 'mixing' ? '🌀' :
                 type === 'decision' ? '◆' : 
                 type === 'rework' ? '🔄' :
                 type === 'equipment_check' ? '🔧' :
                 type === 'hold' ? '⏸' : '⚙'}
              </span>
              <span className="text-sm font-semibold">{config.label}</span>
            </button>
          ))}
        </div>

        {/* Pharma шаблоны */}
        <div className="bg-slate-50 rounded-xl p-4">
          <h4 className="font-medium text-sm text-slate-700 mb-3">Pharma Шаблоны</h4>
          <div className="space-y-2">
            <button
              onClick={createParallelBranches}
              className="w-full p-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 text-sm font-medium"
            >
              Параллельные ветки
            </button>
            <button
              onClick={createReworkLoop}
              className="w-full p-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 text-sm font-medium"
            >
              Rework петля
            </button>
          </div>
        </div>

        {/* Настройки выбранного элемента */}
        {selectedNode && (
          <NodePropertiesPanel 
            node={(workflow.nodes || []).find(n => n.id === selectedNode)}
            formulas={formulas}
            equipment={equipment}
            workStations={workStations}
            onNodeUpdate={(updatedNode) => {
              onWorkflowChange({
                ...workflow,
                nodes: (workflow.nodes || []).map(n => 
                  n.id === selectedNode ? updatedNode : n
                )
              });
            }}
            onDelete={() => deleteNode(selectedNode)}
          />
        )}

        {/* Панель редактирования связи */}
        {selectedEdge && (
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="font-semibold text-slate-800 mb-4">Настройки связи</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Название связи</label>
                <input
                  type="text"
                  value={(workflow.edges || []).find(e => e.id === selectedEdge)?.label || ''}
                  onChange={(e) => {
                    onWorkflowChange({
                      ...workflow,
                      edges: (workflow.edges || []).map(edge =>
                        edge.id === selectedEdge ? { ...edge, label: e.target.value } : edge
                      )
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Pass, Fail, Rework..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Тип связи</label>
                <select
                  value={(workflow.edges || []).find(e => e.id === selectedEdge)?.type || 'default'}
                  onChange={(e) => {
                    onWorkflowChange({
                      ...workflow,
                      edges: (workflow.edges || []).map(edge =>
                        edge.id === selectedEdge ? { ...edge, type: e.target.value } : edge
                      )
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="default">Обычная</option>
                  <option value="conditional">Условная</option>
                  <option value="error">Ошибка</option>
                </select>
              </div>
              
              <button
                onClick={() => deleteEdge(selectedEdge)}
                className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium"
              >
                Удалить связь
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Холст для рисования с прокруткой */}
      <div className="flex-1 relative overflow-auto">
        <svg
          ref={svgRef}
          className="w-full min-h-full"
          style={{ minHeight: '2000px', minWidth: '1200px' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={() => {
            if (isConnecting) {
              setIsConnecting(false);
              setConnectionStart(null);
            }
            setSelectedNode(null);
            setSelectedEdge(null);
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="12"
              markerHeight="8"
              refX="11"
              refY="4"
              orient="auto"
            >
              <polygon
                points="0 0, 12 4, 0 8"
                fill="#64748b"
              />
            </marker>

            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
            </pattern>
            
            <pattern id="gridLarge" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
            </pattern>
          </defs>

          {/* Фоновые сетки */}
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#gridLarge)" />

          {/* Рендер связей */}
          {(workflow.edges || []).map(renderEdge)}

          {/* Рендер узлов */}
          {(workflow.nodes || []).map(renderNode)}
        </svg>

        {/* Статусная панель */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-4 py-2 shadow-lg">
          <div className="flex items-center space-x-4 text-sm text-slate-600">
            <span>Узлов: {(workflow.nodes || []).length}</span>
            <span>Связей: {(workflow.edges || []).length}</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                editMode === 'select' ? 'bg-blue-500' :
                editMode === 'connect' ? 'bg-emerald-500' :
                'bg-red-500'
              }`}></div>
              <span className="capitalize">{
                editMode === 'select' ? 'Выбор' :
                editMode === 'connect' ? 'Связи' : 'Удаление'
              }</span>
            </div>
          </div>
        </div>

        {/* Индикаторы режима работы */}
        {editMode === 'connect' && isConnecting && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-medium">Выберите целевой узел для соединения</span>
            </div>
          </div>
        )}
        {editMode === 'delete' && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg">
            <span>Режим удаления: кликните на элемент</span>
          </div>
        )}
        {editMode === 'select' && selectedNode && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg">
            <span>Выбран: {(workflow.nodes || []).find(n => n.id === selectedNode)?.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Панель свойств узла с полными Pharma параметрами
const NodePropertiesPanel = ({ 
  node = null, 
  formulas = [], 
  equipment = [], 
  workStations = [], 
  onNodeUpdate = () => {}, 
  onDelete = () => {} 
}) => {
  if (!node) return null;

  const updateNodeData = (newData) => {
    onNodeUpdate({
      ...node,
      data: { ...node.data, ...newData }
    });
  };

  const updateNodeName = (name) => {
    onNodeUpdate({ ...node, name });
  };

  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-blue-600 text-sm">⚙</span>
        </div>
        <h4 className="font-semibold text-slate-800">Настройки узла</h4>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Название</label>
          <input
            type="text"
            value={node.name}
            onChange={(e) => updateNodeName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>

        {/* Параметры взвешивания */}
        {node.type === 'weighing' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Материал для взвешивания</label>
              <select
                value={node.data?.materialId || ''}
                onChange={(e) => updateNodeData({ materialId: parseInt(e.target.value) || null })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="">Выберите материал</option>
                <option value="1">API - Активный компонент</option>
                <option value="2">Excipient A - Наполнитель</option>
                <option value="3">Excipient B - Связующее</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Целевой вес (г)</label>
                <input
                  type="number"
                  value={node.data?.target_weight || ''}
                  onChange={(e) => updateNodeData({ target_weight: parseFloat(e.target.value) })}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Допуск (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={node.data?.tolerance || ''}
                  onChange={(e) => updateNodeData({ tolerance: parseFloat(e.target.value) })}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Весы</label>
                <select
                  value={node.data?.equipmentId || ''}
                  onChange={(e) => updateNodeData({ equipmentId: parseInt(e.target.value) || null })}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                >
                  <option value="">Выберите</option>
                  {(equipment || []).filter(eq => eq.class === 'Weighing').map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {/* Параметры QC проверки */}
        {node.type === 'qc_check' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Тип проверки</label>
              <select
                value={node.data?.qc_type || 'weight'}
                onChange={(e) => updateNodeData({ qc_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="weight">Проверка веса</option>
                <option value="visual">Визуальная проверка</option>
                <option value="ph">pH измерение</option>
                <option value="temperature">Температура</option>
                <option value="moisture">Влажность</option>
                <option value="hardness">Твердость</option>
                <option value="disintegration">Распадаемость</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Мин значение</label>
                <input
                  type="number"
                  value={node.data?.qcParameters?.min || ''}
                  onChange={(e) => updateNodeData({
                    qcParameters: {
                      ...node.data?.qcParameters,
                      min: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Макс значение</label>
                <input
                  type="number"
                  value={node.data?.qcParameters?.max || ''}
                  onChange={(e) => updateNodeData({
                    qcParameters: {
                      ...node.data?.qcParameters,
                      max: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Единица измерения</label>
              <input
                type="text"
                value={node.data?.qcParameters?.unit || ''}
                onChange={(e) => updateNodeData({
                  qcParameters: {
                    ...node.data?.qcParameters,
                    unit: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="г, %, мг, мин и т.д."
              />
            </div>
          </>
        )}

        {/* Параметры условий */}
        {node.type === 'decision' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Тип условия</label>
              <select
                value={node.data?.condition?.type || 'qc_result'}
                onChange={(e) => updateNodeData({
                  condition: {
                    ...node.data?.condition,
                    type: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="qc_result">QC результат</option>
                <option value="weight_check">Проверка веса</option>
                <option value="time_elapsed">Время истекло</option>
                <option value="temperature">Температура</option>
                <option value="equipment_status">Статус оборудования</option>
                <option value="step_count">Количество итераций</option>
                <option value="custom">Пользовательское</option>
              </select>
            </div>
            
            {node.data?.condition?.type === 'qc_result' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Параметр QC</label>
                  <select
                    value={node.data?.condition?.qc_parameter || ''}
                    onChange={(e) => updateNodeData({
                      condition: {
                        ...node.data?.condition,
                        qc_parameter: e.target.value
                      }
                    })}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                  >
                    <option value="">Выберите</option>
                    <option value="weight">Вес</option>
                    <option value="ph">pH</option>
                    <option value="temperature">Температура</option>
                    <option value="visual">Визуальный</option>
                    <option value="hardness">Твердость</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Ожидаемый результат</label>
                  <select
                    value={node.data?.condition?.expected_result || 'pass'}
                    onChange={(e) => updateNodeData({
                      condition: {
                        ...node.data?.condition,
                        expected_result: e.target.value
                      }
                    })}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                  >
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                  </select>
                </div>
              </div>
            )}
            
            {node.data?.condition?.type === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Формула условия</label>
                <textarea
                  value={node.data?.condition?.formula || ''}
                  onChange={(e) => updateNodeData({
                    condition: {
                      ...node.data?.condition,
                      formula: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  rows="3"
                  placeholder="Примеры:
weight >= target_weight * 0.99
temperature > 25 && ph_value < 7
rework_count < max_iterations"
                />
              </div>
            )}
          </>
        )}

        {/* Параметры переработки */}
        {node.type === 'rework' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Максимум итераций</label>
              <input
                type="number"
                value={node.data?.max_iterations || 3}
                onChange={(e) => updateNodeData({ max_iterations: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Процедура переработки</label>
              <textarea
                value={node.data?.rework_procedure || ''}
                onChange={(e) => updateNodeData({ rework_procedure: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                rows="3"
                placeholder="1. Проанализировать причину отклонения
2. Скорректировать параметры процесса  
3. Повторить операцию"
              />
            </div>
          </>
        )}

        {/* Параметры ожидания */}
        {node.type === 'hold' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Тип ожидания</label>
              <select
                value={node.data?.hold_type || 'time'}
                onChange={(e) => updateNodeData({ hold_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="time">По времени</option>
                <option value="temperature">По температуре</option>
                <option value="manual">Ручное подтверждение</option>
                <option value="equipment">Готовность оборудования</option>
              </select>
            </div>
            
            {node.data?.hold_type === 'time' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Время ожидания (мин)</label>
                <input
                  type="number"
                  value={node.data?.hold_duration || ''}
                  onChange={(e) => updateNodeData({ hold_duration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            )}
          </>
        )}

        {/* Общие параметры */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Инструкция</label>
          <textarea
            value={node.data?.instruction || ''}
            onChange={(e) => updateNodeData({ instruction: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            rows="3"
            placeholder="Подробная инструкция для выполнения операции..."
          />
        </div>

        <button
          onClick={onDelete}
          className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium"
        >
          Удалить узел
        </button>
      </div>
    </div>
  );
};

export default function EnhancedWorkflows({ 
  workflows = [], 
  setWorkflows = () => {}, 
  formulas = [],
  equipment = [],
  workStations = [],
  addAuditEntry = () => {},
  language = 'en'
}) {
  
  const [editingWorkflow, setEditingWorkflow] = React.useState(null);
  const [expandedWorkflow, setExpandedWorkflow] = React.useState(null);
  const [viewMode, setViewMode] = React.useState('visual'); // Только визуальный режим
  
  const t = (key) => {
    const translations = {
      en: {
        workflowConfiguration: "Workflow Configuration",
        newWorkflow: "New Workflow",
        name: "Name",
        formula: "Formula",
        version: "Version",
        steps: "Steps",
        status: "Status",
        actions: "Actions",
        details: "Details",
        visualEditor: "Visual Editor",
        nodes: "Nodes",
        connections: "Connections"
      },
      ru: {
        workflowConfiguration: "Конфигурация процессов",
        newWorkflow: "Новый процесс",
        name: "Название",
        formula: "Формула",
        version: "Версия", 
        steps: "Шаги",
        status: "Статус",
        actions: "Действия",
        details: "Подробности",
        visualEditor: "Визуальный редактор",
        nodes: "Узлы",
        connections: "Связи"
      }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
  };
  
  // Конвертация старой структуры в новую для совместимости
  const migrateWorkflowToNodes = (workflow = {}) => {
    if (!workflow || (workflow.nodes && workflow.nodes.length > 0)) {
      return workflow;
    }

    const nodes = [
      {
        id: `node_start_${workflow.id || Date.now()}`,
        type: "start",
        name: "Начало процесса",
        position: { x: 400, y: 50 },
        data: {}
      }
    ];

    const edges = [];
    let lastNodeId = `node_start_${workflow.id || Date.now()}`;
    let yPosition = 150;

    (workflow.steps || []).forEach((step, index) => {
      const nodeId = `node_${step.id}`;
      const nodeType = step.type === 'qc' ? 'qc_check' : 
                       step.type === 'dispensing' ? 'dispensing' : 
                       step.type === 'weighing' ? 'weighing' : 'mixing';
      
      nodes.push({
        id: nodeId,
        type: nodeType,
        name: step.name,
        position: { x: 400, y: yPosition },
        data: {
          equipmentId: step.equipmentId,
          workStationId: step.workStationId,
          formulaBomId: step.formulaBomId,
          instruction: step.instruction,
          parameters: step.stepParameters || {},
          qcParameters: step.qcParameters || {}
        }
      });

      edges.push({
        id: `edge_${lastNodeId}_${nodeId}`,
        source: lastNodeId,
        target: nodeId,
        type: 'default',
        label: ''
      });

      lastNodeId = nodeId;
      yPosition += 120;
    });

    const endNodeId = `node_end_${workflow.id || Date.now()}`;
    nodes.push({
      id: endNodeId,
      type: "end",
      name: "Завершение процесса",
      position: { x: 400, y: yPosition },
      data: {}
    });

    if ((workflow.steps || []).length > 0) {
      edges.push({
        id: `edge_${lastNodeId}_${endNodeId}`,
        source: lastNodeId,
        target: endNodeId,
        type: 'default',
        label: ''
      });
    }

    return {
      ...workflow,
      nodes,
      edges
    };
  };

  const addNewWorkflow = () => {
    const newWorkflow = {
      id: Date.now(),
      name: "Новый Pharma процесс",
      formulaId: null,
      version: "0.1",
      status: "draft",
      createdDate: new Date().toISOString().split('T')[0],
      nodes: [
        {
          id: `node_start_${Date.now()}`,
          type: "start",
          name: "Начало процесса",
          position: { x: 400, y: 50 },
          data: {}
        },
        {
          id: `node_end_${Date.now() + 1}`,
          type: "end", 
          name: "Завершение процесса",
          position: { x: 400, y: 300 },
          data: {}
        }
      ],
      edges: [],
      steps: []
    };
    
    setWorkflows(prev => [...prev, newWorkflow]);
    setEditingWorkflow(newWorkflow.id);
    addAuditEntry("Workflow Created", `New Pharma workflow created`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{t('workflowConfiguration')}</h2>
        <button 
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 font-medium shadow-lg"
          onClick={addNewWorkflow}
        >
          <Plus className="w-5 h-5" />
          <span>{t('newWorkflow')}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-slate-800">Pharma Process Designer</h3>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-600">
                Процессов: {workflows.length}
              </div>
              <select 
                className="border border-slate-300 rounded-lg px-4 py-2 text-sm"
                value={editingWorkflow || ''}
                onChange={(e) => setEditingWorkflow(parseInt(e.target.value) || null)}
              >
                <option value="">Выберите процесс для редактирования</option>
                {workflows.map(wf => (
                  <option key={wf.id} value={wf.id}>{wf.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {editingWorkflow && (
          <div className="h-screen">
            <VisualWorkflowEditor
              workflow={migrateWorkflowToNodes(workflows.find(w => w.id === editingWorkflow) || {})}
              onWorkflowChange={(updatedWorkflow) => {
                setWorkflows(prev => prev.map(w => 
                  w.id === editingWorkflow ? updatedWorkflow : w
                ));
                addAuditEntry("Workflow Modified", "Pharma workflow updated");
              }}
              formulas={formulas}
              equipment={equipment}
              workStations={workStations}
            />
          </div>
        )}

        {!editingWorkflow && (
          <div className="p-12 text-center">
            <GitBranch className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Выберите процесс для редактирования</h3>
            <p className="text-slate-500">
              Создайте новый процесс или выберите существующий из списка выше
            </p>
          </div>
        )}
      </div>
    </div>
  );
}