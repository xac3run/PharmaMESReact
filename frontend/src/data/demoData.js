// Role Permissions
export const rolePermissions = {
  "Admin": {
    canCreateBatch: true,
    canStartBatch: true,
    canExecuteSteps: true,
    canApproveFormulas: true,
    canCreateFormulas: true,
    canCreateWorkflows: true,
    canApproveWorkflows: true,
    canManageMaterials: true,
    canValidateMaterials: true,
    canManageEquipment: true,
    canManageWorkStations: true,
    canManagePersonnel: true,
    canCreateUsers: true,
    canViewAudit: true,
    canExportReports: true,
    canManageRoles: true,
    canManageCAPAs: true,
    canViewGenealogy: true,
    allWorkStations: true
  },
  "Master": {
    canCreateBatch: false,
    canStartBatch: false,
    canExecuteSteps: true,
    canApproveFormulas: true,
    canCreateFormulas: true,
    canCreateWorkflows: true,
    canApproveWorkflows: true,
    canManageMaterials: false,
    canValidateMaterials: false,
    canManageEquipment: false,
    canManageWorkStations: false,
    canManagePersonnel: false,
    canCreateUsers: false,
    canViewAudit: true,
    canExportReports: true,
    canManageRoles: false,
    canManageCAPAs: false,
    canViewGenealogy: true,
    allWorkStations: true
  },
  "Planner": {
    canCreateBatch: true,
    canStartBatch: true,
    canExecuteSteps: false,
    canApproveFormulas: false,
    canCreateFormulas: false,
    canCreateWorkflows: false,
    canApproveWorkflows: false,
    canManageMaterials: false,
    canValidateMaterials: false,
    canManageEquipment: false,
    canManageWorkStations: false,
    canManagePersonnel: false,
    canCreateUsers: false,
    canViewAudit: true,
    canExportReports: true,
    canManageRoles: false,
    canManageCAPAs: false,
    canViewGenealogy: true,
    allWorkStations: false
  },
  "QA": {
    canCreateBatch: false,
    canStartBatch: false,
    canExecuteSteps: true,
    canApproveFormulas: true,
    canCreateFormulas: false,
    canCreateWorkflows: false,
    canApproveWorkflows: true,
    canManageMaterials: true,
    canValidateMaterials: true,
    canManageEquipment: false,
    canManageWorkStations: false,
    canManagePersonnel: false,
    canCreateUsers: false,
    canViewAudit: true,
    canExportReports: true,
    canManageRoles: false,
    canManageCAPAs: true,
    canViewGenealogy: true,
    allWorkStations: true
  },
  "Operator": {
    canCreateBatch: false,
    canStartBatch: false,
    canExecuteSteps: true,
    canApproveFormulas: false,
    canCreateFormulas: false,
    canCreateWorkflows: false,
    canApproveWorkflows: false,
    canManageMaterials: false,
    canValidateMaterials: false,
    canManageEquipment: false,
    canManageWorkStations: false,
    canManagePersonnel: false,
    canCreateUsers: false,
    canViewAudit: false,
    canExportReports: false,
    canManageRoles: false,
    canManageCAPAs: false,
    canViewGenealogy: false,
    allWorkStations: false
  }
};

export const initialFormulas = [
  {
    id: 1,
    articleNumber: "ART-001",
    productName: "Tablet A",
    weightPerUnit: 500,
    productType: "dosing",
    status: "approved",
    version: "1.0",
    bom: [
      { id: 1, materialArticle: "MAT-001", quantity: 250, unit: "mg", min: 245, max: 255, type: "raw_material" },
      { id: 2, materialArticle: "MAT-002", quantity: 200, unit: "mg", min: 195, max: 205, type: "raw_material" },
      { id: 3, materialArticle: "MAT-003", quantity: 50, unit: "mg", min: 48, max: 52, type: "raw_material" }
    ]
  }
];

