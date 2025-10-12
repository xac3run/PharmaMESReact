import React, { useState, useEffect } from "react";
import WorkflowTable from "./WorkflowTable";
import WorkflowVisualEditor from "./WorkflowVisualEditor";
import { stepsToGraph } from "./WorkflowUtils";

/* -------------------------------------------------------------------------- */
/*                    ENHANCED WORKFLOWS — ОБЪЕДИНЯЮЩИЙ КОМПОНЕНТ             */
/* -------------------------------------------------------------------------- */

export default function EnhancedWorkflows({
  workflows = [],
  setWorkflows = () => {},
  formulas = [],
  equipment = [],
  workStations = [],
  addAuditEntry = () => {},
  language = "ru",
}) {
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // "table" | "visual"
  const [activeWorkflowId, setActiveWorkflowId] = useState(null);

  // Синхронизировать workflows при загрузке - добавить nodes/edges если их нет
  useEffect(() => {
    const needsSync = workflows.some(wf => wf.steps && wf.steps.length > 0 && (!wf.nodes || wf.nodes.length === 0));
    
    if (needsSync) {
      console.log("🔄 Syncing workflows: converting steps to nodes/edges");
      const syncedWorkflows = workflows.map(wf => {
        // Если есть steps, но нет nodes - конвертируем
        if (wf.steps && wf.steps.length > 0 && (!wf.nodes || wf.nodes.length === 0)) {
          const converted = stepsToGraph(wf);
          console.log(`✅ Converted workflow ${wf.id}: ${wf.steps.length} steps -> ${converted.nodes?.length || 0} nodes`);
          return converted;
        }
        return wf;
      });
      setWorkflows(syncedWorkflows);
    }
  }, []); // Выполнить только при монтировании

  // Изменение workflow (drag, transitions и т.п.)
  const onWorkflowChange = (updated) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === updated.id ? updated : w))
    );
  };

  // Переключение режимов
  const toggleMode = (wfId, mode) => {
    setActiveWorkflowId(wfId);
    setViewMode(mode);
    
    // При переключении в визуальный режим, убедиться что есть nodes/edges
    if (mode === "visual") {
      const wf = workflows.find(w => w.id === wfId);
      if (wf && wf.steps && wf.steps.length > 0 && (!wf.nodes || wf.nodes.length === 0)) {
        console.log(`🔄 Converting workflow ${wfId} to visual format`);
        const synced = stepsToGraph(wf);
        onWorkflowChange(synced);
      }
    }
  };

  // Текущий workflow для визуального редактора
  const currentWorkflow = workflows.find((w) => w.id === activeWorkflowId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">
          Workflow Designer
        </h2>

        {viewMode === "visual" && currentWorkflow && (
          <button
            onClick={() => setViewMode("table")}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs px-3 py-1 rounded"
          >
            ← К таблице
          </button>
        )}
      </div>

      {/* Табличный режим */}
      {viewMode === "table" && (
        <div>
          <WorkflowTable
            workflows={workflows}
            setWorkflows={setWorkflows}
            formulas={formulas}
            equipment={equipment}
            workStations={workStations}
            addAuditEntry={addAuditEntry}
            language={language}
            editingWorkflow={editingWorkflow}
            setEditingWorkflow={setEditingWorkflow}
          />

          {/* Кнопки открытия схем */}
          <div className="mt-4 flex flex-wrap gap-2">
            {workflows.map((wf) => (
              <button
                key={wf.id}
                onClick={() => toggleMode(wf.id, "visual")}
                className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
                disabled={!wf.steps || wf.steps.length === 0}
              >
                🔍 Открыть схему: {wf.name} ({wf.steps?.length || 0} шагов)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Визуальный режим */}
      {viewMode === "visual" && currentWorkflow && (
        <div className="h-[90vh] border rounded-xl overflow-hidden relative">
          <div className="absolute top-2 left-2 z-10 flex space-x-2">
            <button
              onClick={() => setViewMode("table")}
              className="bg-white border border-slate-300 text-slate-800 text-xs px-3 py-1 rounded shadow-sm hover:bg-slate-50"
            >
              ← К таблице
            </button>

            <button
              onClick={() => {
                // При сохранении пересобираем граф из таблицы (таблица — источник правды)
                const wf = workflows.find((w) => w.id === activeWorkflowId);
                if (wf) {
                  const synced = stepsToGraph(wf);
                  onWorkflowChange(synced);
                }
                setViewMode("table");
              }}
              className="bg-blue-600 text-white text-xs px-3 py-1 rounded shadow-sm hover:bg-blue-700"
            >
              💾 Сохранить схему
            </button>

            {/* Debug info */}
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs px-2 py-1 rounded">
              Debug: {currentWorkflow.nodes?.length || 0} узлов, {currentWorkflow.edges?.length || 0} связей
            </div>
          </div>

          {/* Проверка наличия данных */}
          {(!currentWorkflow.nodes || currentWorkflow.nodes.length === 0) ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-slate-500 mb-2">Нет данных для визуализации</div>
                <div className="text-xs text-slate-400">
                  Workflow: {currentWorkflow.name}<br/>
                  Steps: {currentWorkflow.steps?.length || 0}<br/>
                  Nodes: {currentWorkflow.nodes?.length || 0}<br/>
                  Edges: {currentWorkflow.edges?.length || 0}
                </div>
                <button
                  onClick={() => {
                    console.log("🔧 Manually triggering steps to graph conversion");
                    const synced = stepsToGraph(currentWorkflow);
                    console.log("Conversion result:", synced);
                    onWorkflowChange(synced);
                  }}
                  className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-xs"
                >
                  Попробовать конвертировать заново
                </button>
              </div>
            </div>
          ) : (
            <WorkflowVisualEditor
              workflow={currentWorkflow}
              onWorkflowChange={onWorkflowChange}
              formulas={formulas}
              equipment={equipment}
              workStations={workStations}
            />
          )}
        </div>
      )}
    </div>
  );
}