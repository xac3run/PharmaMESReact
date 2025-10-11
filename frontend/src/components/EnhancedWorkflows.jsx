import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Trash2, Save, CheckCircle, ChevronDown, ChevronUp, 
  GitBranch, Play, Pause, Circle, Square, Link, AlertTriangle 
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                         ЧАСТЬ 1:  СИНХРОНИЗАЦИЯ                          */
/* -------------------------------------------------------------------------- */

// Конвертация таблицы → граф
export const stepsToGraph = (workflow) => {
  if (!workflow?.steps) return workflow;

  const nodes = [];
  const edges = [];

  // создаём узлы
  workflow.steps.forEach((step, idx) => {
    const node = {
      id: `node_${step.id}`,
      type: step.type || "process",
      name: step.name || `Step ${idx + 1}`,
      position: step.position || { x: 400, y: 150 + idx * 120 },
      data: {
        ...step,
        allowManualOverride: step.allowManualOverride ?? true,
      },
    };
    nodes.push(node);
  });

  // создаём связи
  workflow.steps.forEach((step) => {
    if (step.nextStepId) {
      const next = workflow.steps.find((s) => s.id === step.nextStepId);
      if (next) {
        edges.push({
          id: `edge_${step.id}_${next.id}`,
          source: `node_${step.id}`,
          target: `node_${next.id}`,
          type:
            step.transition?.mode === "conditional"
              ? "conditional"
              : step.transition?.mode === "rework"
              ? "rework"
              : "default",
          label:
            step.transition?.mode === "conditional"
              ? step.transition?.condition?.type || "Condition"
              : step.transition?.mode === "rework"
              ? "Rework"
              : "",
        });
      }
    }

    // rework loop
    if (step.reworkTargetId) {
      const reworkTarget = workflow.steps.find(
        (s) => s.id === step.reworkTargetId
      );
      if (reworkTarget) {
        edges.push({
          id: `edge_rework_${step.id}_${reworkTarget.id}`,
          source: `node_${step.id}`,
          target: `node_${reworkTarget.id}`,
          type: "rework",
          label: "Rework Loop",
        });
      }
    }

    // параллельные ветки
    if (step.parallelTargets && step.parallelTargets.length > 0) {
      step.parallelTargets.forEach((targetId, i) => {
        const target = workflow.steps.find((s) => s.id === targetId);
        if (target) {
          edges.push({
            id: `edge_parallel_${step.id}_${target.id}_${i}`,
            source: `node_${step.id}`,
            target: `node_${target.id}`,
            type: "parallel",
            label: `Branch ${i + 1}`,
          });
        }
      });
    }
  });

  return { ...workflow, nodes, edges };
};

// Конвертация графа → таблица
export const graphToSteps = (workflow) => {
  if (!workflow?.nodes) return workflow;
  const steps = workflow.nodes.map((n) => ({
    id: parseInt(n.id.replace("node_", "")),
    name: n.name,
    type: n.type,
    position: n.position,
    transition: n.data?.transition || { mode: "automatic" },
    nextStepId: n.data?.nextStepId || null,
    reworkTargetId: n.data?.reworkTargetId || null,
    parallelTargets: n.data?.parallelTargets || [],
    allowManualOverride: n.data?.allowManualOverride ?? true,
  }));
  return { ...workflow, steps };
};

// Синхронизация из таблицы (источник правды)
export const syncFromTable = (workflows, setWorkflows, workflowId) => {
  const wf = workflows.find((w) => w.id === workflowId);
  if (!wf) return;
  const migrated = stepsToGraph(wf);
  setWorkflows((prev) =>
    prev.map((w) => (w.id === workflowId ? migrated : w))
  );
};

/* -------------------------------------------------------------------------- */
/*        дальше — ЧАСТЬ 2: табличный редактор (WorkflowsTableInline)        */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*           ЧАСТЬ 2: Табличный редактор (источник правды = таблица)         */
/* -------------------------------------------------------------------------- */