export const initialMaterials = [
  {
    id: 1,
    articleNumber: "MAT-001",
    name: "API Powder Alpha",
    status: "validated",
    quantity: 50000,
    unit: "g",
    location: "Warehouse A-1",
    expiryDate: "2026-12-31",
    receivedDate: "2025-01-15",
    supplier: "Supplier A",
    lotNumber: "LOT-2025-001",
    coa: "COA-2025-001",
    quarantineTests: []
  },
  {
    id: 2,
    articleNumber: "MAT-002",
    name: "Excipient Beta",
    status: "quarantine",
    quantity: 25000,
    unit: "g",
    location: "Quarantine Zone",
    expiryDate: "2025-12-31",
    receivedDate: "2025-10-01",
    supplier: "Supplier B",
    lotNumber: "LOT-2025-002",
    coa: null,
    quarantineTests: [
      { test: "Identity", status: "pending", result: null },
      { test: "Purity", status: "pending", result: null },
      { test: "Moisture", status: "pending", result: null }
    ]
  },
  {
    id: 3,
    articleNumber: "MAT-003",
    name: "Lubricant Gamma",
    status: "validated",
    quantity: 10000,
    unit: "g",
    location: "Warehouse B-3",
    expiryDate: "2026-06-30",
    receivedDate: "2025-02-20",
    supplier: "Supplier C",
    lotNumber: "LOT-2025-003",
    coa: "COA-2025-003",
    quarantineTests: []
  }
];

export const equipmentClasses = {
  "Weighing": ["Precision Balance", "Analytical Balance", "Platform Scale"],
  "Mixing": ["Planetary Mixer", "High Shear Mixer", "V-Blender"],
  "Granulation": ["Wet Granulator", "Dry Granulator", "Fluid Bed"],
  "Coating": ["Pan Coater", "Fluid Bed Coater"],
  "Packaging": ["Blister Machine", "Bottle Filler", "Cartoner"]
};

export const initialEquipment = [
  {
    id: 1,
    name: "Balance-01",
    class: "Weighing",
    subclass: "Precision Balance",
    status: "operational",
    currentBatch: null,
    lastBatch: null,
    location: "Room 101",
    serialNumber: "BAL-2024-001",
    manufacturer: "Mettler Toledo",
    model: "XPE5003",
    installDate: "2024-01-15",
    calibrationDue: "2025-11-01",
    lastMaintenance: "2025-09-15",
    maintenanceInterval: 90,
    globalParameters: { 
      maxCapacity: 5000, 
      precision: 0.01,
      unit: "g"
    }
  },
  {
    id: 2,
    name: "Mixer-01",
    class: "Mixing",
    subclass: "Planetary Mixer",
    status: "operational",
    currentBatch: null,
    lastBatch: null,
    location: "Room 102",
    serialNumber: "MIX-2024-001",
    manufacturer: "Pharma Mix Inc",
    model: "PM-500",
    installDate: "2024-02-20",
    calibrationDue: "2025-12-01",
    lastMaintenance: "2025-08-20",
    maintenanceInterval: 180,
    globalParameters: { 
      volume: 50, 
      rpmRange: [10, 200],
      temperature: [15, 25],
      unit: "L"
    }
  },
  {
    id: 3,
    name: "Granulator-01",
    class: "Granulation",
    subclass: "Wet Granulator",
    status: "maintenance",
    currentBatch: null,
    lastBatch: "B-2025-099",
    location: "Room 103",
    serialNumber: "GRAN-2023-001",
    manufacturer: "GranTech",
    model: "WT-100",
    installDate: "2023-11-10",
    calibrationDue: "2025-10-15",
    lastMaintenance: "2025-10-01",
    maintenanceInterval: 120,
    globalParameters: {
      capacity: 100,
      rpmRange: [50, 300],
      unit: "kg"
    }
  }
];

export const initialWorkStations = [
  { 
    id: 1, 
    name: "Dispensing Station 1", 
    processes: ["dispensing", "weighing"], 
    equipmentIds: [1],
    location: "Room 101"
  },
  { 
    id: 2, 
    name: "Mixing Station 1", 
    processes: ["mixing"], 
    equipmentIds: [2],
    location: "Room 102"
  },
  {
    id: 3,
    name: "Granulation Station 1",
    processes: ["granulation"],
    equipmentIds: [3],
    location: "Room 103"
  }
];

