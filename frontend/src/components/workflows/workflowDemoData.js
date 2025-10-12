// components/workflows/workflowDemoData.js
// Демо-данные для Workflow с интеграцией Formula-BOM

import { stepsToGraph } from './WorkflowUtils';

// Базовые workflows только со steps
const baseWorkflows = [
  {
    id: 1,
    name: "Standard Tablet Production",
    formulaId: 1, // Привязка к "Tablet A"
    version: "1.0",
    status: "approved", 
    createdDate: "2025-09-01",
    steps: [
      {
        id: 1001,
        name: "Dispense API",
        type: "dispensing",
        formulaBomId: 1, // Ссылка на API Powder Alpha из BOM
        equipmentId: 1,
        workStationId: 1,
        instruction: "Dispense API according to formula specification",
        stepParameters: { 
          targetWeight: 250, 
          tolerance: 2, 
          unit: "mg" 
        },
        qcParameters: {},
        transition: {
          mode: "automatic",
          allowManualOverride: true,
          condition: {
            type: "qc_result",
            qcParam: "weight", 
            expected: "pass",
            minutes: 10,
            signalCode: "",
            formula: ""
          }
        },
        nextStepId: 1002,
        reworkTargetId: null,
        parallelTargets: [],
        position: { x: 100, y: 100 }
      },
      {
        id: 1002,
        name: "Dispense Excipient",
        type: "dispensing", 
        formulaBomId: 2, // Ссылка на Excipient Beta из BOM
        equipmentId: 1,
        workStationId: 1,
        instruction: "Dispense excipient according to formula specification",
        stepParameters: { 
          targetWeight: 200, 
          tolerance: 2, 
          unit: "mg" 
        },
        qcParameters: {},
        transition: {
          mode: "automatic",
          allowManualOverride: true,
          condition: {
            type: "qc_result",
            qcParam: "weight",
            expected: "pass",
            minutes: 10,
            signalCode: "",
            formula: ""
          }
        },
        nextStepId: 1003,
        reworkTargetId: null,
        parallelTargets: [],
        position: { x: 100, y: 220 }
      },
      {
        id: 1003,
        name: "QC Weight Check",
        type: "qc",
        formulaBomId: null, // QC шаги не привязаны к BOM
        equipmentId: 1,
        workStationId: 1,
        instruction: "Verify total weight of dispensed materials",
        stepParameters: {},
        qcParameters: { 
          parameter: "Total Weight", 
          min: 445, 
          max: 455, 
          unit: "mg" 
        },
        transition: {
          mode: "conditional",
          allowManualOverride: false,
          condition: {
            type: "qc_result",
            qcParam: "weight",
            expected: "pass",
            minutes: 10,
            signalCode: "",
            formula: ""
          }
        },
        nextStepId: 1004,
        reworkTargetId: null,
        parallelTargets: [],
        position: { x: 100, y: 340 }
      },
      {
        id: 1004,
        name: "Add Lubricant",
        type: "dispensing",
        formulaBomId: 3, // Ссылка на Lubricant Gamma из BOM
        equipmentId: 1,
        workStationId: 1,
        instruction: "Add lubricant for final blend",
        stepParameters: { 
          targetWeight: 50, 
          tolerance: 1, 
          unit: "mg" 
        },
        qcParameters: {},
        transition: {
          mode: "automatic",
          allowManualOverride: true,
          condition: {
            type: "qc_result",
            qcParam: "weight",
            expected: "pass",
            minutes: 10,
            signalCode: "",
            formula: ""
          }
        },
        nextStepId: 1005,
        reworkTargetId: null,
        parallelTargets: [],
        position: { x: 100, y: 460 }
      },
      {
        id: 1005,
        name: "Mixing",
        type: "mixing",
        formulaBomId: null, // Смешивание не привязано к конкретному BOM
        equipmentId: 2,
        workStationId: 2,
        instruction: "Mix all components for 30 minutes at specified RPM",
        stepParameters: { 
          duration: 30, 
          rpm: 60, 
          temperature: 20 
        },
        qcParameters: {},
        transition: {
          mode: "automatic",
          allowManualOverride: true,
          condition: {
            type: "time_elapsed",
            qcParam: "",
            expected: "pass",
            minutes: 30,
            signalCode: "",
            formula: ""
          }
        },
        nextStepId: 1006,
        reworkTargetId: null,
        parallelTargets: [],
        position: { x: 300, y: 100 }
      },
      {
        id: 1006,
        name: "Final QC Check",
        type: "qc",
        formulaBomId: null,
        equipmentId: null,
        workStationId: 2,
        instruction: "Test mixture homogeneity and content uniformity",
        stepParameters: {},
        qcParameters: { 
          parameter: "Homogeneity", 
          min: 95, 
          max: 100, 
          unit: "%" 
        },
        transition: {
          mode: "conditional",
          allowManualOverride: false,
          condition: {
            type: "qc_result",
            qcParam: "homogeneity",
            expected: "pass",
            minutes: 10,
            signalCode: "",
            formula: ""
          }
        },
        nextStepId: null, // Конец workflow
        reworkTargetId: null,
        parallelTargets: [],
        position: { x: 300, y: 220 }
      }
    ]
  },
  {
    id: 2,
    name: "Complex Multi-Branch Process",
    formulaId: 1, // Также использует формулу "Tablet A"
    version: "2.0", 
    status: "review",
    createdDate: "2025-10-10",
    steps: [
      {
        id: 2001,
        name: "Initial Weighing",
        type: "weighing",
        formulaBomId: 1, // API
        equipmentId: 1,
        workStationId: 1,
        instruction: "Weigh main API component",
        stepParameters: { 
          targetWeight: 250, 
          tolerance: 1, 
          unit: "mg" 
        },
        qcParameters: {},
        transition: {
          mode: "parallel", // Параллельные ветки после взвешивания
          allowManualOverride: true,
          condition: {
            type: "qc_result",
            qcParam: "weight",
            expected: "pass",
            minutes: 10,
            signalCode: "",
            formula: ""
          }
        },
        nextStepId: null,
        reworkTargetId: null,
        parallelTargets: [2002, 2003], // Два параллельных шага
        position: { x: 200, y: 100 }
      },
      {
        id: 2002,
        name: "Branch A: Excipient Prep",
        type: "dispensing",
        formulaBomId: 2, // Excipient Beta
        equipmentId: 1,
        workStationId: 1,
        instruction: "Prepare excipient for branch A",
        stepParameters: { 
          targetWeight: 100, 
          tolerance: 1, 
          unit: "mg" 
        },
        qcParameters: {},
        transition: {
          mode: "automatic",
          allowManualOverride: true,
          condition: {
            type: "qc_result",
            qcParam: "weight",
            expected: "pass",
            minutes: 10,
            signalCode: "",
            formula: ""
          }
        },
        nextStepId: 2004, // Сходится в общем шаге
        reworkTargetId: null,
        parallelTargets: [],
        position: { x: 100, y: 250 }
      },
      {
        id: 2003,
        name: "Branch B: Lubricant Prep", 
        type: "dispensing",
        formulaBomId: 3, // Lubricant Gamma
        equipmentId: 1,
        workStationId: 1,
        instruction: "Prepare lubricant for branch B",
        stepParameters: { 
          targetWeight: 25, 
          tolerance: 0.5, 
          unit: "mg" 
        },
        qcParameters: {},
        transition: {
          mode: "automatic",
          allowManualOverride: true,
          condition: {
            type: "qc_result",
            qcParam: "weight",
            expected: "pass",
            minutes: 10,
            signalCode: "",
            formula: ""
          }
        },
        nextStepId: 2004, // Сходится в общем шаге
        reworkTargetId: null,
        parallelTargets: [],
        position: { x: 300, y: 250 }
      },
      {
        id: 2004,
        name: "Combine & Mix",
        type: "mixing",
        formulaBomId: null, // Смешивание всех компонентов
        equipmentId: 2,
        workStationId: 2,
        instruction: "Combine all prepared materials and mix",
        stepParameters: { 
          duration: 45, 
          rpm: 80, 
          temperature: 22 
        },
        qcParameters: {},
        transition: {
          mode: "conditional",
          allowManualOverride: false,
          condition: {
            type: "time_elapsed",
            qcParam: "",
            expected: "pass",
            minutes: 45,
            signalCode: "",
            formula: ""
          }
        },
        nextStepId: 2005,
        reworkTargetId: null,
        parallelTargets: [],
        position: { x: 200, y: 400 }
      },
      {
        id: 2005,
        name: "Quality Check with Rework",
        type: "qc",
        formulaBomId: null,
        equipmentId: null,
        workStationId: 2,
        instruction: "Final quality check - may require rework",
        stepParameters: {},
        qcParameters: { 
          parameter: "Blend Uniformity", 
          min: 98, 
          max: 102, 
          unit: "%" 
        },
        transition: {
          mode: "conditional",
          allowManualOverride: true,
          condition: {
            type: "qc_result",
            qcParam: "uniformity",
            expected: "fail", // Если fail, идет на rework
            minutes: 10,
            signalCode: "",
            formula: ""
          }
        },
        reworkTargetId: 2004, // Возврат на смешивание при неудаче
        nextStepId: null, // При успехе - конец
        parallelTargets: [],
        position: { x: 200, y: 520 }
      }
    ]
  },
  {
    id: 3,
    name: "Vitamin Production Draft",
    formulaId: null, // Пример workflow без привязки к формуле
    version: "0.5",
    status: "draft",
    createdDate: "2025-10-01",
    steps: [
      {
        id: 3001,
        name: "Prepare Workspace",
        type: "process",
        formulaBomId: null,
        equipmentId: null,
        workStationId: 1,
        instruction: "Clean and prepare dispensing area",
        stepParameters: {},
        qcParameters: {},
        transition: {
          mode: "manual",
          allowManualOverride: true,
          condition: {
            type: "qc_result",
            qcParam: "cleanliness",
            expected: "pass",
            minutes: 10,
            signalCode: "",
            formula: ""
          }
        },
        nextStepId: 3002,
        reworkTargetId: null,
        parallelTargets: [],
        position: { x: 100, y: 100 }
      },
      {
        id: 3002,
        name: "Vitamin Dosing",
        type: "dispensing",
        formulaBomId: null, // Не выбрано, так как формула не привязана
        equipmentId: 1,
        workStationId: 1,
        instruction: "Dispense vitamin powder - formula TBD",
        stepParameters: { 
          targetWeight: 100, 
          tolerance: 1, 
          unit: "mg" 
        },
        qcParameters: {},
        transition: {
          mode: "automatic",
          allowManualOverride: true,
          condition: {
            type: "qc_result",
            qcParam: "weight",
            expected: "pass",
            minutes: 10,
            signalCode: "",
            formula: ""
          }
        },
        nextStepId: null,
        reworkTargetId: null,
        parallelTargets: [],
        position: { x: 100, y: 220 }
      }
    ]
  }
];

