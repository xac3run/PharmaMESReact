import React, { useState } from "react";
import { Trash2, Save, CheckCircle, ChevronUp, ChevronDown } from "lucide-react";
import { stepsToGraph } from "./WorkflowUtils";
import { 
  getBomItemsForFormula, 
  getBomItemName, 
  shouldShowBomDropdown 
} from "./workflowDemoData";

/* -------------------------------------------------------------------------- */
/*                WORKFLOW TABLE — ПОЛНЫЙ ТАБЛИЧНЫЙ РЕДАКТОР                 */
/* -------------------------------------------------------------------------- */

export default function WorkflowTable({
  workflows = [],
  setWorkflows = () => {},
  formulas = [],
  equipment = [],
  workStations = [],
  addAuditEntry = () => {},
  language = "ru",
  editingWorkflow = null,
  setEditingWorkflow = () => {},
}) {
  const [expandedWorkflow, setExpandedWorkflow] = useState(null);

  // Обновление workflow по id
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

  // Синхронизация графа из таблицы
  const rebuildGraph = (workflowId) => {
    const wf = workflows.find((w) => w.id === workflowId);
    if (!wf) return;
    const migrated = stepsToGraph(wf);
    setWorkflows((prev) => prev.map((w) => (w.id === workflowId ? migrated : w)));
  };

  // Опции шагов (для select-ов)
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
      type: "process",
      instruction: "",
      stepParameters: {},
      qcParameters: {},
      equipmentId: null,
      workStationId: null,
      formulaBomId: null,
      nextStepId: null,
      reworkTargetId: null,
      parallelTargets: [],
      transition: {
        mode: "automatic",
        allowManualOverride: true,
        condition: {
          type: "qc_result",
          qcParam: "weight",
          expected: "pass",
          minutes: 10,
          signalCode: "",
          formula: "",
        },
      },
      position: { x: 400, y: 150 },
    };

    updateWorkflow(workflowId, (w) => ({
      ...w,
      steps: [...(w.steps || []), newStep],
    }));
    addAuditEntry("Workflow Modified", "Step added to workflow");
  };

  // Удаление шага
  const deleteStep = (workflowId, stepId) => {
    updateWorkflow(workflowId, (w) => {
      const steps = (w.steps || []).filter((s) => s.id !== stepId);
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
    addAuditEntry("Workflow Modified", "Step removed from workflow");
  };

  // Сохранить и закрыть
  const saveAndClose = (workflowId) => {
    rebuildGraph(workflowId);
    setEditingWorkflow(null);
    addAuditEntry("Workflow Saved", `Workflow ${workflowId} saved`);
  };

  const toggleExpand = (workflowId) => {
    setExpandedWorkflow((prev) => (prev === workflowId ? null : workflowId));
  };

  // Обновление поля шага
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
                        <WorkflowEditor
                          wf={wf}
                          updateWorkflow={updateWorkflow}
                          patchStep={patchStep}
                          deleteStep={deleteStep}
                          addWorkflowStep={addWorkflowStep}
                          saveAndClose={saveAndClose}
                          equipment={equipment}
                          workStations={workStations}
                          formulas={formulas}
                        />
                      ) : (
                        <WorkflowSummary wf={wf} formulas={formulas} />
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
}

/* ---------------------------- SUMMARY COMPONENT ---------------------------- */

function WorkflowSummary({ wf, formulas }) {
  const selectedFormula = formulas.find((f) => f.id === wf.formulaId);
  
  return (
    <div className="text-xs space-y-2">
      <div>
        <strong>Создан:</strong> {wf.createdDate}
      </div>
      {selectedFormula && (
        <div>
          <strong>Формула:</strong> {selectedFormula.productName} v{selectedFormula.version}
        </div>
      )}
      <div>
        <strong>Шаги:</strong>{" "}
        {(wf.steps || []).map((s, i) => {
          const bomName = getBomItemName(s.formulaBomId, formulas, wf.formulaId);
          return (
            <span
              key={s.id}
              className="inline-block bg-slate-200 rounded px-2 py-0.5 mr-1 mb-1"
            >
              {i + 1}. {s.name} ({s.type})
              {bomName && <div className="text-xs text-slate-600">BOM: {bomName}</div>}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------- INLINE EDITOR --------------------------- */

function WorkflowEditor({
  wf,
  updateWorkflow,
  patchStep,
  deleteStep,
  addWorkflowStep,
  saveAndClose,
  equipment,
  workStations,
  formulas,
}) {
  const stepsOptions = (wf) =>
    (wf.steps || []).map((s) => ({ value: s.id, label: s.name || `Step ${s.id}` }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-semibold mb-1">Название</label>
          <input
            className="border rounded px-2 py-1 w-full text-xs"
            value={wf.name}
            onChange={(e) => updateWorkflow(wf.id, { name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Формула</label>
          <select
            className="border rounded px-2 py-1 w-full text-xs"
            value={wf.formulaId || ""}
            onChange={(e) => {
              const newFormulaId = parseInt(e.target.value) || null;
              updateWorkflow(wf.id, { formulaId: newFormulaId });
              
              // Очистить formulaBomId у всех шагов при смене формулы
              if (newFormulaId !== wf.formulaId) {
                updateWorkflow(wf.id, (w) => ({
                  ...w,
                  formulaId: newFormulaId,
                  steps: (w.steps || []).map(s => ({ ...s, formulaBomId: null }))
                }));
              }
            }}
          >
            <option value="">Не выбрано</option>
            {formulas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.productName} v{f.version}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Версия</label>
          <input
            className="border rounded px-2 py-1 w-full text-xs"
            value={wf.version}
            onChange={(e) => updateWorkflow(wf.id, { version: e.target.value })}
          />
        </div>
      </div>

      {/* Steps */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="font-semibold text-xs">Шаги процесса</label>
          <button
            onClick={() => addWorkflowStep(wf.id)}
            className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
          >
            + Добавить шаг
          </button>
        </div>

        <div className="space-y-2">
          {(wf.steps || []).map((step) => (
            <WorkflowStepEditor
              key={step.id}
              step={step}
              wf={wf}
              patchStep={patchStep}
              deleteStep={deleteStep}
              stepsOptions={stepsOptions}
              equipment={equipment}
              workStations={workStations}
              formulas={formulas}
            />
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
  );
}

/* ---------------------- STEP INLINE EDITOR ----------------------- */

function WorkflowStepEditor({ 
  step, 
  wf, 
  patchStep, 
  deleteStep, 
  stepsOptions, 
  equipment, 
  workStations, 
  formulas 
}) {
  // Получить BOM items для текущей формулы workflow
  const bomItems = wf.formulaId ? getBomItemsForFormula(wf.formulaId, formulas) : [];
  
  return (
    <div className="border rounded p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-slate-500">ID: {step.id}</div>
        <button
          onClick={() => deleteStep(wf.id, step.id)}
          className="text-red-600 hover:bg-red-100 p-1 rounded"
          title="Удалить шаг"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Основные поля шага */}
      <div className="grid grid-cols-6 gap-2 items-start mb-3">
        <div>
          <label className="block text-xs mb-1">Название</label>
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
          <label className="block text-xs mb-1">Тип</label>
          <select
            className="border rounded px-2 py-1 w-full text-xs"
            value={step.type}
            onChange={(e) => {
              const newType = e.target.value;
              patchStep(wf.id, step.id, (s) => ({
                ...s,
                type: newType,
                // Очистить formulaBomId если новый тип не поддерживает BOM
                formulaBomId: shouldShowBomDropdown(newType) ? s.formulaBomId : null,
                // Очистить или инициализировать QC параметры
                qcParameters: newType === 'qc' ? (s.qcParameters || {}) : {},
              }));
            }}
          >
            <option value="process">Process</option>
            <option value="weighing">Weighing</option>
            <option value="dispensing">Dispensing</option>
            <option value="qc">QC</option>
            <option value="mixing">Mixing</option>
          </select>
        </div>

        <div>
          <label className="block text-xs mb-1">Оборудование</label>
          <select
            className="border rounded px-2 py-1 w-full text-xs"
            value={step.equipmentId || ""}
            onChange={(e) =>
              patchStep(wf.id, step.id, (s) => ({
                ...s,
                equipmentId: parseInt(e.target.value) || null,
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
          <label className="block text-xs mb-1">Станция</label>
          <select
            className="border rounded px-2 py-1 w-full text-xs"
            value={step.workStationId || ""}
            onChange={(e) =>
              patchStep(wf.id, step.id, (s) => ({
                ...s,
                workStationId: parseInt(e.target.value) || null,
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

        {/* BOM Dropdown - показывается только для dispensing/weighing */}
        {shouldShowBomDropdown(step.type) && (
          <div>
            <label className="block text-xs mb-1">BOM Material</label>
            <select
              className="border rounded px-2 py-1 w-full text-xs"
              value={step.formulaBomId || ""}
              onChange={(e) =>
                patchStep(wf.id, step.id, (s) => ({
                  ...s,
                  formulaBomId: parseInt(e.target.value) || null,
                }))
              }
              disabled={!wf.formulaId}
            >
              <option value="">—</option>
              {bomItems.map((bom) => (
                <option key={bom.id} value={bom.id}>
                  {bom.materialArticle} ({bom.quantity}{bom.unit})
                </option>
              ))}
            </select>
            {!wf.formulaId && (
              <div className="text-xs text-orange-600 mt-1">
                Выберите формулу для доступа к BOM
              </div>
            )}
          </div>
        )}

        <div className={shouldShowBomDropdown(step.type) ? "" : "col-span-2"}>
          <label className="block text-xs mb-1">Инструкция</label>
          <textarea
            className="border rounded px-2 py-1 w-full text-xs"
            rows="2"
            value={step.instruction || ""}
            onChange={(e) =>
              patchStep(wf.id, step.id, (s) => ({
                ...s,
                instruction: e.target.value,
              }))
            }
          />
        </div>
      </div>

      {/* Параметры шага */}
      {(step.type === "dispensing" || step.type === "weighing" || step.type === "mixing") && (
        <div className="mb-3 border-t pt-2">
          <label className="block text-xs font-semibold mb-1">Параметры шага</label>
          <div className="grid grid-cols-4 gap-2">
            {(step.type === "dispensing" || step.type === "weighing") && (
              <>
                <div>
                  <label className="block text-xs mb-1">Target Weight</label>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-full text-xs"
                    value={step.stepParameters?.targetWeight || ""}
                    onChange={(e) =>
                      patchStep(wf.id, step.id, (s) => ({
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
                  <label className="block text-xs mb-1">Tolerance</label>
                  <input
                    type="number"
                    step="0.1"
                    className="border rounded px-2 py-1 w-full text-xs"
                    value={step.stepParameters?.tolerance || ""}
                    onChange={(e) =>
                      patchStep(wf.id, step.id, (s) => ({
                        ...s,
                        stepParameters: {
                          ...(s.stepParameters || {}),
                          tolerance: parseFloat(e.target.value) || 0,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Unit</label>
                  <select
                    className="border rounded px-2 py-1 w-full text-xs"
                    value={step.stepParameters?.unit || "mg"}
                    onChange={(e) =>
                      patchStep(wf.id, step.id, (s) => ({
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
            
            {step.type === "mixing" && (
              <>
                <div>
                  <label className="block text-xs mb-1">Duration (min)</label>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-full text-xs"
                    value={step.stepParameters?.duration || ""}
                    onChange={(e) =>
                      patchStep(wf.id, step.id, (s) => ({
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
                  <label className="block text-xs mb-1">RPM</label>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-full text-xs"
                    value={step.stepParameters?.rpm || ""}
                    onChange={(e) =>
                      patchStep(wf.id, step.id, (s) => ({
                        ...s,
                        stepParameters: {
                          ...(s.stepParameters || {}),
                          rpm: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-full text-xs"
                    value={step.stepParameters?.temperature || ""}
                    onChange={(e) =>
                      patchStep(wf.id, step.id, (s) => ({
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

      {/* QC Параметры */}
      {step.type === "qc" && (
        <div className="mb-3 border-t pt-2">
          <label className="block text-xs font-semibold mb-1">QC Параметры</label>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs mb-1">Parameter</label>
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
              <label className="block text-xs mb-1">Min</label>
              <input
                type="number"
                step="0.1"
                className="border rounded px-2 py-1 w-full text-xs"
                value={step.qcParameters?.min || ""}
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
              <label className="block text-xs mb-1">Max</label>
              <input
                type="number"
                step="0.1"
                className="border rounded px-2 py-1 w-full text-xs"
                value={step.qcParameters?.max || ""}
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
            <div>
              <label className="block text-xs mb-1">Unit</label>
              <select
                className="border rounded px-2 py-1 w-full text-xs"
                value={step.qcParameters?.unit || "%"}
                onChange={(e) =>
                  patchStep(wf.id, step.id, (s) => ({
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
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ПЕРЕХОДЫ */}
      <div className="border-t pt-2">
        <label className="block text-xs font-semibold mb-1">Настройки переходов</label>
        <div className="grid grid-cols-6 gap-2 items-start">
          <div>
            <label className="block text-xs mb-1">Mode</label>
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

          {/* Next Step */}
          {["automatic", "manual", "conditional"].includes(
            step.transition?.mode || "automatic"
          ) && (
            <div>
              <label className="block text-xs mb-1">Next Step</label>
              <select
                className="border rounded px-2 py-1 w-full text-xs"
                value={step.nextStepId || ""}
                onChange={(e) =>
                  patchStep(wf.id, step.id, (s) => ({
                    ...s,
                    nextStepId: e.target.value ? parseInt(e.target.value) : null,
                  }))
                }
              >
                <option value="">(auto by order)</option>
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
              <label className="block text-xs mb-1">Rework Target</label>
              <select
                className="border rounded px-2 py-1 w-full text-xs"
                value={step.reworkTargetId || ""}
                onChange={(e) =>
                  patchStep(wf.id, step.id, (s) => ({
                    ...s,
                    reworkTargetId: e.target.value ? parseInt(e.target.value) : null,
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

          {/* Parallel targets */}
          {step.transition?.mode === "parallel" && (
            <div className="col-span-2">
              <label className="block text-xs mb-1">Parallel Targets</label>
              <div className="flex flex-wrap gap-1">
                {stepsOptions(wf)
                  .filter((o) => o.value !== step.id)
                  .map((o) => {
                    const selected = Array.isArray(step.parallelTargets)
                      ? step.parallelTargets.includes(o.value)
                      : false;
                    return (
                      <button
                        type="button"
                        key={o.value}
                        onClick={() =>
                          patchStep(wf.id, step.id, (s) => {
                            const set = new Set(s.parallelTargets || []);
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
            <label className="block text-xs mb-1">Manual Override</label>
            <select
              className="border rounded px-2 py-1 w-full text-xs"
              value={
                (step.transition?.allowManualOverride ?? true) === true
                  ? "yes"
                  : "no"
              }
              onChange={(e) =>
                patchStep(wf.id, step.id, (s) => ({
                  ...s,
                  transition: {
                    ...(s.transition || {}),
                    allowManualOverride: e.target.value === "yes",
                  },
                }))
              }
            >
              <option value="yes">allowed</option>
              <option value="no">forbidden</option>
            </select>
          </div>

          {/* Conditional parameters */}
          {step.transition?.mode === "conditional" && (
            <>
              <div>
                <label className="block text-xs mb-1">Condition Type</label>
                <select
                  className="border rounded px-2 py-1 w-full text-xs"
                  value={step.transition?.condition?.type || "qc_result"}
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
                  <option value="time_elapsed">time_elapsed</option>
                  <option value="equipment_signal">equipment_signal</option>
                  <option value="custom">custom</option>
                </select>
              </div>

              {/* Condition-specific fields */}
              {step.transition?.condition?.type === "qc_result" && (
                <>
                  <div>
                    <label className="block text-xs mb-1">QC Param</label>
                    <input
                      className="border rounded px-2 py-1 w-full text-xs"
                      value={step.transition?.condition?.qcParam || ""}
                      onChange={(e) =>
                        patchStep(wf.id, step.id, (s) => ({
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
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Expected</label>
                    <select
                      className="border rounded px-2 py-1 w-full text-xs"
                      value={step.transition?.condition?.expected || "pass"}
                      onChange={(e) =>
                        patchStep(wf.id, step.id, (s) => ({
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
                      <option value="pass">pass</option>
                      <option value="fail">fail</option>
                    </select>
                  </div>
                </>
              )}

              {step.transition?.condition?.type === "time_elapsed" && (
                <div>
                  <label className="block text-xs mb-1">Minutes</label>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-full text-xs"
                    value={step.transition?.condition?.minutes || ""}
                    onChange={(e) =>
                      patchStep(wf.id, step.id, (s) => ({
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
                  />
                </div>
              )}

              {step.transition?.condition?.type === "equipment_signal" && (
                <div>
                  <label className="block text-xs mb-1">Signal Code</label>
                  <input
                    className="border rounded px-2 py-1 w-full text-xs"
                    value={step.transition?.condition?.signalCode || ""}
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

              {step.transition?.condition?.type === "custom" && (
                <div className="col-span-2">
                  <label className="block text-xs mb-1">Custom Formula</label>
                  <input
                    className="border rounded px-2 py-1 w-full text-xs"
                    placeholder="temperature > 30 && ph < 7"
                    value={step.transition?.condition?.formula || ""}
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
  );
}