export const initialWorkflows = [
  {
    id: 1,
    name: "Standard Tablet Production",
    formulaId: 1,
    version: "1.0",
    status: "approved",
    createdDate: "2025-09-01",
    steps: [
      {
        id: 1,
        name: "Dispense API",
        type: "dispensing",
        formulaBomId: 1,
        equipmentId: 1,
        workStationId: 1,
        requiresQC: false,
        instruction: "Dispense API according to formula",
        stepParameters: { targetWeight: 250, tolerance: 2, unit: "mg" }
      },
      {
        id: 2,
        name: "Dispense Excipient",
        type: "dispensing",
        formulaBomId: 2,
        equipmentId: 1,
        workStationId: 1,
        requiresQC: false,
        instruction: "Dispense Excipient according to formula",
        stepParameters: { targetWeight: 200, tolerance: 2, unit: "mg" }
      },
      {
        id: 3,
        name: "QC - Weight Check",
        type: "qc",
        equipmentId: 1,
        workStationId: 1,
        requiresQC: true,
        instruction: "Verify total weight of dispensed materials",
        qcParameters: { parameter: "Total Weight", min: 445, max: 455, unit: "mg" }
      },
      {
        id: 4,
        name: "Mixing",
        type: "process",
        equipmentId: 2,
        workStationId: 2,
        requiresQC: false,
        instruction: "Mix for 30 minutes at specified RPM",
        stepParameters: { duration: 30, rpm: 60, temperature: 20 }
      },
      {
        id: 5,
        name: "QC - Homogeneity Test",
        type: "qc",
        equipmentId: null,
        workStationId: 2,
        requiresQC: true,
        instruction: "Test mixture homogeneity",
        qcParameters: { parameter: "Homogeneity", min: 95, max: 100, unit: "%" }
      }
    ]
  }
];

export const initialPersonnel = [
  {
    id: 0,
    name: "System Admin",
    role: "Admin",
    department: "IT",
    status: "active",
    certifications: ["System Administrator", "GMP Advanced"],
    allowedWorkStations: [1, 2, 3],
    shifts: []
  },
  {
    id: 1,
    name: "John Operator",
    role: "Operator",
    department: "Production",
    status: "active",
    certifications: ["GMP Basic", "Weighing Operations"],
    allowedWorkStations: [1, 2],
    shifts: []
  },
  {
    id: 2,
    name: "Anna QA",
    role: "QA",
    department: "Quality",
    status: "active",
    certifications: ["GMP Advanced", "QC Methods"],
    allowedWorkStations: [1, 2, 3],
    shifts: []
  }
];

export const initialBatches = [
  {
    id: "B-2025-001",
    formulaId: 1,
    workflowId: 1,
    targetQuantity: 1000,
    status: "completed",
    priority: "normal",
    progress: 100,
    currentStep: null,
    currentStepIndex: 5,
    history: [],
    materialConsumption: [],
    createdDate: "2025-10-03",
    createdBy: "System",
    completedAt: "2025-10-05T10:00:00Z",
    startedBy: "John Operator"
  },
  {
    id: "B-2025-002",
    formulaId: 1,
    workflowId: 1,
    targetQuantity: 500,
    status: "in_progress",
    priority: "high",
    progress: 60,
    currentStep: 3,
    currentStepIndex: 2,
    history: [],
    materialConsumption: [],
    createdDate: "2025-10-02",
    createdBy: "System",
    startedAt: "2025-10-03T08:30:00Z",
    startedBy: "John Operator"
  }
];

export const initialShifts = [
  {
    id: 1,
    date: "2025-10-03",
    shiftType: "Day Shift",
    startTime: "08:00",
    endTime: "16:00",
    assignedPersonnel: [1],
    workStationId: 1
  },
  {
    id: 2,
    date: "2025-10-03",
    shiftType: "Day Shift",
    startTime: "08:00",
    endTime: "16:00",
    assignedPersonnel: [2],
    workStationId: 2
  }
];

export const initialCleaningRecords = [];
export const initialChangeControls = [];
export const initialCAPAs = [];
export const initialEquipmentLogs = [];
export const initialDeviations = [];
export const initialComplaints = [];
export const initialSOPs = [];
export const initialEnvRecords = [];
export const initialValidations = [];
export const initialAPRs = [];

// 🆕 --- DEMO DATA FOR NEW MODULES ---
// Product Disposition demo
export const initialDispositions = [
  {
    id: "DISP-001",
    type: "batch",
    itemId: "B-2025-001",
    product: "Tablet A",
    decision: "release",
    reason: "All QC tests passed successfully",
    decidedBy: "Anna QA",
    decidedAt: "2025-10-06T09:30:00Z",
    signature: { user: "Anna QA", timestamp: "2025-10-06T09:30:00Z" }
  },
  {
    id: "DISP-002",
    type: "material",
    itemId: "MAT-002",
    product: "Excipient Beta",
    decision: "quarantine",
    reason: "Awaiting microbiological testing",
    decidedBy: "Anna QA",
    decidedAt: "2025-10-07T11:00:00Z",
    signature: { user: "Anna QA", timestamp: "2025-10-07T11:00:00Z" }
  }
];

