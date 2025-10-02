export const demoBatches = [
  { id: "BR-2024-001", product: "Aspirin 325mg", status: "in_progress", progress: 65 },
  { id: "BR-2024-002", product: "Paracetamol 500mg", status: "completed", progress: 100 },
  { id: "BR-2024-003", product: "Ibuprofen 200mg", status: "deviation", progress: 45, deviation: "Temp exceeded" }
];

export const demoTemplates = [
  {
    id: 1,
    name: "Aspirin 325mg - Tableting",
    version: "1.0",
    status: "approved",
    createdDate: "2024-01-01",
    steps: [
      { id: 1, name: "Weighing", type: "input", param: "Weight", min: 320, max: 330, instruction: "Weigh raw materials accurately" },
      { id: 2, name: "Compression", type: "instruction", instruction: "Compress tablets" },
      { id: 3, name: "Visual QC", type: "control", param: "Defects", min: 0, max: 5, instruction: "Check for defects" }
    ]
  }
];

export const demoWorkflow = [];
export const demoEquipment = [
  { id: 1, name: "Tablet Press #1", type: "Compression", status: "in_operation", location: "Hall A" },
  { id: 2, name: "Coating Pan #2", type: "Coating", status: "cleaning", location: "Hall B" }
];
export const demoPersonnel = [
  { id: 1, name: "John Doe", role: "Operator", status: "active" },
  { id: 2, name: "Jane Smith", role: "QA Analyst", status: "active" }
];
export const demoDeviations = [
  { id: 1, batchId: "BR-2024-003", description: "Temperature exceeded", status: "pending", reportedBy: "John Doe" }
];
