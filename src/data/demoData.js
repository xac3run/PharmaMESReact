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
    bom: [
      { id: 1, item: "Aspirin API", quantity: 325, unit: "mg", lotNumber: "ASP-240101" },
      { id: 2, item: "Microcrystalline Cellulose", quantity: 100, unit: "mg", lotNumber: "MCC-240102" }
    ],
    steps: [
      {
        id: 1,
        name: "Weighing",
        type: "input",
        param: "Weight",
        min: 320,
        max: 330,
        instruction: "Weigh raw materials accurately using calibrated scale",
        materials: [
          { id: 1, item: "Aspirin API", quantity: 325, unit: "mg", lotNumber: "ASP-240101" },
          { id: 2, item: "Microcrystalline Cellulose", quantity: 100, unit: "mg", lotNumber: "MCC-240102" }
        ]
      },
      {
        id: 2,
        name: "Blending",
        type: "instruction",
        instruction: "Blend materials for 15 minutes at medium speed",
        materials: []
      },
      {
        id: 3,
        name: "Compression",
        type: "input",
        param: "Pressure",
        min: 800,
        max: 1200,
        instruction: "Compress tablets using tablet press at specified pressure",
        materials: []
      },
      {
        id: 4,
        name: "Visual QC",
        type: "control",
        param: "Defects",
        min: 0,
        max: 5,
        instruction: "Check for visual defects in sample of 100 tablets",
        materials: []
      }
    ]
  },
  {
    id: 2,
    name: "Paracetamol 500mg - Coating",
    version: "1.1",
    status: "draft",
    createdDate: "2024-01-05",
    bom: [
      { id: 1, item: "Paracetamol API", quantity: 500, unit: "mg", lotNumber: "PAR-240103" },
      { id: 2, item: "Coating Solution", quantity: 50, unit: "ml", lotNumber: "COAT-240104" }
    ],
    steps: [
      {
        id: 1,
        name: "Core Preparation",
        type: "instruction",
        instruction: "Prepare tablet cores according to standard procedure",
        materials: [
          { id: 1, item: "Paracetamol API", quantity: 500, unit: "mg", lotNumber: "PAR-240103" }
        ]
      },
      {
        id: 2,
        name: "Coating",
        type: "input",
        param: "Thickness",
        min: 50,
        max: 100,
        unit: "μm",
        instruction: "Apply coating solution until desired thickness",
        materials: [
          { id: 2, item: "Coating Solution", quantity: 50, unit: "ml", lotNumber: "COAT-240104" }
        ]
      }
    ]
  }
];

export const demoEquipment = [
  {
    id: 1,
    name: "Tablet Press #1",
    type: "Compression",
    status: "in_operation",
    location: "Production Hall A",
    lastCalibration: "2024-01-01",
    nextCalibration: "2024-04-01"
  },
  {
    id: 2,
    name: "Coating Pan #2",
    type: "Coating",
    status: "cleaning",
    location: "Production Hall B",
    lastCalibration: "2024-01-10",
    nextCalibration: "2024-04-10"
  },
  {
    id: 3,
    name: "Blender #3",
    type: "Mixing",
    status: "calibration",
    location: "Production Hall A",
    lastCalibration: "2024-01-15",
    nextCalibration: "2024-04-15"
  }
];

export const demoPersonnel = [
  {
    id: 1,
    name: "John Doe",
    role: "Operator",
    department: "Production",
    status: "active",
    lastTraining: "2024-01-01",
    certifications: ["GMP Basic", "Equipment Operation", "Safety Training"]
  },
  {
    id: 2,
    name: "Jane Smith",
    role: "QA",
    department: "Quality",
    status: "active",
    lastTraining: "2024-01-05",
    certifications: ["QC Methods", "HPLC Operation", "GMP Advanced"]
  },
  {
    id: 3,
    name: "Mike Johnson",
    role: "Supervisor",
    department: "Production",
    status: "training",
    lastTraining: "2024-01-20",
    certifications: ["Leadership", "GMP Advanced", "Process Management"]
  }
];

export const demoDeviations = [
  {
    id: 1,
    batchId: "BR-2024-003",
    description: "Temperature exceeded limits during compression",
    status: "pending",
    reportedBy: "Mike Johnson",
    reportedDate: "2024-01-20",
    investigator: null
  },
  {
    id: 2,
    batchId: "BR-2024-001",
    description: "Minor weight variance detected",
    status: "approved",
    reportedBy: "John Doe",
    reportedDate: "2024-01-18",
    investigator: "Jane Smith"
  }
];