// 🆕 Investigations demo
export const initialInvestigations = [
  {
    id: "INV-2025-001",
    title: "Deviation during weight check",
    description: "Batch B-2025-001 showed out-of-spec weight at step 3.",
    type: "deviation",
    priority: "high",
    initiator: "Anna QA",
    initiatedDate: "2025-10-07T12:00:00Z",
    status: "evidence_collected",
    targetCloseDate: "2025-11-10",
    relatedDeviations: ["DEV-001"],
    relatedBatches: ["B-2025-001"],
    workflow: [
      { step: "Initiation", status: "completed", completedBy: "Anna QA", date: "2025-10-07T12:00:00Z", notes: "" },
      { step: "Evidence Collection", status: "completed", completedBy: "Anna QA", date: "2025-10-07T14:00:00Z", notes: "QC logs and instrument calibration checked." },
      { step: "Root Cause Analysis", status: "active", completedBy: null, date: null, notes: "" },
      { step: "Impact Assessment", status: "pending", completedBy: null, date: null, notes: "" },
      { step: "Recommendations", status: "pending", completedBy: null, date: null, notes: "" },
      { step: "Review & Approval", status: "pending", completedBy: null, date: null, notes: "" },
      { step: "CAPA Generation", status: "pending", completedBy: null, date: null, notes: "" },
      { step: "Closure", status: "pending", completedBy: null, date: null, notes: "" }
    ],
    evidenceCollected: [
      { id: 1, description: "QC Weight Log Screenshot", source: "MES system", collectedBy: "Anna QA", collectedDate: "2025-10-07T13:00:00Z", type: "document" },
      { id: 2, description: "Balance calibration report", source: "QA Lab", collectedBy: "Anna QA", collectedDate: "2025-10-07T13:20:00Z", type: "file" }
    ],
    assignedTo: "QA Department",
    investigationLead: "Anna QA"
  },
  {
    id: "INV-2025-002",
    title: "Material Beta – delayed release",
    description: "Excipient Beta awaiting test results beyond standard quarantine period.",
    type: "material",
    priority: "medium",
    initiator: "John Operator",
    initiatedDate: "2025-10-08T10:00:00Z",
    status: "initiated",
    targetCloseDate: "2025-11-15",
    relatedDeviations: [],
    relatedBatches: [],
    workflow: [
      { step: "Initiation", status: "completed", completedBy: "John Operator", date: "2025-10-08T10:00:00Z", notes: "QA notified." },
      { step: "Evidence Collection", status: "pending", completedBy: null, date: null, notes: "" }
    ],
    evidenceCollected: [],
    assignedTo: "QA Department",
    investigationLead: "Anna QA"
  }
];
// Add to existing demoData.js - NEW EXPORTS

