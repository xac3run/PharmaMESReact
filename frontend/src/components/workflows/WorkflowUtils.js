// components/workflows/WorkflowUtils.js
/* -------------------------------------------------------------------------- */
/*                         WORKFLOW SYNC UTILITIES                            */
/* -------------------------------------------------------------------------- */

// Конвертация таблицы → граф
export const stepsToGraph = (workflow) => {
  if (!workflow?.steps) return workflow;

  const nodes = [];
  const edges = [];

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