const WorkflowsTableInline = ({
  workflows = [],
  setWorkflows = () => {},
  formulas = [],
  equipment = [],
  workStations = [],
  addAuditEntry = () => {},
  language = "ru",
  editingWorkflow = null,
  setEditingWorkflow = () => {},
}) => {
  const [expandedWorkflow, setExpandedWorkflow] = useState(null);

  // Обновить конкретный workflow по id
  const updateWorkflow = (workflowId, patchOrFn) => {
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id !== workflowId) return w;
        const next =
          typeof patchOrFn === "function" ? patchOrFn(w) : { ...w, ...patchOrFn };
        return next;
      })
    );
  };

  // Синхронизировать граф из таблицы (пересобрать nodes/edges)
  const rebuildGraph = (workflowId) => {
    // на основе текущих workflows получаем wf и пересобираем
    const wf = workflows.find((w) => w.id === workflowId);
    if (!wf) return;
    const migrated = stepsToGraph(wf);
    setWorkflows((prev) => prev.map((w) => (w.id === workflowId ? migrated : w)));
  };

  // Утилита для получения списка шагов (для select-ов next/rework/parallel)
  const stepsOptions = (wf) =>
    (wf.steps || []).map((s) => ({
      value: s.id,
      label: s.name || `Step ${s.id}`,
    }));

  // Добавление шага
  const addWorkflowStep = (workflowId) => {
    const now = Date.now();
    const newStep = {
      id: now,
      name: "Новый шаг",
      type: "process", // process | weighing | dispensing | qc | mixing
      instruction: "",
      stepParameters: {},
      qcParameters: {},

      equipmentId: null,
      workStationId: null,
      formulaBomId: null,

      // Переходы
      nextStepId: null, // для automatic/manual/conditional
      reworkTargetId: null, // для rework
      parallelTargets: [], // для parallel
      transition: {
        mode: "automatic", // automatic | conditional | manual | rework | parallel
        allowManualOverride: true,
        condition: {
          type: "qc_result", // qc_result | time_elapsed | equipment_signal | custom
          qcParam: "weight",
          expected: "pass",
          minutes: 10,
          signalCode: "",
          formula: "",
        },
      },

      // Позиция для визуального (если уже сохранили/таскали)
      position: { x: 400, y: 150 },
    };

    updateWorkflow(workflowId, (w) => {
      const steps = [...(w.steps || []), newStep];
      return { ...w, steps };
    });

    addAuditEntry("Workflow Modified", `Step added to workflow`);
  };

  // Удаление шага
  const deleteStep = (workflowId, stepId) => {
    updateWorkflow(workflowId, (w) => {
      const steps = (w.steps || []).filter((s) => s.id !== stepId);

      // Обновим ссылки next/rework/parallel у остальных шагов
      const cleaned = steps.map((s) => {
        const nextStepId = s.nextStepId === stepId ? null : s.nextStepId;
        const reworkTargetId = s.reworkTargetId === stepId ? null : s.reworkTargetId;
        const parallelTargets = Array.isArray(s.parallelTargets)
          ? s.parallelTargets.filter((id) => id !== stepId)
          : [];
        return { ...s, nextStepId, reworkTargetId, parallelTargets };
      });

      return { ...w, steps: cleaned };
    });
    addAuditEntry("Workflow Modified", `Step removed from workflow`);
  };

  // Сохранить и закрыть редактор конкретного workflow
  const saveAndClose = (workflowId) => {
    // Пересобираем граф из таблицы (таблица — источник правды)
    rebuildGraph(workflowId);

    // Закрываем редактор
    setEditingWorkflow(null);
    addAuditEntry("Workflow Saved", `Workflow ${workflowId} saved`);
  };

  // Переключение expand/collapse
  const toggleExpand = (workflowId) => {
    setExpandedWorkflow((prev) => (prev === workflowId ? null : workflowId));
  };

  // Обертки для обновления полей шага
  const patchStep = (workflowId, stepId, updater) => {
    updateWorkflow(workflowId, (w) => ({
      ...w,
      steps: (w.steps || []).map((s) => (s.id === stepId ? updater(s) : s)),
    }));
  };

  return (
    <div className="glass-card overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="py-2 px-2 text-left font-semibold text-xs">Name</th>
            <th className="py-2 px-2 text-left font-semibold text-xs">Formula</th>
            <th className="py-2 px-2 text-left font-semibold text-xs">Version</th>
            <th className="py-2 px-2 text-left font-semibold text-xs">Steps</th>
            <th className="py-2 px-2 text-left font-semibold text-xs">Status</th>
            <th className="py-2 px-2 text-left font-semibold text-xs">Actions</th>
          </tr>
        </thead>

        <tbody>
          {workflows.map((wf, idx) => {
            const selectedFormula = formulas.find((f) => f.id === wf.formulaId);
            const isEditing = editingWorkflow === wf.id;
            const isExpanded = expandedWorkflow === wf.id;

            return (
              <React.Fragment key={wf.id}>
                <tr
                  className={`border-b hover:bg-slate-50 transition ${
                    idx % 2 ? "bg-slate-50/40" : ""
                  }`}
                >
                  <td className="py-2 px-2 text-xs font-semibold">{wf.name}</td>
                  <td className="py-2 px-2 text-xs">
                    {selectedFormula?.productName || "—"}
                  </td>
                  <td className="py-2 px-2 text-xs">{wf.version}</td>
                  <td className="py-2 px-2 text-xs">{wf.steps?.length || 0}</td>
                  <td className="py-2 px-2">
                    <select
                      value={wf.status}
                      onChange={(e) =>
                        updateWorkflow(wf.id, { status: e.target.value })
                      }
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        wf.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : wf.status === "review"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <option value="draft">Draft</option>
                      <option value="review">Review</option>
                      <option value="approved">Approved</option>
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={() =>
                          setEditingWorkflow(isEditing ? null : wf.id)
                        }
                        className="p-1 hover:bg-blue-50 rounded text-blue-600"
                        title="Edit"
                      >
                        {isEditing ? (
                          <Save className="w-3 h-3" />
                        ) : (
                          <CheckCircle className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleExpand(wf.id)}
                        className="p-1 hover:bg-slate-100 rounded"
                        title="Details"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>

                {(isEditing || isExpanded) && (
                  <tr>
                    <td colSpan="6" className="bg-slate-50 py-3 px-3">
                      {isEditing ? (
                        <div className="space-y-4">
                          {/* Основная информация */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs font-semibold mb-1">
                                Название
                              </label>
                              <input
                                className="border rounded px-2 py-1 w-full text-xs"
                                value={wf.name}
                                onChange={(e) =>
                                  updateWorkflow(wf.id, { name: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1">
                                Формула
                              </label>
                              <select
                                className="border rounded px-2 py-1 w-full text-xs"
                                value={wf.formulaId || ""}
                                onChange={(e) =>
                                  updateWorkflow(wf.id, {
                                    formulaId: parseInt(e.target.value) || null,
                                  })
                                }
                              >
                                <option value="">Не выбрано</option>
                                {formulas.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.productName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1">
                                Версия
                              </label>
                              <input
                                className="border rounded px-2 py-1 w-full text-xs"
                                value={wf.version}
                                onChange={(e) =>
                                  updateWorkflow(wf.id, { version: e.target.value })
                                }
                              />
                            </div>
                          </div>

                          {/* Шаги */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="font-semibold text-xs">
                                Шаги процесса
                              </label>
                              <button
                                onClick={() => addWorkflowStep(wf.id)}
                                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                              >
                                + Добавить шаг
                              </button>
                            </div>

                            <div className="space-y-2">
                              {(wf.steps || []).map((step, idx) => (
                                <div
                                  key={step.id}
                                  className="border rounded p-3 bg-white"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs text-slate-500">
                                      ID: {step.id}
                                    </div>
                                    <button
                                      onClick={() => deleteStep(wf.id, step.id)}
                                      className="text-red-600 hover:bg-red-100 p-1 rounded"
                                      title="Удалить шаг"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-6 gap-2 items-start">
                                    <div>
                                      <label className="block text-xs mb-1">
                                        Название
                                      </label>
                                      <input
                                        className="border rounded px-2 py-1 w-full text-xs"
                                        value={step.name}
                                        onChange={(e) =>
                                          patchStep(wf.id, step.id, (s) => ({
                                            ...s,
                                            name: e.target.value,
                                          }))
                                        }
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-xs mb-1">
                                        Тип
                                      </label>
                                      <select
                                        className="border rounded px-2 py-1 w-full text-xs"
                                        value={step.type}
                                        onChange={(e) =>
                                          patchStep(wf.id, step.id, (s) => ({
                                            ...s,
                                            type: e.target.value,
                                          }))
                                        }
                                      >
                                        <option value="process">Process</option>
                                        <option value="weighing">Weighing</option>
                                        <option value="dispensing">Dispensing</option>
                                        <option value="qc">QC</option>
                                        <option value="mixing">Mixing</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-xs mb-1">
                                        Оборудование
                                      </label>
                                      <select
                                        className="border rounded px-2 py-1 w-full text-xs"
                                        value={step.equipmentId || ""}
                                        onChange={(e) =>
                                          patchStep(wf.id, step.id, (s) => ({
                                            ...s,
                                            equipmentId:
                                              parseInt(e.target.value) || null,
                                          }))
                                        }
                                      >
                                        <option value="">—</option>
                                        {equipment.map((eq) => (
                                          <option key={eq.id} value={eq.id}>
                                            {eq.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-xs mb-1">
                                        Станция
                                      </label>
                                      <select
                                        className="border rounded px-2 py-1 w-full text-xs"
                                        value={step.workStationId || ""}
                                        onChange={(e) =>
                                          patchStep(wf.id, step.id, (s) => ({
                                            ...s,
                                            workStationId:
                                              parseInt(e.target.value) || null,
                                          }))
                                        }
                                      >
                                        <option value="">—</option>
                                        {workStations.map((ws) => (
                                          <option key={ws.id} value={ws.id}>
                                            {ws.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div className="col-span-2">
                                      <label className="block text-xs mb-1">
                                        Инструкция
                                      </label>
                                      <textarea
                                        className="border rounded px-2 py-1 w-full text-xs"
                                        rows="1"
                                        value={step.instruction || ""}
                                        onChange={(e) =>
                                          patchStep(wf.id, step.id, (s) => ({
                                            ...s,
                                            instruction: e.target.value,
                                          }))
                                        }
                                      />
                                    </div>

                                    {/* QC блок (если тип QC) */}
                                    {step.type === "qc" && (
                                      <>
                                        <div>
                                          <label className="block text-xs mb-1">
                                            QC Param
                                          </label>
                                          <input
                                            className="border rounded px-2 py-1 w-full text-xs"
                                            value={step.qcParameters?.parameter || ""}
                                            onChange={(e) =>
                                              patchStep(wf.id, step.id, (s) => ({
                                                ...s,
                                                qcParameters: {
                                                  ...(s.qcParameters || {}),
                                                  parameter: e.target.value,
                                                },
                                              }))
                                            }
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs mb-1">
                                            Min
                                          </label>
                                          <input
                                            type="number"
                                            className="border rounded px-2 py-1 w-full text-xs"
                                            value={step.qcParameters?.min ?? ""}
                                            onChange={(e) =>
                                              patchStep(wf.id, step.id, (s) => ({
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
                                          <label className="block text-xs mb-1">
                                            Max
                                          </label>
                                          <input
                                            type="number"
                                            className="border rounded px-2 py-1 w-full text-xs"
                                            value={step.qcParameters?.max ?? ""}
                                            onChange={(e) =>
                                              patchStep(wf.id, step.id, (s) => ({
                                                ...s,
                                                qcParameters: {
                                                  ...(s.qcParameters || {}),
                                                  max: parseFloat(e.target.value),
                                                },
                                              }))
                                            }
                                          />
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  {/* ПЕРЕХОДЫ */}
                                  <div className="mt-3 border-t pt-3">
                                    <div className="grid grid-cols-6 gap-2 items-start">
                                      <div>
                                        <label className="block text-xs mb-1">
                                          Transition Mode
                                        </label>
                                        <select
                                          className="border rounded px-2 py-1 w-full text-xs"
                                          value={step.transition?.mode || "automatic"}
                                          onChange={(e) =>
                                            patchStep(wf.id, step.id, (s) => ({
                                              ...s,
                                              transition: {
                                                ...(s.transition || {}),
                                                mode: e.target.value,
                                              },
                                            }))
                                          }
                                        >
                                          <option value="automatic">automatic</option>
                                          <option value="manual">manual</option>
                                          <option value="conditional">conditional</option>
                                          <option value="rework">rework</option>
                                          <option value="parallel">parallel</option>
                                        </select>
                                      </div>

                                      {/* Next Step (для automatic/manual/conditional) */}
                                      {["automatic", "manual", "conditional"].includes(
                                        step.transition?.mode || "automatic"
                                      ) && (
                                        <div>
                                          <label className="block text-xs mb-1">
                                            Next Step
                                          </label>
                                          <select
                                            className="border rounded px-2 py-1 w-full text-xs"
                                            value={step.nextStepId || ""}
                                            onChange={(e) =>
                                              patchStep(wf.id, step.id, (s) => ({
                                                ...s,
                                                nextStepId: e.target.value
                                                  ? parseInt(e.target.value)
                                                  : null,
                                              }))
                                            }
                                          >
                                            <option value="">
                                              (auto by order / END)
                                            </option>
                                            {stepsOptions(wf)
                                              .filter((o) => o.value !== step.id)
                                              .map((o) => (
                                                <option key={o.value} value={o.value}>
                                                  {o.label}
                                                </option>
                                              ))}
                                          </select>
                                        </div>
                                      )}

                                      {/* Rework target */}
                                      {step.transition?.mode === "rework" && (
                                        <div>
                                          <label className="block text-xs mb-1">
                                            Rework Target
                                          </label>
                                          <select
                                            className="border rounded px-2 py-1 w-full text-xs"
                                            value={step.reworkTargetId || ""}
                                            onChange={(e) =>
                                              patchStep(wf.id, step.id, (s) => ({
                                                ...s,
                                                reworkTargetId: e.target.value
                                                  ? parseInt(e.target.value)
                                                  : null,
                                              }))
                                            }
                                          >
                                            <option value="">—</option>
                                            {stepsOptions(wf)
                                              .filter((o) => o.value !== step.id)
                                              .map((o) => (
                                                <option key={o.value} value={o.value}>
                                                  {o.label}
                                                </option>
                                              ))}
                                          </select>
                                        </div>
                                      )}

                                      {/* Parallel (multi-select chips) */}
                                      {step.transition?.mode === "parallel" && (
                                        <div className="col-span-2">
                                          <label className="block text-xs mb-1">
                                            Parallel Targets
                                          </label>
                                          <div className="flex flex-wrap gap-1">
                                            {stepsOptions(wf)
                                              .filter((o) => o.value !== step.id)
                                              .map((o) => {
                                                const selected = Array.isArray(
                                                  step.parallelTargets
                                                )
                                                  ? step.parallelTargets.includes(o.value)
                                                  : false;
                                                return (
                                                  <button
                                                    type="button"
                                                    key={o.value}
                                                    onClick={() =>
                                                      patchStep(wf.id, step.id, (s) => {
                                                        const set = new Set(
                                                          s.parallelTargets || []
                                                        );
                                                        if (selected) set.delete(o.value);
                                                        else set.add(o.value);
                                                        return {
                                                          ...s,
                                                          parallelTargets: Array.from(set),
                                                        };
                                                      })
                                                    }
                                                    className={`px-2 py-1 rounded text-xs border ${
                                                      selected
                                                        ? "bg-blue-600 text-white border-blue-600"
                                                        : "bg-white border-slate-300 hover:bg-slate-100"
                                                    }`}
                                                  >
                                                    {o.label}
                                                  </button>
                                                );
                                              })}
                                          </div>
                                        </div>
                                      )}

                                      {/* Manual override */}
                                      <div>
                                        <label className="block text-xs mb-1">
                                          Manual Override
                                        </label>
                                        <select
                                          className="border rounded px-2 py-1 w-full text-xs"
                                          value={
                                            (step.transition?.allowManualOverride ??
                                              true) === true
                                              ? "yes"
                                              : "no"
                                          }
                                          onChange={(e) =>
                                            patchStep(wf.id, step.id, (s) => ({
                                              ...s,
                                              transition: {
                                                ...(s.transition || {}),
                                                allowManualOverride:
                                                  e.target.value === "yes",
                                              },
                                            }))
                                          }
                                        >
                                          <option value="yes">allowed</option>
                                          <option value="no">forbidden</option>
                                        </select>
                                      </div>

                                      {/* Condition editor (если conditional) */}
                                      {step.transition?.mode === "conditional" && (
                                        <>
                                          <div>
                                            <label className="block text-xs mb-1">
                                              Cond. Type
                                            </label>
                                            <select
                                              className="border rounded px-2 py-1 w-full text-xs"
                                              value={
                                                step.transition?.condition?.type ||
                                                "qc_result"
                                              }
                                              onChange={(e) =>
                                                patchStep(wf.id, step.id, (s) => ({
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
                                              <option value="qc_result">qc_result</option>
                                              <option value="time_elapsed">
                                                time_elapsed
                                              </option>
                                              <option value="equipment_signal">
                                                equipment_signal
                                              </option>
                                              <option value="custom">custom</option>
                                            </select>
                                          </div>

                                          {/* qc_result */}
                                          {step.transition?.condition?.type ===
                                            "qc_result" && (
                                            <>
                                              <div>
                                                <label className="block text-xs mb-1">
                                                  QC Param
                                                </label>
                                                <input
                                                  className="border rounded px-2 py-1 w-full text-xs"
                                                  value={
                                                    step.transition?.condition?.qcParam ||
                                                    ""
                                                  }
                                                  onChange={(e) =>
                                                    patchStep(wf.id, step.id, (s) => ({
                                                      ...s,
                                                      transition: {
                                                        ...(s.transition || {}),
                                                        condition: {
                                                          ...(s.transition?.condition ||
                                                            {}),
                                                          qcParam: e.target.value,
                                                        },
                                                      },
                                                    }))
                                                  }
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-xs mb-1">
                                                  Expected
                                                </label>
                                                <select
                                                  className="border rounded px-2 py-1 w-full text-xs"
                                                  value={
                                                    step.transition?.condition?.expected ||
                                                    "pass"
                                                  }
                                                  onChange={(e) =>
                                                    patchStep(wf.id, step.id, (s) => ({
                                                      ...s,
                                                      transition: {
                                                        ...(s.transition || {}),
                                                        condition: {
                                                          ...(s.transition?.condition ||
                                                            {}),
                                                          expected: e.target.value,
                                                        },
                                                      },
                                                    }))
                                                  }
                                                >
                                                  <option value="pass">pass</option>
                                                  <option value="fail">fail</option>
                                                </select>
                                              </div>
                                            </>
                                          )}

                                          {/* time_elapsed */}
                                          {step.transition?.condition?.type ===
                                            "time_elapsed" && (
                                            <div>
                                              <label className="block text-xs mb-1">
                                                Minutes
                                              </label>
                                              <input
                                                type="number"
                                                className="border rounded px-2 py-1 w-full text-xs"
                                                value={
                                                  step.transition?.condition?.minutes ||
                                                  ""
                                                }
                                                onChange={(e) =>
                                                  patchStep(wf.id, step.id, (s) => ({
                                                    ...s,
                                                    transition: {
                                                      ...(s.transition || {}),
                                                      condition: {
                                                        ...(s.transition?.condition || {}),
                                                        minutes: parseInt(
                                                          e.target.value || "0",
                                                          10
                                                        ),
                                                      },
                                                    },
                                                  }))
                                                }
                                              />
                                            </div>
                                          )}

                                          {/* equipment_signal */}
                                          {step.transition?.condition?.type ===
                                            "equipment_signal" && (
                                            <div>
                                              <label className="block text-xs mb-1">
                                                Signal Code
                                              </label>
                                              <input
                                                className="border rounded px-2 py-1 w-full text-xs"
                                                value={
                                                  step.transition?.condition?.signalCode ||
                                                  ""
                                                }
                                                onChange={(e) =>
                                                  patchStep(wf.id, step.id, (s) => ({
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
                                              />
                                            </div>
                                          )}

                                          {/* custom */}
                                          {step.transition?.condition?.type ===
                                            "custom" && (
                                            <div className="col-span-2">
                                              <label className="block text-xs mb-1">
                                                Formula
                                              </label>
                                              <input
                                                className="border rounded px-2 py-1 w-full text-xs"
                                                placeholder="temperature > 30 && ph < 7"
                                                value={
                                                  step.transition?.condition?.formula || ""
                                                }
                                                onChange={(e) =>
                                                  patchStep(wf.id, step.id, (s) => ({
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
                                              />
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={() => saveAndClose(wf.id)}
                              className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                            >
                              Сохранить и закрыть
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs space-y-2">
                          <div>
                            <strong>Создан:</strong> {wf.createdDate}
                          </div>
                          <div>
                            <strong>Шаги:</strong>{" "}
                            {(wf.steps || []).map((s, i) => (
                              <span
                                key={s.id}
                                className="inline-block bg-slate-200 rounded px-2 py-0.5 mr-1"
                              >
                                {i + 1}. {s.name}
                              </span>
                            ))}
                          </div>
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
  );
};
/* -------------------------------------------------------------------------- */
/*      ЧАСТЬ 3: Визуальный редактор (drag & drop + настройка переходов)     */
/* -------------------------------------------------------------------------- */

const VisualWorkflowEditor = ({
  workflow = {},
  onWorkflowChange = () => {},
  formulas = [],
  equipment = [],
  workStations = []
}) => {
  const svgRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // UI state для панели инструментов (правый сайдбар)
  const [transitionUi, setTransitionUi] = useState({
    mode: 'automatic',           // automatic | manual | conditional | rework | parallel
    nextStepId: '',
    reworkTargetId: '',
    parallelTargets: [],
    condition: {
      type: 'qc_result',         // qc_result | time_elapsed | equipment_signal | custom
      qcParam: 'weight',
      expected: 'pass',
      minutes: 10,
      signalCode: '',
      formula: ''
    }
  });

  // -------------------- визуальные типы узлов --------------------
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

  // ------------------------- helpers -----------------------------
  const nodeById = (id) => (workflow.nodes || []).find(n => n.id === id);
  const stepIdFromNodeId = (nodeId) => {
    // узлы шага имеют формат node_<stepId>; старт/энд не конвертируем
    if (!nodeId?.startsWith('node_')) return null;
    const raw = nodeId.replace('node_', '');
    const asNum = parseInt(raw, 10);
    return Number.isFinite(asNum) ? asNum : null;
  };

  const stepById = (stepId) => (workflow.steps || []).find(s => s.id === stepId);

  const stepsOptions = () =>
    (workflow.steps || []).map(s => ({ value: s.id, label: s.name || `Step ${s.id}` }));

  // перенос позиций узлов при пересборке графа после правок переходов
  const mergePositions = (oldWf, newWf) => {
    const posMap = new Map((oldWf.nodes || []).map(n => [n.id, n.position]));
    const nodes = (newWf.nodes || []).map(n =>
      posMap.has(n.id) ? { ...n, position: posMap.get(n.id) } : n
    );
    return { ...newWf, nodes };
  };

  const conditionLabel = (cond) => {
    if (!cond) return '';
    switch (cond.type) {
      case 'qc_result': return `QC ${cond.qcParam || ''}=${cond.expected || 'pass'}`.trim();
      case 'time_elapsed': return `Timer ${cond.minutes || 0}m`;
      case 'equipment_signal': return `Signal ${cond.signalCode || ''}`.trim();
      case 'custom': return cond.formula || 'custom';
      default: return 'cond';
    }
  };

  // -------------------- drag & drop --------------------
  const onNodeMouseDown = (e, node) => {
    // старт/end тоже двигаем (можно запретить, если хочешь)
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDraggingNodeId(node.id);
    setDragOffset({
      x: e.clientX - rect.left - node.position.x,
      y: e.clientY - rect.top - node.position.y
    });
  };

  const onMouseMove = (e) => {
    if (!draggingNodeId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    // обновляем позицию узла в nodes + в steps.position (для персистентности)
    const updated = {
      ...workflow,
      nodes: (workflow.nodes || []).map(n =>
        n.id === draggingNodeId ? { ...n, position: { x: newX, y: newY } } : n
      )
    };

    const movedStepId = stepIdFromNodeId(draggingNodeId);
    if (movedStepId) {
      updated.steps = (workflow.steps || []).map(s =>
        s.id === movedStepId ? { ...s, position: { x: newX, y: newY } } : s
      );
    }

    onWorkflowChange(updated);
  };

  const onMouseUp = () => setDraggingNodeId(null);

  // -------------------- выбор на схеме --------------------
  const onCanvasClick = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const onNodeClick = (node) => {
    setSelectedNode(node.id);
    setSelectedEdge(null);

    // заполняем правую панель актуальными данными шага
    const sid = stepIdFromNodeId(node.id);
    if (!sid) return;
    const st = stepById(sid);
    const ui = {
      mode: st?.transition?.mode || 'automatic',
      nextStepId: st?.nextStepId || '',
      reworkTargetId: st?.reworkTargetId || '',
      parallelTargets: st?.parallelTargets || [],
      condition: {
        type: st?.transition?.condition?.type || 'qc_result',
        qcParam: st?.transition?.condition?.qcParam || 'weight',
        expected: st?.transition?.condition?.expected || 'pass',
        minutes: st?.transition?.condition?.minutes || 10,
        signalCode: st?.transition?.condition?.signalCode || '',
        formula: st?.transition?.condition?.formula || ''
      }
    };
    setTransitionUi(ui);
  };

  const onEdgeClick = (edge) => {
    setSelectedEdge(edge.id);
    setSelectedNode(null);
  };

  // -------------------- изменение переходов через UI справа --------------------

  // Применить текущие настройки панели переходов к выбранному шагу
  const applyTransition = () => {
    if (!selectedNode) return;
    const sid = stepIdFromNodeId(selectedNode);
    if (!sid) return;

    // обновляем шаг
    const updatedSteps = (workflow.steps || []).map(s => {
      if (s.id !== sid) return s;

      const next = { ...s };

      // сбросим все поля перед установкой режима (чтобы не было мусора)
      next.nextStepId = null;
      next.reworkTargetId = null;
      next.parallelTargets = [];
      next.transition = {
        ...(s.transition || {}),
        mode: transitionUi.mode,
        allowManualOverride: s.transition?.allowManualOverride ?? true,
        condition: { ...(transitionUi.condition) }
      };

      if (['automatic', 'manual', 'conditional'].includes(transitionUi.mode)) {
        next.nextStepId = transitionUi.nextStepId ? parseInt(transitionUi.nextStepId, 10) : null;
      }
      if (transitionUi.mode === 'rework') {
        next.reworkTargetId = transitionUi.reworkTargetId ? parseInt(transitionUi.reworkTargetId, 10) : null;
      }
      if (transitionUi.mode === 'parallel') {
        next.parallelTargets = Array.isArray(transitionUi.parallelTargets)
          ? transitionUi.parallelTargets.map(x => parseInt(x, 10)).filter(Boolean)
          : [];
      }

      return next;
    });

    // пересобираем граф (таблица -> nodes/edges), но переносим текущие позиции
    const newWfFromTable = stepsToGraph({ ...workflow, steps: updatedSteps });
    const merged = mergePositions(workflow, newWfFromTable);

    onWorkflowChange(merged);
  };

  // очистить переходы у выбранного шага
  const clearTransitions = () => {
    if (!selectedNode) return;
    const sid = stepIdFromNodeId(selectedNode);
    if (!sid) return;

    const updatedSteps = (workflow.steps || []).map(s => {
      if (s.id !== sid) return s;
      return {
        ...s,
        nextStepId: null,
        reworkTargetId: null,
        parallelTargets: [],
        transition: {
          ...(s.transition || {}),
          mode: 'automatic',
          condition: {
            type: 'qc_result',
            qcParam: 'weight',
            expected: 'pass',
            minutes: 10,
            signalCode: '',
            formula: ''
          }
        }
      };
    });
    const newWf = stepsToGraph({ ...workflow, steps: updatedSteps });
    const merged = mergePositions(workflow, newWf);
    onWorkflowChange(merged);
  };

  // быстрые кнопки: назначить next = выбранной цели
  const quickSetNext = (targetNodeId, mode = 'automatic') => {
    if (!selectedNode) return;
    const sid = stepIdFromNodeId(selectedNode);
    const tid = stepIdFromNodeId(targetNodeId);
    if (!sid || !tid) return;

    const updatedSteps = (workflow.steps || []).map(s => {
      if (s.id !== sid) return s;
      return {
        ...s,
        nextStepId: tid,
        reworkTargetId: s.reworkTargetId || null,
        parallelTargets: s.parallelTargets || [],
        transition: {
          ...(s.transition || {}),
          mode,
          condition: s.transition?.condition || {
            type: 'qc_result',
            qcParam: 'weight',
            expected: 'pass',
            minutes: 10,
            signalCode: '',
            formula: ''
          }
        }
      };
    });

    const newWf = stepsToGraph({ ...workflow, steps: updatedSteps });
    const merged = mergePositions(workflow, newWf);
    onWorkflowChange(merged);
  };

  // быстрые кнопки: добавить parallel к выбранному таргету
  const quickAddParallel = (targetNodeId) => {
    if (!selectedNode) return;
    const sid = stepIdFromNodeId(selectedNode);
    const tid = stepIdFromNodeId(targetNodeId);
    if (!sid || !tid) return;

    const updatedSteps = (workflow.steps || []).map(s => {
      if (s.id !== sid) return s;
      const set = new Set(s.parallelTargets || []);
      set.add(tid);
      return {
        ...s,
        transition: { ...(s.transition || {}), mode: 'parallel', condition: s.transition?.condition },
        parallelTargets: Array.from(set)
      };
    });

    const newWf = stepsToGraph({ ...workflow, steps: updatedSteps });
    const merged = mergePositions(workflow, newWf);
    onWorkflowChange(merged);
  };

  // быстрые кнопки: назначить rework target
  const quickSetRework = (targetNodeId) => {
    if (!selectedNode) return;
    const sid = stepIdFromNodeId(selectedNode);
    const tid = stepIdFromNodeId(targetNodeId);
    if (!sid || !tid) return;

    const updatedSteps = (workflow.steps || []).map(s => {
      if (s.id !== sid) return s;
      return {
        ...s,
        transition: { ...(s.transition || {}), mode: 'rework', condition: s.transition?.condition },
        reworkTargetId: tid
      };
    });

    const newWf = stepsToGraph({ ...workflow, steps: updatedSteps });
    const merged = mergePositions(workflow, newWf);
    onWorkflowChange(merged);
  };

  // -------------------- рендер рёбер --------------------
  const renderEdge = (edge) => {
    const sourceNode = nodeById(edge.source);
    const targetNode = nodeById(edge.target);
    if (!sourceNode || !targetNode) return null;

    const sourceType = nodeTypes[sourceNode.type] || { width: 140, height: 80 };
    const targetType = nodeTypes[targetNode.type] || { width: 140, height: 80 };
    const x1 = sourceNode.position.x + (sourceType.width || 140) / 2;
    const y1 = sourceNode.position.y + (sourceType.height || 80);
    const x2 = targetNode.position.x + (targetType.width || 140) / 2;
    const y2 = targetNode.position.y;

    const isSelected = selectedEdge === edge.id;
    let edgeColor = '#64748b';
    let dash = 'none';
    if (edge.type === 'conditional') { edgeColor = '#f59e0b'; dash = '8,4'; }
    if (edge.type === 'rework') { edgeColor = '#ef4444'; dash = '4,3'; }
    if (edge.type === 'parallel') { edgeColor = '#2563eb'; dash = '2,3'; }

    return (
      <g key={edge.id}>
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={edgeColor}
          strokeWidth={isSelected ? "4" : "2"}
          markerEnd="url(#arrowhead)"
          className="cursor-pointer"
          strokeDasharray={dash}
          onClick={(e) => { e.stopPropagation(); onEdgeClick(edge); }}
        />
        {edge.label && (
          <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
            <rect x="-32" y="-9" width="64" height="18" rx="8" fill="white" stroke={edgeColor} strokeWidth="1" />
            <text x="0" y="0" textAnchor="middle" alignmentBaseline="central" className="text-xs font-medium" fill={edgeColor}>
              {edge.label}
            </text>
          </g>
        )}
      </g>
    );
  };

  // -------------------- рендер узлов --------------------
  const renderNode = (node) => {
    const nodeType = nodeTypes[node.type] || { width: 140, height: 80, bgColor: '#fff', borderColor: '#e5e7eb', color: '#94a3b8', label: node.type };
    const isSelected = selectedNode === node.id;

    return (
      <g key={node.id} transform={`translate(${node.position.x}, ${node.position.y})`}>
        {/* тень */}
        <rect width={nodeType.width} height={nodeType.height} rx="12" fill="#00000015" transform="translate(3,3)" />
        {/* сам прямоугольник */}
        <rect
          width={nodeType.width}
          height={nodeType.height}
          rx="12"
          fill={nodeType.bgColor}
          stroke={isSelected ? '#3b82f6' : nodeType.borderColor}
          strokeWidth={isSelected ? '3' : '2'}
          className="cursor-move transition-all duration-150"
          onMouseDown={(e) => onNodeMouseDown(e, node)}
          onClick={(e) => { e.stopPropagation(); onNodeClick(node); }}
        />
        {/* полоска сверху */}
        <rect width={nodeType.width} height="4" rx="12" fill={nodeType.color} />
        {/* иконка */}
        <g transform="translate(12,16)">
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
        {/* имя */}
        <text x={nodeType.width / 2} y="40" textAnchor="middle" className="text-sm font-semibold pointer-events-none" fill="#374151">
          {node.name?.length > 18 ? node.name.substring(0, 18) + '…' : node.name}
        </text>
        {/* бейдж transition */}
        {node.data?.transition && (
          <g transform={`translate(${nodeType.width - 12},${nodeType.height - 12})`}>
            <circle r="8" fill="#fff" stroke="#94a3b8" />
            <text x="0" y="3" textAnchor="middle" fontSize="10" fill="#64748b">
              {node.data.transition.mode === 'conditional' ? '?' :
               node.data.transition.mode === 'rework' ? 'R' :
               node.data.transition.mode === 'parallel' ? '⫴' :
               node.data.transition.mode === 'manual' ? '⚡' : '→'}
            </text>
          </g>
        )}
      </g>
    );
  };

  // -------------------- рендер --------------------
  return (
    <div className="h-full relative overflow-hidden">
      {/* Левая панель подсказки */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 border border-slate-200 rounded-xl shadow p-3 text-xs text-slate-600">
        <div className="font-semibold text-slate-800 mb-2">Подсказки</div>
        <ul className="space-y-1 list-disc pl-4">
          <li>Перемещайте узлы мышкой (drag & drop)</li>
          <li>Клик по узлу — настройки переходов справа</li>
          <li>Серые связи — обычные, оранжевые — conditional, синие — parallel, красные — rework</li>
        </ul>
      </div>

      {/* Правая панель инструментов для выбранного узла */}
      <div className="absolute top-0 right-0 h-full w-80 bg-white border-l border-slate-200 p-4 overflow-y-auto">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 bg-blue-100 rounded-lg grid place-items-center text-blue-600 text-sm">⚙</div>
          <div className="font-semibold text-slate-800">Настройки переходов</div>
        </div>

        {!selectedNode && (
          <div className="text-slate-500 text-sm">
            Выберите узел на схеме, чтобы отредактировать переходы.
          </div>
        )}

        {selectedNode && (
          <>
            <div className="text-xs text-slate-500 mb-2">
              Узел: <span className="font-mono">{selectedNode}</span>
            </div>

            {/* MODE */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">Transition Mode</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs"
                value={transitionUi.mode}
                onChange={(e) => setTransitionUi(prev => ({ ...prev, mode: e.target.value }))}
              >
                <option value="automatic">automatic</option>
                <option value="manual">manual</option>
                <option value="conditional">conditional</option>
                <option value="rework">rework</option>
                <option value="parallel">parallel</option>
              </select>
            </div>

            {/* next step */}
            {['automatic','manual','conditional'].includes(transitionUi.mode) && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">Next Step</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs"
                  value={transitionUi.nextStepId}
                  onChange={(e) => setTransitionUi(prev => ({ ...prev, nextStepId: e.target.value }))}
                >
                  <option value="">(auto by order / END)</option>
                  {stepsOptions().filter(o => `node_${o.value}` !== selectedNode).map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* rework */}
            {transitionUi.mode === 'rework' && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">Rework Target</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs"
                  value={transitionUi.reworkTargetId}
                  onChange={(e) => setTransitionUi(prev => ({ ...prev, reworkTargetId: e.target.value }))}
                >
                  <option value="">—</option>
                  {stepsOptions().filter(o => `node_${o.value}` !== selectedNode).map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* parallel */}
            {transitionUi.mode === 'parallel' && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">Parallel Targets</label>
                <div className="flex flex-wrap gap-1">
                  {stepsOptions().filter(o => `node_${o.value}` !== selectedNode).map(o => {
                    const selected = (transitionUi.parallelTargets || []).includes(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        className={`px-2 py-1 rounded text-xs border ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-300 hover:bg-slate-100'}`}
                        onClick={() => {
                          setTransitionUi(prev => {
                            const set = new Set(prev.parallelTargets || []);
                            if (selected) set.delete(o.value); else set.add(o.value);
                            return { ...prev, parallelTargets: Array.from(set) };
                          });
                        }}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* conditional */}
            {transitionUi.mode === 'conditional' && (
              <div className="space-y-2 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cond. Type</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs"
                    value={transitionUi.condition.type}
                    onChange={(e) => setTransitionUi(prev => ({ ...prev, condition: { ...prev.condition, type: e.target.value } }))}
                  >
                    <option value="qc_result">qc_result</option>
                    <option value="time_elapsed">time_elapsed</option>
                    <option value="equipment_signal">equipment_signal</option>
                    <option value="custom">custom</option>
                  </select>
                </div>

                {transitionUi.condition.type === 'qc_result' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs mb-1">QC Param</label>
                      <input
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                        value={transitionUi.condition.qcParam}
                        onChange={(e) => setTransitionUi(prev => ({ ...prev, condition: { ...prev.condition, qcParam: e.target.value } }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Expected</label>
                      <select
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                        value={transitionUi.condition.expected}
                        onChange={(e) => setTransitionUi(prev => ({ ...prev, condition: { ...prev.condition, expected: e.target.value } }))}
                      >
                        <option value="pass">pass</option>
                        <option value="fail">fail</option>
                      </select>
                    </div>
                  </div>
                )}

                {transitionUi.condition.type === 'time_elapsed' && (
                  <div>
                    <label className="block text-xs mb-1">Minutes</label>
                    <input
                      type="number"
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                      value={transitionUi.condition.minutes}
                      onChange={(e) => setTransitionUi(prev => ({ ...prev, condition: { ...prev.condition, minutes: parseInt(e.target.value || '0', 10) } }))}
                    />
                  </div>
                )}

                {transitionUi.condition.type === 'equipment_signal' && (
                  <div>
                    <label className="block text-xs mb-1">Signal Code</label>
                    <input
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                      value={transitionUi.condition.signalCode}
                      onChange={(e) => setTransitionUi(prev => ({ ...prev, condition: { ...prev.condition, signalCode: e.target.value } }))}
                    />
                  </div>
                )}

                {transitionUi.condition.type === 'custom' && (
                  <div>
                    <label className="block text-xs mb-1">Formula</label>
                    <input
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                      placeholder="temperature > 30 && ph < 7"
                      value={transitionUi.condition.formula}
                      onChange={(e) => setTransitionUi(prev => ({ ...prev, condition: { ...prev.condition, formula: e.target.value } }))}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Кнопки применить/очистить */}
            <div className="flex items-center gap-2">
              <button
                onClick={applyTransition}
                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
              >
                Применить
              </button>
              <button
                onClick={clearTransitions}
                className="bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs hover:bg-slate-300"
              >
                Очистить
              </button>
            </div>

            {/* Быстрые действия */}
            <div className="mt-4 border-t pt-3">
              <div className="text-xs font-semibold text-slate-700 mb-2">Быстрые действия</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 w-24">Set Next:</span>
                  <select
                    className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) quickSetNext(`node_${val}`, 'automatic');
                    }}
                    value=""
                  >
                    <option value="">— выбрать —</option>
                    {stepsOptions().filter(o => `node_${o.value}` !== selectedNode).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 w-24">Set Cond.:</span>
                  <select
                    className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) quickSetNext(`node_${val}`, 'conditional');
                    }}
                    value=""
                  >
                    <option value="">— выбрать —</option>
                    {stepsOptions().filter(o => `node_${o.value}` !== selectedNode).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 w-24">Add Parallel:</span>
                  <select
                    className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) quickAddParallel(`node_${val}`);
                    }}
                    value=""
                  >
                    <option value="">— выбрать —</option>
                    {stepsOptions().filter(o => `node_${o.value}` !== selectedNode).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 w-24">Set Rework:</span>
                  <select
                    className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) quickSetRework(`node_${val}`);
                    }}
                    value=""
                  >
                    <option value="">— выбрать —</option>
                    {stepsOptions().filter(o => `node_${o.value}` !== selectedNode).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Сам канвас */}
      <div className="h-full w-[calc(100%-20rem)] overflow-auto" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
        <svg
          ref={svgRef}
          className="w-full min-h-full"
          style={{ minHeight: '2000px', minWidth: '1400px' }}
          onClick={onCanvasClick}
        >
          <defs>
            <marker id="arrowhead" markerWidth="12" markerHeight="8" refX="11" refY="4" orient="auto">
              <polygon points="0 0, 12 4, 0 8" fill="#64748b" />
            </marker>

            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
            </pattern>
            <pattern id="gridLarge" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
            </pattern>
          </defs>

          {/* фоновые сетки */}
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#gridLarge)" />

          {(workflow.edges || []).map(renderEdge)}
          {(workflow.nodes || []).map(renderNode)}
        </svg>
      </div>
    </div>
  );
};
/* -------------------------------------------------------------------------- */
/*                ЧАСТЬ 4: Объединяющий компонент EnhancedWorkflows           */
/* -------------------------------------------------------------------------- */

export default function EnhancedWorkflows({
  workflows = [],
  setWorkflows = () => {},
  formulas = [],
  equipment = [],
  workStations = [],
  addAuditEntry = () => {},
  language = "ru"
}) {
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // "table" | "visual"
  const [activeWorkflowId, setActiveWorkflowId] = useState(null);

  // Вызывается при любом изменении workflow (drag, переходы и т.п.)
  const onWorkflowChange = (updated) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === updated.id ? updated : w))
    );
  };

  // Переключение режима
  const toggleMode = (wfId, mode) => {
    setActiveWorkflowId(wfId);
    setViewMode(mode);
  };

  // Текущий workflow для визуального режима
  const currentWorkflow = workflows.find((w) => w.id === activeWorkflowId);

  return (
    <div className="space-y-4">
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

      {/* Режим таблицы */}
      {viewMode === "table" && (
        <div>
          <WorkflowsTableInline
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

          {/* Кнопки для перехода в визуальный вид */}
          <div className="mt-4 flex flex-wrap gap-2">
            {workflows.map((wf) => (
              <button
                key={wf.id}
                onClick={() => toggleMode(wf.id, "visual")}
                className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
              >
                🔍 Открыть схему: {wf.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Режим визуального редактора */}
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
                // при возврате пересобираем граф из таблицы (таблица — источник правды)
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
          </div>

          <VisualWorkflowEditor
            workflow={currentWorkflow}
            onWorkflowChange={onWorkflowChange}
            formulas={formulas}
            equipment={equipment}
            workStations={workStations}
          />
        </div>
      )}
    </div>
  );
}