// Stability Studies
export const initialStabilityStudies = [
  {
    id: 'STAB-001',
    batchId: 'B-2025-001',
    product: 'Tablet A',
    startDate: '2025-10-01',
    duration: 24,
    status: 'active',
    conditions: [
      {
        id: 1,
        name: '25°C/60%RH',
        type: 'long_term',
        temperature: 25,
        humidity: 60,
        description: 'Long-term storage condition'
      },
      {
        id: 2,
        name: '40°C/75%RH',
        type: 'accelerated',
        temperature: 40,
        humidity: 75,
        description: 'Accelerated storage condition'
      }
    ],
    pullSchedule: [0, 3, 6, 12, 18, 24],
    samples: [
      {
        id: 'STAB-001-1-M0',
        conditionId: 1,
        conditionName: '25°C/60%RH',
        timepoint: 0,
        scheduledPullDate: '2025-10-01T00:00:00Z',
        status: 'tested',
        pulledDate: '2025-10-01T00:00:00Z',
        pulledBy: 'Anna QA',
        storageLocation: 'Stability Chamber 1',
        tests: [
          { name: 'Appearance', result: 'White', status: 'pass', spec: 'White to off-white' },
          { name: 'Assay (%)', result: 100.2, status: 'pass', spec: '95.0-105.0', min: 95.0, max: 105.0 },
          { name: 'Impurities (%)', result: 0.8, status: 'pass', spec: 'NMT 2.0', max: 2.0 },
          { name: 'Dissolution (%)', result: 95.0, status: 'pass', spec: 'NLT 80% in 30 min', min: 80.0 }
        ]
      },
      {
        id: 'STAB-001-1-M3',
        conditionId: 1,
        conditionName: '25°C/60%RH',
        timepoint: 3,
        scheduledPullDate: '2026-01-01T00:00:00Z',
        status: 'scheduled',
        pulledDate: null,
        pulledBy: null,
        storageLocation: 'Stability Chamber 1',
        tests: [
          { name: 'Appearance', result: null, status: 'pending', spec: 'White to off-white' },
          { name: 'Assay (%)', result: null, status: 'pending', spec: '95.0-105.0', min: 95.0, max: 105.0 },
          { name: 'Impurities (%)', result: null, status: 'pending', spec: 'NMT 2.0', max: 2.0 },
          { name: 'Dissolution (%)', result: null, status: 'pending', spec: 'NLT 80% in 30 min', min: 80.0 }
        ]
      }
    ],
    initiatedBy: 'Anna QA',
    initiatedDate: '2025-10-01T00:00:00Z'
  }
];

// Training Records
export const initialTrainingRecords = [
  {
    id: 1,
    personnelId: 1,
    topicId: 'GMP_BASIC',
    topicName: 'GMP Basic Training',
    completedDate: '2025-01-15',
    score: 95,
    trainer: 'Training Department',
    status: 'passed',
    recordedBy: 'System Admin',
    recordedDate: '2025-01-15T00:00:00Z'
  },
  {
    id: 2,
    personnelId: 1,
    topicId: 'WEIGHING',
    topicName: 'Weighing Operations',
    completedDate: '2025-02-10',
    score: 88,
    trainer: 'Master Trainer',
    status: 'passed',
    recordedBy: 'System Admin',
    recordedDate: '2025-02-10T00:00:00Z'
  },
  {
    id: 3,
    personnelId: 2,
    topicId: 'GMP_ADV',
    topicName: 'GMP Advanced',
    completedDate: '2024-11-20',
    score: 92,
    trainer: 'QA Manager',
    status: 'passed',
    recordedBy: 'System Admin',
    recordedDate: '2024-11-20T00:00:00Z'
  },
  {
    id: 4,
    personnelId: 2,
    topicId: 'QC_METHODS',
    topicName: 'QC Testing Methods',
    completedDate: '2025-01-05',
    score: 98,
    trainer: 'QC Lab Manager',
    status: 'passed',
    recordedBy: 'System Admin',
    recordedDate: '2025-01-05T00:00:00Z'
  }
];