// Конвертируем базовые workflows в полный формат с nodes и edges
export const initialWorkflows = baseWorkflows.map(wf => {
  try {
    const converted = stepsToGraph(wf);
    console.log(`✅ Converted workflow ${wf.id}: ${wf.steps.length} steps -> ${converted.nodes?.length || 0} nodes`);
    return converted;
  } catch (error) {
    console.error(`❌ Failed to convert workflow ${wf.id}:`, error);
    return wf; // Возвращаем оригинал если конвертация не удалась
  }
});

// Вспомогательные функции для работы с BOM
export const getBomItemsForFormula = (formulaId, formulas) => {
  const formula = formulas.find(f => f.id === formulaId);
  return formula ? formula.bom || [] : [];
};

export const getBomItemName = (formulaBomId, formulas, formulaId) => {
  if (!formulaBomId || !formulaId) return null;
  
  const formula = formulas.find(f => f.id === formulaId);
  if (!formula) return null;
  
  const bomItem = formula.bom?.find(b => b.id === formulaBomId);
  return bomItem ? `${bomItem.materialArticle} (${bomItem.quantity}${bomItem.unit})` : null;
};

// Валидация связи BOM с формулой
export const validateBomReference = (step, workflow, formulas) => {
  if (!step.formulaBomId || !workflow.formulaId) return true;
  
  const formula = formulas.find(f => f.id === workflow.formulaId);
  if (!formula) return false;
  
  return formula.bom?.some(b => b.id === step.formulaBomId) || false;
};

// Типы шагов, которые поддерживают BOM привязку
export const stepTypesWithBomSupport = ["dispensing", "weighing"];

// Проверить нужно ли показывать BOM dropdown для типа шага
export const shouldShowBomDropdown = (stepType) => {
  return stepTypesWithBomSupport.includes(stepType);
};