// UPDATE existing initialBatches to include new fields
export const updatedInitialBatches = [
  {
    id: "B-2025-001",
    formulaId: 1,
    workflowId: 1,
    targetQuantity: 1000,
    actualYield: 980,
    status: "completed",
    priority: "normal",
    progress: 100,
    currentStep: null,
    currentStepIndex: 5,
    history: [
      {
        stepId: 1,
        stepName: "Dispense API",
        value: "250.1g",
        lotNumber: "LOT-2025-001",
        completedBy: "John Operator",
        timestamp: "2025-10-03T09:00:00Z",
        workStation: "Dispensing Station 1",
        equipmentUsed: "Balance-01",
        equipmentParameters: { precision: 0.01, temperature: 21.5 }
      },
      {
        stepId: 2,
        stepName: "Dispense Excipient",
        value: "200.0g",
        lotNumber: "LOT-2025-002",
        completedBy: "John Operator",
        timestamp: "2025-10-03T09:15:00Z",
        workStation: "Dispensing Station 1",
        equipmentUsed: "Balance-01",
        equipmentParameters: { precision: 0.01, temperature: 21.5 }
      },
      {
        stepId: 3,
        stepName: "QC - Weight Check",
        value: "450.1g",
        lotNumber: null,
        completedBy: "Anna QA",
        timestamp: "2025-10-03T09:30:00Z",
        workStation: "Dispensing Station 1",
        equipmentUsed: "Balance-01",
        equipmentParameters: { precision: 0.01, temperature: 21.5 }
      },
      {
        stepId: 4,
        stepName: "Mixing",
        value: "CONFIRMED",
        lotNumber: null,
        completedBy: "John Operator",
        timestamp: "2025-10-03T10:00:00Z",
        workStation: "Mixing Station 1",
        equipmentUsed: "Mixer-01",
        equipmentParameters: { rpm: 60, temperature: 20, duration: 30 }
      },
      {
        stepId: 5,
        stepName: "QC - Homogeneity Test",
        value: "98.5%",
        lotNumber: null,
        completedBy: "Anna QA",
        timestamp: "2025-10-03T10:45:00Z",
        workStation: "Mixing Station 1",
        equipmentUsed: null,
        equipmentParameters: null
      }
    ],
    materialConsumption: [
      {
        stepId: 1,
        materialArticle: "MAT-001",
        quantity: 250.1,
        unit: "g",
        lotNumber: "LOT-2025-001",
        timestamp: "2025-10-03T09:00:00Z"
      },
      {
        stepId: 2,
        materialArticle: "MAT-002",
        quantity: 200.0,
        unit: "g",
        lotNumber: "LOT-2025-002",
        timestamp: "2025-10-03T09:15:00Z"
      }
    ],
    qcResults: [
      { test: "Weight Check", result: 450.1, unit: "g", min: 445, max: 455, pass: true },
      { test: "Homogeneity", result: 98.5, unit: "%", min: 95, max: 100, pass: true }
    ],
    createdDate: "2025-10-03",
    createdBy: "System",
    startedAt: "2025-10-03T08:30:00Z",
    completedAt: "2025-10-05T10:00:00Z",
    startedBy: "John Operator",
    yieldReconciliation: {
      actualYield: 980,
      yieldPercentage: 98.0,
      deviation: 2.0,
      materialBalance: {
        totalInput: 450.1,
        expectedOutput: 1000,
        actualOutput: 980,
        loss: 20,
        lossPercentage: 2.0
      },
      status: 'reconciled',
      reconciledBy: 'Anna QA',
      reconciledAt: '2025-10-05T11:00:00Z'
    },
    cleaningVerified: true,
    releaseInfo: {
      releasedBy: 'Anna QA',
      releasedAt: '2025-10-06T09:30:00Z',
      certificateOfAnalysis: {
        batchNumber: 'B-2025-001',
        product: 'Tablet A',
        articleNumber: 'ART-001',
        formulaVersion: '1.0',
        manufacturingDate: '2025-10-03T08:30:00Z',
        expiryDate: '2027-10-03',
        quantity: 980,
        unit: 'units',
        qcResults: [
          { test: "Weight Check", result: 450.1, unit: "g", min: 445, max: 455, pass: true },
          { test: "Homogeneity", result: 98.5, unit: "%", min: 95, max: 100, pass: true }
        ],
        releaseDate: '2025-10-06T09:30:00Z',
        releasedBy: 'Anna QA'
      }
    }
  },
  {
    id: "B-2025-002",
    formulaId: 1,
    workflowId: 1,
    targetQuantity: 500,
    status: "in_progress",
    priority: "high",
    progress: 60,
    currentStep: 3,
    currentStepIndex: 2,
    history: [
      {
        stepId: 1,
        stepName: "Dispense API",
        value: "125.0g",
        lotNumber: "LOT-2025-001",
        completedBy: "John Operator",
        timestamp: "2025-10-08T09:00:00Z",
        workStation: "Dispensing Station 1",
        equipmentUsed: "Balance-01"
      },
      {
        stepId: 2,
        stepName: "Dispense Excipient",
        value: "100.0g",
        lotNumber: "LOT-2025-002",
        completedBy: "John Operator",
        timestamp: "2025-10-08T09:15:00Z",
        workStation: "Dispensing Station 1",
        equipmentUsed: "Balance-01"
      }
    ],
    materialConsumption: [],
    qcResults: [],
    createdDate: "2025-10-08",
    createdBy: "System",
    startedAt: "2025-10-08T08:30:00Z",
    startedBy: "John Operator"
  }
];

// Function to help App.js integrate new data
export function initializeStabilityAndTraining() {
  return {
    stabilityStudies: initialStabilityStudies,
    trainingRecords: initialTrainingRecords
  };
}